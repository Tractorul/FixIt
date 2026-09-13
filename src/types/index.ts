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

// ============================================================
// 1. Git Disaster Recovery ("Git Wizard") Types
// ============================================================
export interface GitWizardRequest {
  scenario?: string;
  customDescription?: string;
  gitStatusOutput?: string;
}

export interface GitWizardStep {
  stepNumber: number;
  title: string;
  command: string;
  explanation: string;
  isDangerous?: boolean;
  dangerReason?: string;
  verificationCommand?: string;
}

export interface GitWizardResponse {
  scenarioTitle: string;
  summary: string;
  whyThisWorks: string;
  steps: GitWizardStep[];
  emergencyFallback: string;
  confidence: ConfidenceLevel;
}

// ============================================================
// 2. CLI Copilot (Natural Language -> Shell) Types
// ============================================================
export interface CliCopilotRequest {
  query: string;
  os?: SupportedOS;
  shell?: SupportedShell;
}

export interface CliCommandBreakdown {
  part: string;
  meaning: string;
}

export interface CliCopilotResponse {
  primaryCommand: string;
  alternativeCommands: string[];
  explanation: string;
  breakdown: CliCommandBreakdown[];
  safetyLevel: "safe" | "caution" | "destructive";
  safetyNotes?: string;
  confidence: ConfidenceLevel;
}

// ============================================================
// 3. Docker & Compose Doctor Types
// ============================================================
export type DockerMode = "generate" | "debug";
export type DockerFramework =
  | "Next.js"
  | "Node.js (Express/Nest)"
  | "Python (FastAPI/Flask)"
  | "Go"
  | "Rust"
  | "Java (Spring)"
  | "PHP (Laravel)"
  | "Static HTML/Nginx"
  | "Custom";

export interface DockerDoctorRequest {
  mode: DockerMode;
  framework?: DockerFramework;
  descriptionOrError: string;
  existingDockerfile?: string;
  existingCompose?: string;
}

export interface DockerDoctorResponse {
  mode: DockerMode;
  summary: string;
  dockerfile: string;
  dockerCompose?: string;
  dockerIgnore?: string;
  keyImprovements: string[];
  runCommands: FixItCommand[];
  confidence: ConfidenceLevel;
}

// ============================================================
// 4. Config & Environment Transformer Types
// ============================================================
export type ConfigFormat = "env" | "json" | "yaml" | "toml" | "docker-compose-env";

export interface ConfigConverterRequest {
  sourceFormat: ConfigFormat;
  targetFormat: ConfigFormat;
  content: string;
  maskSecrets?: boolean;
}

export interface ConfigConverterResponse {
  sourceFormat: ConfigFormat;
  targetFormat: ConfigFormat;
  convertedContent: string;
  isValid: boolean;
  errors?: string[];
  detectedVariablesCount: number;
  maskedSecretsCount: number;
}

