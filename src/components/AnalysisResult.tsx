"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  HelpCircle,
  Wrench,
  Terminal,
  ListChecks,
  Check,
  Share2,
  Cpu,
  Download,
  Copy,
  FileText,
} from "lucide-react";
import { FixItResponse } from "@/types";
import { CommandCard } from "./CommandCard";
import { useToast } from "@/components/Toast";

interface AnalysisResultProps {
  result: FixItResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);
  const [downloadedScript, setDownloadedScript] = useState(false);
  const [downloadedAnsible, setDownloadedAnsible] = useState(false);
  const { showToast } = useToast();

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            High Confidence
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Medium Confidence
          </span>
        );
      case "low":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Low Confidence
          </span>
        );
    }
  };

  const copyFullReport = async () => {
    const markdown = `# FixIt Analysis Report
## Detected Technology
${result.technology || "Linux / Generic"}

## What Happened
${result.summary}

## Why It Happened
${result.cause}

## Most Likely Fix
${result.fix}

## Suggested Commands
${result.commands
  .map(
    (c, i) =>
      `${i + 1}. \`${c.command}\`\n   - ${c.explanation}${
        c.isDangerous ? ` (⚠️ WARNING: ${c.dangerReason || "Potentially destructive"})` : ""
      }`
  )
  .join("\n\n")}

## What To Try Next
${result.nextSteps.map((step) => `- ${step}`).join("\n")}
`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedAll(true);
      showToast("Markdown report copied!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyJsonReport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedJson(true);
      showToast("JSON copied to clipboard!");
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyAllCommandsOnly = async () => {
    const script = result.commands.map((c) => `# ${c.explanation}\n${c.command}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(script);
      setCopiedCommands(true);
      showToast("All commands copied!");
      setTimeout(() => setCopiedCommands(false), 2000);
    } catch {
      // ignore
    }
  };

  const downloadRemediationScript = () => {
    const scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# FixIt Remediation Script
# Detected: ${result.technology || "Linux Error"}
# Generated: ${new Date().toISOString()}
#
# Review every line before executing!
# ==============================================================================
set -euo pipefail

echo "==> Starting FixIt Remediation..."
echo "Summary: ${result.summary.replace(/"/g, '\\"')}"

${result.commands
  .map((c, idx) => {
    if (c.isDangerous) {
      return `# Step ${idx + 1}: ${c.explanation}
# CAUTION: ${c.dangerReason || "Potentially destructive action"}
read -p "Execute dangerous step [${c.command}]? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "==> Running: ${c.command}"
  ${c.command}
else
  echo "==> Skipping dangerous step."
fi`;
    }
    return `# Step ${idx + 1}: ${c.explanation}
echo "==> Running: ${c.command}"
${c.command}`;
  })
  .join("\n\n")}

echo "==> Remediation steps completed."
`;

    const blob = new Blob([scriptContent], { type: "text/x-sh" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixit_remedy.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedScript(true);
    setTimeout(() => setDownloadedScript(false), 2000);
  };

  const downloadAnsiblePlaybook = () => {
    const playbookContent = `---
# ==============================================================================
# FixIt Remediation Ansible Playbook
# Detected Technology: ${result.technology || "Linux Error"}
# Summary: ${result.summary.replace(/"/g, '\\"')}
# ==============================================================================
- name: FixIt Remediation Playbook
  hosts: localhost
  gather_facts: true
  tasks:
${result.commands
  .map(
    (c, idx) => `    - name: "Step ${idx + 1} - ${c.explanation.replace(/"/g, '\\"')}"
      ansible.builtin.shell: "${c.command.replace(/"/g, '\\"')}"
      changed_when: true
${c.isDangerous ? "      # CAUTION: Potentially destructive task\n" : ""}`
  )
  .join("\n")}
`;

    const blob = new Blob([playbookContent], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixit_playbook.yml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedAnsible(true);
    setTimeout(() => setDownloadedAnsible(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner with Technology & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-sky-950/30 via-zinc-900/60 to-zinc-950/80 border border-sky-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Detected Ecosystem
            </div>
            <div className="text-sm font-semibold text-zinc-100 font-mono">
              {result.technology || "Linux System"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {getConfidenceBadge(result.confidence)}

          <button
            onClick={downloadRemediationScript}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              downloadedScript
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Export safe bash script with confirmation safeguards (.sh)"
          >
            {downloadedScript ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloaded .sh</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export .sh</span>
              </>
            )}
          </button>

          <button
            onClick={downloadAnsiblePlaybook}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              downloadedAnsible
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Export Ansible playbook (.yml)"
          >
            {downloadedAnsible ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloaded .yml</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Ansible</span>
              </>
            )}
          </button>

          <button
            onClick={copyFullReport}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              copiedAll
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Copy full analysis as formatted Markdown"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Markdown!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={copyJsonReport}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              copiedJson
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Copy raw JSON analysis"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied JSON!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Core Insights: What Happened & Why It Happened */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What Happened Card */}
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <h3>What happened</h3>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed font-normal">
            {result.summary}
          </p>
        </div>

        {/* Why It Happened Card */}
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3>Why it happened</h3>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed font-normal">
            {result.cause}
          </p>
        </div>
      </div>

        {/* Most Likely Fix Card */}
      <div className="rounded-xl bg-[#0c1220]/90 border border-emerald-500/20 p-5 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3>Most likely fix</h3>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed">
          {result.fix}
        </p>
      </div>

      {/* Commands Section */}
      {result.commands && result.commands.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3>Commands to review & copy</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={copyAllCommandsOnly}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                title="Copy all commands as a block"
              >
                {copiedCommands ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied all!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy all commands</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                • Manual review only
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {result.commands.map((cmd, idx) => (
              <CommandCard key={idx} commandItem={cmd} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* What to try next */}
      {result.nextSteps && result.nextSteps.length > 0 && (
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ListChecks className="w-4 h-4 text-amber-400 shrink-0" />
            <h3>What to try next</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-300">
            {result.nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 mt-2 shrink-0"></span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
