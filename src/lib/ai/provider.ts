import { AnalyzeRequest, FixItResponse, AIStatusResponse, CodeDebugRequest, CodeDebugResponse } from "@/types";
import { sanitizeAndInspectCommands } from "./safety";
import { analyzeWithHeuristics } from "./heuristics";
import { debugCodeWithHeuristics } from "./codeHeuristics";
import { analyzeErrorWithGemini, debugCodeWithGemini } from "./gemini";
import { redactSensitiveData } from "@/lib/privacy/redact";

export interface AIConfig {
  providerType: "gemini" | "openai" | "local" | "custom" | "fallback";
  baseUrl: string;
  apiKey?: string;
  model: string;
  isCustomBaseUrl: boolean;
  hasKey: boolean;
}

export function getAIConfig(): AIConfig {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || process.env.GOOGLE_GENAI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || process.env.AI_MODEL?.trim() || "gemini-2.5-flash";

  const envBaseUrl = process.env.AI_BASE_URL?.trim();
  const openAiApiKey = process.env.AI_API_KEY?.trim();
  const openAiModel = process.env.AI_MODEL?.trim() || "gpt-4o-mini";

  // If Gemini key is set and provider is not forced to openai/local
  if (geminiKey && explicitProvider !== "openai" && explicitProvider !== "local") {
    return {
      providerType: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com",
      apiKey: geminiKey,
      model: geminiModel,
      isCustomBaseUrl: false,
      hasKey: true,
    };
  }

  const isCustomBaseUrl = Boolean(envBaseUrl);
  const baseUrl = envBaseUrl || "https://api.openai.com/v1";
  const hasKey = Boolean(openAiApiKey);

  let providerType: AIConfig["providerType"] = "fallback";
  if (isCustomBaseUrl) {
    providerType = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") ? "local" : "custom";
  } else if (hasKey) {
    providerType = "openai";
  }

  return {
    providerType,
    baseUrl,
    apiKey: openAiApiKey,
    model: openAiModel,
    isCustomBaseUrl,
    hasKey,
  };
}

export function getAIStatus(): AIStatusResponse {
  const config = getAIConfig();
  const isConfigured = config.hasKey || config.isCustomBaseUrl;

  let message = "";
  if (config.providerType === "gemini") {
    message = `Connected to Google Gemini (${config.model})`;
  } else if (config.providerType === "local") {
    message = `Connected to Local LLM (${config.baseUrl})`;
  } else if (config.providerType === "openai") {
    message = `Connected to OpenAI (${config.model})`;
  } else if (config.providerType === "custom") {
    message = `Connected to Custom API (${config.baseUrl})`;
  } else {
    message = "No AI backend configured (.env.local). Using built-in Linux diagnostic heuristics.";
  }

  return {
    configured: isConfigured,
    provider: config.providerType,
    baseUrl: config.baseUrl,
    model: config.model,
    hasKey: config.hasKey,
    message,
  };
}

