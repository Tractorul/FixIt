import { describe, it, expect } from "vitest";
import { debugCodeWithHeuristics } from "./codeHeuristics";
import { CodeDebugRequest } from "@/types";

describe("debugCodeWithHeuristics", () => {
  it("should detect missing colon in Python function header", () => {
    const req: CodeDebugRequest = {
      code: "def calculate_total(a, b)\n    return a + b",
      language: "Python",
    };
    const result = debugCodeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.errorType).toBe("SyntaxError");
    expect(result?.fixedCode).toContain("def calculate_total(a, b):");
  });

  it("should detect JavaScript const reassignment", () => {
    const req: CodeDebugRequest = {
      code: "const counter = 0;\ncounter++;",
      language: "JavaScript",
    };
    const result = debugCodeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.errorType).toBe("TypeError");
    expect(result?.fixedCode).toContain("let counter = 0;");
  });

  it("should detect missing async modifier with await in TypeScript", () => {
    const req: CodeDebugRequest = {
      code: "function loadData() {\n    const res = await fetch('/api/data');\n    return res.json();\n}",
      language: "TypeScript",
    };
    const result = debugCodeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.errorType).toBe("SyntaxError");
    expect(result?.fixedCode).toContain("async function loadData()");
  });

  it("should detect Python mutable default argument", () => {
    const req: CodeDebugRequest = {
      code: "def append_item(x, items=[]):\n    items.append(x)\n    return items",
      language: "Python",
    };
    const result = debugCodeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.errorType).toContain("Logic");
    expect(result?.fixedCode).toContain("items=None");
  });

  it("should detect Rust immutable vector mutation", () => {
    const req: CodeDebugRequest = {
      code: "fn main() {\n    let items = vec![1, 2];\n    items.push(3);\n}",
      language: "Rust",
    };
    const result = debugCodeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.fixedCode).toContain("let mut items");
  });

  it("should return fallback review for general snippets", () => {
    const req: CodeDebugRequest = {
      code: "func compute(x int) int {\n    return x * 2\n}",
      language: "Go",
    };
    const result = debugCodeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.language).toBe("Go");
  });
});
