"use client";

import React, { useState } from "react";
import {
  Container,
  Check,
  Copy,
  Download,
  Terminal,
  ShieldCheck,
  Layers,
  MessageSquare,
} from "lucide-react";
import { DockerDoctorResponse } from "@/types";
import { useToast } from "@/components/Toast";
import { HighlightedCode } from "./HighlightedCode";
import { CommandCard } from "./CommandCard";
import { useChat } from "@/context/ChatContext";

interface DockerDoctorResultProps {
  result: DockerDoctorResponse;
}

export function DockerDoctorResult({ result }: DockerDoctorResultProps) {
  const { showToast } = useToast();
  const { openWithContext } = useChat();
  const [activeTab, setActiveTab] = useState<"dockerfile" | "compose" | "dockerignore">("dockerfile");
  const [copiedDockerfile, setCopiedDockerfile] = useState(false);
  const [copiedCompose, setCopiedCompose] = useState(false);

  const copyText = async (text: string, isCompose = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isCompose) {
        setCopiedCompose(true);
        setTimeout(() => setCopiedCompose(false), 2000);
      } else {
        setCopiedDockerfile(true);
        setTimeout(() => setCopiedDockerfile(false), 2000);
      }
      showToast(isCompose ? "docker-compose.yml copied!" : "Dockerfile copied!");
    } catch {
      // ignore
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-zinc-950/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Container className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Docker Architecture Plan
            </div>
            <div className="text-sm font-semibold text-zinc-100 font-mono">
              Production Multi-Stage Build
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const context = `Docker Architecture Summary: ${result.summary}\nDockerfile:\n${result.dockerfile}\n\nDocker Compose:\n${result.dockerCompose || "N/A"}`;
              openWithContext(context, "Can you help me customize and optimize this Docker configuration?");
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 transition-colors"
            title="Open Gemini AI copilot with this Docker context"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Gemini</span>
          </button>

          <button
            onClick={() => downloadFile(result.dockerfile, "Dockerfile")}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Dockerfile</span>
          </button>

          {result.dockerCompose && (
            <button
              onClick={() => downloadFile(result.dockerCompose!, "docker-compose.yml")}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download Compose</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-4 space-y-1.5 shadow-lg">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Container Architecture Summary</span>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* Multi-Tab Code Viewer */}
      <div className="rounded-xl bg-[#0c1220]/90 border border-cyan-500/30 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
          {/* Tab buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("dockerfile")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                activeTab === "dockerfile"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Dockerfile
            </button>

            {result.dockerCompose && (
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  activeTab === "compose"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                docker-compose.yml
              </button>
            )}

            {result.dockerIgnore && (
              <button
                type="button"
                onClick={() => setActiveTab("dockerignore")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  activeTab === "dockerignore"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                .dockerignore
              </button>
            )}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === "dockerfile") copyText(result.dockerfile);
              else if (activeTab === "compose" && result.dockerCompose) copyText(result.dockerCompose, true);
              else if (activeTab === "dockerignore" && result.dockerIgnore) copyText(result.dockerIgnore);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
          >
            {(activeTab === "dockerfile" ? copiedDockerfile : copiedCompose) ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Active File</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#05080f]">
          {activeTab === "dockerfile" && (
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 select-all">
              <HighlightedCode code={result.dockerfile} language="bash" />
            </div>
          )}

          {activeTab === "compose" && result.dockerCompose && (
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 select-all">
              <HighlightedCode code={result.dockerCompose} language="bash" />
            </div>
          )}

          {activeTab === "dockerignore" && result.dockerIgnore && (
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 select-all">
              <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                <code>{result.dockerIgnore}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Key Improvements */}
      {result.keyImprovements && result.keyImprovements.length > 0 && (
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>Key Security &amp; Performance Features</span>
          </div>

          <ul className="space-y-2 text-xs text-zinc-300">
            {result.keyImprovements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Run Commands */}
      {result.runCommands && result.runCommands.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm px-1">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3>Docker Build &amp; Deployment Commands</h3>
          </div>

          <div className="space-y-3">
            {result.runCommands.map((cmd, idx) => (
              <CommandCard key={idx} commandItem={cmd} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