export async function testAIConnection(): Promise<AIStatusResponse> {
  const baseStatus = getAIStatus();
  const config = getAIConfig();

  if (config.providerType === "fallback") {
    return {
      ...baseStatus,
      ping: {
        success: true,
        latencyMs: 0,
      },
    };
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    if (config.providerType === "gemini" && config.apiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey.trim()}`;
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `Gemini API error (HTTP ${res.status})`;
        try {
          const json = JSON.parse(text);
          if (json.error?.message) errMsg = json.error.message;
        } catch {
          // ignore
        }
        return {
          ...baseStatus,
          ping: { success: false, latencyMs, error: errMsg },
        };
      }

      return {
        ...baseStatus,
        ping: { success: true, latencyMs },
      };
    }

    const cleanBase = config.baseUrl.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
    const modelsEndpoint = `${cleanBase}/models`;
    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const res = await fetch(modelsEndpoint, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text();
      let errMsg = `Server returned HTTP ${res.status}`;
      try {
        const json = JSON.parse(text);
        if (json.error?.message) errMsg = json.error.message;
      } catch {
        // ignore
      }
      return {
        ...baseStatus,
        ping: { success: false, latencyMs, error: errMsg },
      };
    }

    return {
      ...baseStatus,
      ping: { success: true, latencyMs },
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : "Connection failed";
    return {
      ...baseStatus,
      ping: { success: false, latencyMs, error: msg },
    };
  }
}

function resolveCompletionsUrl(baseUrl: string): string {
  const clean = baseUrl.replace(/\/+$/, "");
  if (clean.endsWith("/chat/completions")) {
    return clean;
  }
  return `${clean}/chat/completions`;
}

function extractJSONFromText(text: string): string {
  const trimmed = text.trim();
  const jsonBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    return jsonBlockMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.substring(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export async function analyzeErrorWithAI(rawRequest: AnalyzeRequest): Promise<FixItResponse> {
  // Redact secrets before sending payload to any remote LLM
  const request: AnalyzeRequest = {
    ...rawRequest,
    errorText: redactSensitiveData(rawRequest.errorText),
  };

  const config = getAIConfig();

  // Route 1: Google Gemini API
  if (config.providerType === "gemini" && config.apiKey) {
    try {
      return await analyzeErrorWithGemini(request, config.apiKey, config.model);
    } catch (geminiError) {
      // Check heuristic fallback
      const heuristicResult = analyzeWithHeuristics(request);
      if (heuristicResult) return heuristicResult;

      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      throw new Error(`Google Gemini analysis failed: ${message}`);
    }
  }

  // Route 2: OpenAI / Local LLM (Ollama, LM Studio, vLLM)
  const isConfigured = config.hasKey || config.isCustomBaseUrl;

  if (!isConfigured) {
    const heuristicResult = analyzeWithHeuristics(request);
    if (heuristicResult) {
      return heuristicResult;
    }

    return {
      summary: "No external AI endpoint configured, and error pattern is unrecognized by local heuristics.",
      cause: "Neither GEMINI_API_KEY, AI_API_KEY, nor AI_BASE_URL is defined in .env.local, and this specific error does not match the built-in offline rules.",
      fix: "Configure your AI provider in .env.local (Google Gemini, OpenAI, Ollama, or LM Studio) to analyze arbitrary errors.",
      technology: "Configuration Required",
      commands: [
        {
          command: "cp .env.example .env.local",
          explanation: "Create your local configuration file.",
          isDangerous: false,
        },
        {
          command: "echo 'GEMINI_API_KEY=your_gemini_key_here' >> .env.local",
          explanation: "Add your Google Gemini API key (or OpenAI / Ollama).",
          isDangerous: false,
        },
      ],
      nextSteps: [
        "Get a free Gemini API key at https://aistudio.google.com/",
        "To use Ollama locally: `ollama run llama3.2` and set `AI_BASE_URL=http://localhost:11434/v1`.",
        "Restart `npm run dev` after updating .env.local.",
      ],
      confidence: "low",
    };
  }

  const systemPrompt = `You are FixIt, an expert Linux system administrator and principal software engineer.
Your task is to analyze programming or Linux errors pasted by the user, explain them concisely and accurately, and provide the safest likely fix.

Target Environment:
- OS: ${request.os || "Linux (general / detect from error)"}
- Shell: ${request.shell || "Bash / POSIX compatible"}

CRITICAL SAFETY RULES:
1. You MUST NEVER recommend executing dangerous destructive commands without explicitly marking them as dangerous.
2. ALWAYS prefer non-destructive diagnostic commands first before any modifying command.
3. Tailor package management commands to the user's OS:
   - Fedora: dnf / systemctl / rpm
   - Ubuntu / Debian: apt / apt-get / dpkg
   - Arch: pacman / yay / systemctl
4. Output MUST be valid, well-formed JSON ONLY.`;

  const userPrompt = `Analyze the following error:\n\n\`\`\`\n${request.errorText}\n\`\`\`\n\nRemember to return ONLY the JSON object matching the requested schema.`;

  const endpoint = resolveCompletionsUrl(config.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  let rawContent = "";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedErr = errorText;
      try {
        const jsonErr = JSON.parse(errorText);
        parsedErr = jsonErr.error?.message || jsonErr.message || errorText;
      } catch {
        // use raw text
      }

      const heuristicResult = analyzeWithHeuristics(request);
      if (heuristicResult) return heuristicResult;

      throw new Error(`AI API error (${response.status}): ${parsedErr}`);
    }

    const data = await response.json();
    rawContent = data.choices?.[0]?.message?.content || "";
  } catch (fetchError: unknown) {
    const heuristicResult = analyzeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;

    const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
    throw new Error(`Could not communicate with AI provider at ${config.baseUrl}: ${message}`);
  }

  if (!rawContent) {
    const heuristicResult = analyzeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;
    throw new Error("AI provider returned an empty response.");
  }

  try {
    const jsonString = extractJSONFromText(rawContent);
    const parsed = JSON.parse(jsonString);

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "Analysis completed.";
    const cause = typeof parsed.cause === "string" ? parsed.cause.trim() : "See recommended fix.";
    const fix = typeof parsed.fix === "string" ? parsed.fix.trim() : "Execute recommended commands.";
    const technology = typeof parsed.technology === "string" ? parsed.technology.trim() : "Linux / Tool";

    let confidence: FixItResponse["confidence"] = "medium";
    if (parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low") {
      confidence = parsed.confidence;
    }

    const nextSteps: string[] = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      : [];

    const commands = sanitizeAndInspectCommands(parsed.commands);

    return {
      summary,
      cause,
      fix,
      technology,
      commands,
      nextSteps: nextSteps.length > 0 ? nextSteps : ["Re-run the command to check if the error is resolved."],
      confidence,
    };
  } catch (parseError) {
    const heuristicResult = analyzeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;

    throw new Error(
      `Failed to parse structured response from AI provider: ${
        parseError instanceof Error ? parseError.message : "Invalid JSON format"
      }`
    );
  }
}

