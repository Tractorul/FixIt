import { describe, it, expect } from "vitest";
import { translateNaturalLanguageToCli } from "./cliHeuristics";

describe("translateNaturalLanguageToCli heuristics", () => {
  it("should generate command to kill process on port 8080", () => {
    const res = translateNaturalLanguageToCli({
      query: "kill process listening on port 8080",
    });
    expect(res.primaryCommand).toContain("8080");
    expect(res.primaryCommand).toContain("lsof");
    expect(res.safetyLevel).toBe("caution");
    expect(res.breakdown.length).toBeGreaterThan(0);
  });

  it("should generate command to find large files over 500MB", () => {
    const res = translateNaturalLanguageToCli({
      query: "find all large files bigger than 500MB in root",
    });
    expect(res.primaryCommand).toContain("500M");
    expect(res.primaryCommand).toContain("find");
    expect(res.safetyLevel).toBe("safe");
  });

  it("should generate command to delete old log files", () => {
    const res = translateNaturalLanguageToCli({
      query: "delete files older than 14 days in log directory",
    });
    expect(res.primaryCommand).toContain("+14");
    expect(res.safetyLevel).toBe("destructive");
  });

  it("should generate SSL cert inspection command", () => {
    const res = translateNaturalLanguageToCli({
      query: "check ssl certificate expiration for google.com",
    });
    expect(res.primaryCommand).toContain("google.com");
    expect(res.primaryCommand).toContain("openssl");
  });

  it("should fall back gracefully for unknown queries", () => {
    const res = translateNaturalLanguageToCli({
      query: "random non existent concept xyz",
    });
    expect(res.primaryCommand).toContain("man -k");
  });
});
