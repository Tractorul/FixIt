export type SupportedOS = "Fedora" | "Ubuntu" | "Debian" | "Arch" | "Other" | "Unspecified";
export type SupportedShell = "Bash" | "Zsh" | "Fish" | "Other" | "Unspecified";
export type ConfidenceLevel = "high" | "medium" | "low";

export type SupportedLanguage =
  | "Python"
  | "JavaScript"
  | "TypeScript"
  | "Rust"
  | "Go"
  | "C / C++"
  | "Java"
  | "PHP"
  | "Bash / Shell"
  | "SQL"
  | "Ruby"
  | "Other";

export interface AnalyzeRequest {
  errorText: string;
  os?: SupportedOS;
  shell?: SupportedShell;
}

export interface FixItCommand {
  command: string;
  explanation: string;
  isDangerous?: boolean;
  dangerReason?: string;
}

export interface FixItResponse {
  summary: string;
  cause: string;
  fix: string;
  technology: string;
  commands: FixItCommand[];
  nextSteps: string[];
  confidence: ConfidenceLevel;
}

export interface CodeDebugRequest {
  code: string;
  language: SupportedLanguage;
  additionalContext?: string;
}

export interface CodeDebugResponse {
  language: string;
  errorType: string;
  detectedError: string;
  rootCause: string;
  fixedCode: string;
  diffExplanation: string[];
  commands: FixItCommand[];
  bestPractices: string[];
  confidence: ConfidenceLevel;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  technology: string;
  rawError: string;
  os?: SupportedOS;
  shell?: SupportedShell;
  result: FixItResponse;
}

export interface AIStatusResponse {
  configured: boolean;
  provider: "gemini" | "openai" | "local" | "custom" | "fallback";
  baseUrl: string;
  model: string;
  hasKey: boolean;
  message?: string;
  ping?: {
    success: boolean;
    latencyMs: number;
    error?: string;
  };
}

export interface CodeDebugHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  language: string;
  rawCode: string;
  result: CodeDebugResponse;
}