export async function debugCodeWithAI(rawRequest: CodeDebugRequest): Promise<CodeDebugResponse> {
  const request: CodeDebugRequest = {
    ...rawRequest,
    code: redactSensitiveData(rawRequest.code),
    additionalContext: rawRequest.additionalContext ? redactSensitiveData(rawRequest.additionalContext) : undefined,
  };

  const config = getAIConfig();

  // Route 1: Google Gemini API
  if (config.providerType === "gemini" && config.apiKey) {
    try {
      return await debugCodeWithGemini(request, config.apiKey, config.model);
    } catch (geminiError) {
      const heuristicResult = debugCodeWithHeuristics(request);
      if (heuristicResult) return heuristicResult;

      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      throw new Error(`Google Gemini code analysis failed: ${message}`);
    }
  }

  // Route 2: OpenAI / Local LLM
  const isConfigured = config.hasKey || config.isCustomBaseUrl;
  if (!isConfigured) {
    const heuristicResult = debugCodeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;

    throw new Error("No AI backend configured and no offline heuristics matched.");
  }

  const systemPrompt = `You are FixIt Code Doctor, an expert principal software engineer and compiler specialist.
Your task is to analyze code snippets in ${request.language}, detect errors/bugs, explain the root cause, provide the corrected code, step-by-step diff explanation, and relevant verification commands.
Output MUST be valid, well-formed JSON ONLY.`;

  const userPrompt = `Analyze and fix this ${request.language} code snippet:

\`\`\`${request.language.toLowerCase()}
${request.code}
\`\`\`
${request.additionalContext ? `\nAdditional Context:\n${request.additionalContext}` : ""}

Return JSON with this schema:
{
  "language": "${request.language}",
  "errorType": "SyntaxError | TypeError | Logic Bug | Memory Leak | Security Issue",
  "detectedError": "1-2 sentence description of the error / bug",
  "rootCause": "Detailed explanation of why this occurred",
  "fixedCode": "Full corrected code snippet",
  "diffExplanation": ["Change 1", "Change 2"],
  "commands": [
    {
      "command": "verification command",
      "explanation": "command explanation",
      "isDangerous": false
    }
  ],
  "bestPractices": ["Best practice tip 1", "Best practice tip 2"],
  "confidence": "high" | "medium" | "low"
}`;

  const endpoint = resolveCompletionsUrl(config.baseUrl);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  let rawContent = "";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedErr = errorText;
      try {
        const jsonErr = JSON.parse(errorText);
        parsedErr = jsonErr.error?.message || jsonErr.message || errorText;
      } catch {
        // ignore
      }
      const heuristicResult = debugCodeWithHeuristics(request);
      if (heuristicResult) return heuristicResult;

      throw new Error(`AI API error (${response.status}): ${parsedErr}`);
    }

    const data = await response.json();
    rawContent = data.choices?.[0]?.message?.content || "";
  } catch (fetchError: unknown) {
    const heuristicResult = debugCodeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;

    const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
    throw new Error(`Could not communicate with AI provider at ${config.baseUrl}: ${message}`);
  }

  if (!rawContent) {
    const heuristicResult = debugCodeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;
    throw new Error("AI provider returned an empty response.");
  }

  try {
    const jsonString = extractJSONFromText(rawContent);
    const parsed = JSON.parse(jsonString);

    const errorType = typeof parsed.errorType === "string" ? parsed.errorType.trim() : "Code Bug";
    const detectedError = typeof parsed.detectedError === "string" ? parsed.detectedError.trim() : "Bug detected in snippet.";
    const rootCause = typeof parsed.rootCause === "string" ? parsed.rootCause.trim() : "See explanation.";
    const fixedCode = typeof parsed.fixedCode === "string" ? parsed.fixedCode : request.code;

    let confidence: CodeDebugResponse["confidence"] = "medium";
    if (parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low") {
      confidence = parsed.confidence;
    }

    const diffExplanation: string[] = Array.isArray(parsed.diffExplanation)
      ? parsed.diffExplanation.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      : ["Fixed code structure and syntax."];

    const bestPractices: string[] = Array.isArray(parsed.bestPractices)
      ? parsed.bestPractices.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      : [];

    const commands = sanitizeAndInspectCommands(parsed.commands);

    return {
      language: request.language,
      errorType,
      detectedError,
      rootCause,
      fixedCode,
      diffExplanation,
      commands,
      bestPractices,
      confidence,
    };
  } catch (parseError) {
    const heuristicResult = debugCodeWithHeuristics(request);
    if (heuristicResult) return heuristicResult;

    throw new Error(
      `Failed to parse response from AI provider: ${
        parseError instanceof Error ? parseError.message : "Invalid JSON format"
      }`
    );
  }
}
