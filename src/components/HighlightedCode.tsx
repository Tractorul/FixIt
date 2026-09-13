"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Highlighter } from "shiki";
import { SupportedLanguage } from "@/types";
import { useTheme } from "@/context/ThemeContext";

// Module-level highlighter singleton — shared across all component instances
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-dark-dimmed", "github-light"],
        langs: [
          "python",
          "javascript",
          "typescript",
          "rust",
          "go",
          "cpp",
          "java",
          "php",
          "bash",
          "sql",
          "ruby",
        ],
      })
    );
  }
  return highlighterPromise;
}

/** Maps SupportedLanguage display names to shiki language IDs */
function toShikiLang(language: string): string {
  const map: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    rust: "rust",
    go: "go",
    "c / c++": "cpp",
    java: "java",
    php: "php",
    "bash / shell": "bash",
    sql: "sql",
    ruby: "ruby",
  };
  return map[language.toLowerCase()] ?? "bash";
}

interface HighlightedCodeProps {
  code: string;
  language: SupportedLanguage | string;
  /** Extra className for the outer wrapper */
  className?: string;
}

export function HighlightedCode({ code, language, className = "" }: HighlightedCodeProps) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = useState<string | null>(null);
  const abortRef = useRef(false);

  const shikiTheme = resolvedTheme === "dark" ? "github-dark-dimmed" : "github-light";

  useEffect(() => {
    abortRef.current = false;
    let mounted = true;

    getHighlighter()
      .then((hl) => {
        if (!mounted || abortRef.current) return;
        const lang = toShikiLang(language);
        try {
          const rendered = hl.codeToHtml(code, {
            lang,
            theme: shikiTheme,
          });
          if (mounted) setHtml(rendered);
        } catch {
          // Language not loaded or highlight failed — leave html null to show fallback
        }
      })
      .catch(() => {
        // Ignore highlighter load failures — fallback to plain display
      });

    return () => {
      mounted = false;
    };
  }, [code, language, shikiTheme]);

  if (html) {
    return (
      <div
        className={`overflow-x-auto leading-relaxed text-sm ${className}`}
        // shiki inlines a full <pre> + <code> block with background and colors
        dangerouslySetInnerHTML={{ __html: html }}
        style={
          {
            // Override shiki's inline background so it matches our panel bg
            "--shiki-background": "transparent",
          } as React.CSSProperties
        }
      />
    );
  }

  // Fallback: plain monochrome code while highlighter loads or if it fails
  return (
    <pre
      className={`overflow-x-auto leading-relaxed text-sm font-mono ${
        resolvedTheme === "dark" ? "text-emerald-200" : "text-emerald-800"
      } ${className}`}
    >
      <code>{code}</code>
    </pre>
  );
}
