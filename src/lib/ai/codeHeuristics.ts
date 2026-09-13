import { CodeDebugRequest, CodeDebugResponse } from "@/types";
import { inspectCommandSafety } from "./safety";

interface CodeBugPattern {
  name: string;
  languages: string[];
  match: (code: string, language: string) => boolean;
  generate: (req: CodeDebugRequest) => CodeDebugResponse;
}

export const CODE_PATTERNS: CodeBugPattern[] = [
  {
    name: "Python Missing Colon after def/if/for/while/class",
    languages: ["Python"],
    match: (code, lang) =>
      lang === "Python" && /^\s*(def\s+\w+\([^)]*\)|if\s+.*|for\s+.*|while\s+.*|class\s+\w+(?:\([^)]*\))?)\s*$/m.test(code) &&
      !/:\s*$/m.test(code.trim()),
    generate: (req) => {
      const fixed = req.code.replace(
        /^(\s*(?:def\s+\w+\([^)]*\)|if\s+[^:]+|for\s+[^:]+|while\s+[^:]+|class\s+[^:]+))(?!\s*:)\s*$/gm,
        "$1:"
      );
      return {
        language: "Python",
        errorType: "SyntaxError",
        detectedError: "SyntaxError: expected ':' at the end of function, control flow, or class statement.",
        rootCause: "In Python, compound statements (def, if, for, while, with, class, try, except) require a trailing colon (:) before the indented block.",
        fixedCode: fixed,
        diffExplanation: [
          "Added missing colon ':' to statement header.",
          "Ensured the body block following the colon is properly indented with 4 spaces.",
        ],
        commands: [
          inspectCommandSafety({
            command: "python3 -m py_compile script.py",
            explanation: "Diagnostic: Check Python script for syntax errors without executing.",
          }),
        ],
        bestPractices: [
          "Use a Python linter like flake8, ruff, or pylint in your editor to catch syntax errors in real time.",
          "Ensure consistent 4-space indentation (avoid mixing tabs and spaces).",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "JavaScript/TypeScript Missing Async for Await",
    languages: ["JavaScript", "TypeScript"],
    match: (code, lang) =>
      (lang === "JavaScript" || lang === "TypeScript") &&
      /\bawait\s+/.test(code) &&
      /function\s+\w+\([^)]*\)\s*\{|(?:\([^)]*\)|\w+)\s*=>\s*\{/.test(code) &&
      !/async\s+(?:function|\([^)]*\)|\w+\s*=>)/.test(code),
    generate: (req) => {
      const fixed = req.code.replace(
        /(function\s+\w+\([^)]*\)|\([^)]*\)\s*=>|\w+\s*=>)/,
        "async $1"
      );
      return {
        language: req.language,
        errorType: "SyntaxError",
        detectedError: "SyntaxError: 'await' expressions are only valid in async functions and top-level modules.",
        rootCause: "The 'await' keyword pauses execution waiting for a Promise, which requires the enclosing function to be declared with the 'async' modifier.",
        fixedCode: fixed,
        diffExplanation: [
          "Added 'async' keyword to the enclosing function declaration.",
        ],
        commands: [
          inspectCommandSafety({
            command: req.language === "TypeScript" ? "npx tsc --noEmit" : "node index.js",
            explanation: "Diagnostic: Run syntax and execution check.",
          }),
        ],
        bestPractices: [
          "Always wrap 'await' operations in try/catch blocks to gracefully handle rejected promises.",
          "Prefer Promise.all() when running independent asynchronous tasks concurrently.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "JavaScript/TypeScript Const Reassignment",
    languages: ["JavaScript", "TypeScript"],
    match: (code, lang) => {
      if (lang !== "JavaScript" && lang !== "TypeScript") return false;
      const constMatch = code.match(/\bconst\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
      if (!constMatch) return false;
      const varName = constMatch[1];
      const restOfCode = code.slice(constMatch.index! + constMatch[0].length);
      return new RegExp(`\\b${varName}\\s*(?:\\+\\+|--|=(?!=)|\\+=|-=)`).test(restOfCode);
    },
    generate: (req) => {
      const varMatch = req.code.match(/\bconst\s+(\w+)\s*=/);
      const varName = varMatch ? varMatch[1] : "variable";
      const fixed = req.code.replace(new RegExp(`\\bconst\\s+${varName}\\b`), `let ${varName}`);
      return {
        language: req.language,
        errorType: "TypeError",
        detectedError: `TypeError: Assignment to constant variable '${varName}'.`,
        rootCause: `Variables declared with 'const' cannot be reassigned or mutated with increment/decrement operators.`,
        fixedCode: fixed,
        diffExplanation: [
          `Changed declaration from 'const ${varName}' to 'let ${varName}' to permit reassignment.`,
        ],
        commands: [
          inspectCommandSafety({
            command: req.language === "TypeScript" ? "npx tsc --noEmit" : "node --check index.js",
            explanation: "Diagnostic: Verify script validity and check for type/syntax errors.",
          }),
        ],
        bestPractices: [
          "Use 'const' by default for immutable references, and 'let' only when reassignment is strictly required.",
          "Never use legacy 'var' in modern JavaScript/TypeScript.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Python Mutable Default Argument",
    languages: ["Python"],
    match: (code, lang) =>
      lang === "Python" && /def\s+\w+\([^)]*=\s*(?:\[\]|\{\})\s*[^)]*\):/.test(code),
    generate: (req) => {
      const fixed = req.code
        .replace(
          /(def\s+\w+\([^)]*?)(\w+)\s*=\s*(?:\[\]|\{\})([^)]*\):)/,
          "$1$2=None$3"
        )
        .replace(
          /(def\s+\w+[^:]+:\n)(\s+)/,
          "$1$2if target is None:\n$2    target = []\n$2"
        );
      return {
        language: "Python",
        errorType: "Logic / Bug",
        detectedError: "Python Mutable Default Argument Pitfall (Persistent state across invocations).",
        rootCause: "Default parameter values in Python are evaluated once when the function is defined, not each time it is called. Using a mutable default (like [] or {}) causes all invocations to share the same instance.",
        fixedCode: fixed,
        diffExplanation: [
          "Replaced mutable default '= []' with '= None'.",
          "Initialized a fresh list or dictionary inside the function body if the argument is None.",
        ],
        commands: [
          inspectCommandSafety({
            command: "python3 -m pytest",
            explanation: "Run unit tests to verify function isolation across multiple calls.",
          }),
        ],
        bestPractices: [
          "Always use 'None' as the default value for mutable parameters in Python.",
          "Use typing annotations (e.g. `items: list[str] | None = None`) for type clarity.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Bash Unquoted Variable in Comparison or Glob",
    languages: ["Bash / Shell"],
    match: (code, lang) =>
      (lang === "Bash / Shell" || lang === "Other") &&
      /\[\s*\$[a-zA-Z_0-9]+\s*==|if\s*\[\s*\$[a-zA-Z_0-9]+\s*=/.test(code),
    generate: (req) => {
      const fixed = req.code.replace(
        /\[\s*\$([a-zA-Z_0-9]+)\s*(=|==|!=)\s*([^\]]+)\]/g,
        '[[ "$$1" $2 "$3" ]]'
      );
      return {
        language: "Bash / Shell",
        errorType: "SyntaxError / Word Splitting Bug",
        detectedError: "bash: [: too many arguments / unary operator expected.",
        rootCause: "When variables in single brackets `[ $var == ... ]` contain whitespace or are empty, word splitting expands them into multiple arguments, breaking test syntax.",
        fixedCode: fixed,
        diffExplanation: [
          "Switched from POSIX single brackets `[` to Bash double brackets `[[` and quoted variable expansions.",
        ],
        commands: [
          inspectCommandSafety({
            command: "shellcheck script.sh",
            explanation: "Diagnostic: Lint shell script for bugs and bad practices with ShellCheck.",
          }),
        ],
        bestPractices: [
          "Always use `[[ ... ]]` in Bash for string and pattern comparisons.",
          "Always double quote variables `\"$var\"` to prevent accidental word splitting and globbing.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Rust Missing Mut on Variable Binding",
    languages: ["Rust"],
    match: (code, lang) =>
      lang === "Rust" &&
      /\blet\s+([a-zA-Z_0-9]+)\s*=/.test(code) &&
      new RegExp(`\\b${(code.match(/\blet\s+([a-zA-Z_0-9]+)\s*=/) || [])[1]}\\.(push|insert|clear|sort)`).test(code) &&
      !/\blet\s+mut\s+/.test(code),
    generate: (req) => {
      const varMatch = req.code.match(/\blet\s+([a-zA-Z_0-9]+)\s*=/);
      const varName = varMatch ? varMatch[1] : "item";
      const fixed = req.code.replace(new RegExp(`\\blet\\s+${varName}\\b`), `let mut ${varName}`);
      return {
        language: "Rust",
        errorType: "error[E0596]",
        detectedError: `error[E0596]: cannot borrow \`${varName}\` as mutable, as it is not declared as mutable.`,
        rootCause: "In Rust, variables are immutable by default. Calling methods that take `&mut self` (such as `.push()`, `.insert()`) requires explicit `mut` annotation.",
        fixedCode: fixed,
        diffExplanation: [
          `Added \`mut\` keyword to \`let mut ${varName}\` binding.`,
        ],
        commands: [
          inspectCommandSafety({
            command: "cargo check",
            explanation: "Diagnostic: Fast Rust compiler check.",
          }),
        ],
        bestPractices: [
          "Keep variables immutable unless mutation is required.",
          "Use `cargo clippy` to automatically detect unnecessary mut bindings or lifetime issues.",
        ],
        confidence: "high",
      };
    },
  },
];

export function debugCodeWithHeuristics(req: CodeDebugRequest): CodeDebugResponse | null {
  const code = req.code.trim();
  if (!code) return null;

  for (const pattern of CODE_PATTERNS) {
    if (pattern.match(code, req.language)) {
      return pattern.generate(req);
    }
  }

  // Generic fallback response for offline code debugging
  return {
    language: req.language,
    errorType: "Code Review Required",
    detectedError: `No built-in offline rule matched this exact ${req.language} snippet pattern.`,
    rootCause: "To analyze complex logic errors, type mismatches, or multi-file dependencies, configure an external AI backend (Google Gemini, OpenAI, or Ollama) in `.env.local`.",
    fixedCode: req.code,
    diffExplanation: [
      "Review the snippet for unhandled edge cases, null/undefined safety, or type mismatches.",
      "Configure `GEMINI_API_KEY` or `AI_BASE_URL` in `.env.local` to enable full deep semantic code debugging.",
    ],
    commands: [
      inspectCommandSafety({
        command: req.language === "Python"
          ? "python3 -m py_compile script.py"
          : req.language === "Rust"
          ? "cargo check"
          : req.language === "Go"
          ? "go vet ./..."
          : req.language === "TypeScript"
          ? "npx tsc --noEmit"
          : "node --check index.js",
        explanation: `Diagnostic: Run standard ${req.language} compiler/syntax check.`,
      }),
    ],
    bestPractices: [
      "Add unit tests covering edge cases.",
      "Check linter and typechecker output in your terminal or IDE.",
    ],
    confidence: "medium",
  };
}
