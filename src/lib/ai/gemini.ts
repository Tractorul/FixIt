import { AnalyzeRequest, FixItResponse, CodeDebugRequest, CodeDebugResponse, ChatRequest, ChatResponse } from "@/types";
import { sanitizeAndInspectCommands } from "./safety";

export async function analyzeErrorWithGemini(
  request: AnalyzeRequest,
  apiKey: string,
  modelName: string = "gemini-2.5-flash"
): Promise<FixItResponse> {
  const cleanModel = modelName.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

  const systemPrompt = `You are FixIt, an expert Linux system administrator and principal software engineer.
Your task is to analyze programming or Linux errors pasted by the user, explain them concisely and accurately, and provide the safest likely fix.

Target Environment:
- OS: ${request.os || "Linux (general / detect from error)"}
- Shell: ${request.shell || "Bash / POSIX compatible"}

CRITICAL SAFETY RULES:
1. You MUST NEVER recommend executing dangerous destructive commands (such as blind 'rm -rf /', 'mkfs', 'dd' to raw devices, 'chmod 777 -R /', disabling firewalls without reason, dropping tables) without explicitly marking them as dangerous.
2. ALWAYS prefer non-destructive diagnostic commands first (checking logs, system status, file permissions, verifying active processes) before any modifying command.
3. Tailor package management commands to the user's OS:
   - Fedora: dnf / systemctl / rpm
   - Ubuntu / Debian: apt / apt-get / dpkg
   - Arch: pacman / yay / systemctl
4. Return a valid JSON object matching the requested schema.`;

  const userPrompt = `Analyze the following error:\n\n\`\`\`\n${request.errorText}\n\`\`\`

Return JSON with this exact schema:
{
  "summary": "Clear, concise 1-2 sentence explanation of what happened",
  "cause": "Detailed explanation of the root cause and why this occurred",
  "fix": "Step-by-step description of how to resolve the issue safely",
  "technology": "Short tag of detected tech (e.g. Docker, Python, Systemd, Rust, APT, DNF, Pacman, Node.js, C++)",
  "commands": [
    {
      "command": "shell command here",
      "explanation": "Clear explanation of what this command does",
      "isDangerous": false,
      "dangerReason": "Optional: explain why if isDangerous is true"
    }
  ],
  "nextSteps": [
    "Helpful follow-up action or prevention tip 1",
    "Helpful follow-up action or prevention tip 2"
  ],
  "confidence": "high" | "medium" | "low"
}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errorMessage = errJson.error?.message || errorText;
    } catch {
      // use raw text
    }
    throw new Error(`Google Gemini API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response or candidate was blocked.");
  }

  const parsed = JSON.parse(rawText);

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
    nextSteps: nextSteps.length > 0 ? nextSteps : ["Re-run the command to verify whether the error is resolved."],
    confidence,
  };
}

export async function debugCodeWithGemini(
  request: CodeDebugRequest,
  apiKey: string,
  modelName: string = "gemini-2.5-flash"
): Promise<CodeDebugResponse> {
  const cleanModel = modelName.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

  const systemPrompt = `You are FixIt Code Doctor, an expert principal software engineer and compiler specialist.
Your task is to analyze code snippets in ${request.language}, detect syntax errors, runtime bugs, logic flaws, memory issues, or type mismatches, explain the error clearly, and provide the fully corrected code.

CRITICAL INSTRUCTIONS:
1. Identify the exact error or bug in the code snippet.
2. Explain the root cause clearly.
3. Provide the full corrected replacement code snippet (not just pseudo-code).
4. Provide a step-by-step diff explanation of what was fixed.
5. Provide relevant compiler/linter/test commands.
6. Provide best practice tips for ${request.language}.
7. Return a valid JSON object matching the requested schema.`;

  const userPrompt = `Analyze and fix this ${request.language} code snippet:

\`\`\`${request.language.toLowerCase()}
${request.code}
\`\`\`
${request.additionalContext ? `\nAdditional Context / Expected Behavior:\n${request.additionalContext}` : ""}

Return JSON with this exact schema:
{
  "language": "${request.language}",
  "errorType": "SyntaxError | TypeError | Logic Bug | Memory Leak | Security Issue | Concurrency Bug | Runtime Exception",
  "detectedError": "Clear 1-2 sentence description of the error / bug",
  "rootCause": "Detailed explanation of why this error happens",
  "fixedCode": "Complete corrected code snippet",
  "diffExplanation": [
    "Specific change 1 made to fix the code",
    "Specific change 2 made to fix the code"
  ],
  "commands": [
    {
      "command": "compiler, linter, or test command",
      "explanation": "What this verification command does",
      "isDangerous": false
    }
  ],
  "bestPractices": [
    "Language-specific best practice tip 1",
    "Language-specific best practice tip 2"
  ],
  "confidence": "high" | "medium" | "low"
}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 3000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errorMessage = errJson.error?.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`Google Gemini API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response or candidate was blocked.");
  }

  const parsed = JSON.parse(rawText);

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
}

export async function chatWithGemini(
  request: ChatRequest,
  apiKey: string,
  modelName: string = "gemini-2.5-flash"
): Promise<ChatResponse> {
  const cleanModel = modelName.trim() || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

  const systemPrompt = `You are FixIt AI Copilot, a principal software architect, senior DevOps engineer, and expert Linux system administrator.
You assist developers with programming, Linux troubleshooting, containerization, debugging, scripting, and system architecture.

GUIDELINES:
1. Provide concise, clear, production-grade answers.
2. Format code and commands in Markdown code blocks with language identifiers.
3. If commands could be potentially destructive (e.g., rm, dd, mkfs, drop database, chmod 777), explicitly warn the user.
4. If contextual diagnostic information or previous error analysis was provided, tailor your responses to that context.`;

  // Map messages to Gemini API format (role: "user" | "model")
  const contents = request.messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  // If there's extra context provided, prepend it to the first user message or as a system prompt addition
  if (request.context && contents.length > 0 && contents[0].role === "user") {
    contents[0].parts[0].text = `[Current Context / Diagnostic Report]:\n${request.context}\n\n${contents[0].parts[0].text}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 3000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errorMessage = errJson.error?.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`Google Gemini API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response or candidate was blocked.");
  }

  return {
    reply: rawText,
    model: cleanModel,
  };
}

