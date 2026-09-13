import { describe, it, expect } from "vitest";
import { transformConfig } from "./configHeuristics";

describe("transformConfig heuristics", () => {
  it("should convert .env to JSON", () => {
    const envContent = `DATABASE_URL=postgres://user:pass@localhost:5432/db\nPORT=3000\nDEBUG=true`;
    const res = transformConfig({
      sourceFormat: "env",
      targetFormat: "json",
      content: envContent,
    });
    expect(res.isValid).toBe(true);
    expect(res.detectedVariablesCount).toBe(3);
    const parsed = JSON.parse(res.convertedContent);
    expect(parsed.PORT).toBe("3000");
  });

  it("should convert JSON to YAML", () => {
    const jsonContent = JSON.stringify({ APP_NAME: "FixIt", REPLICAS: 3 });
    const res = transformConfig({
      sourceFormat: "json",
      targetFormat: "yaml",
      content: jsonContent,
    });
    expect(res.isValid).toBe(true);
    expect(res.convertedContent).toContain("APP_NAME: FixIt");
    expect(res.convertedContent).toContain("REPLICAS: 3");
  });

  it("should mask secrets when requested", () => {
    const envContent = `API_KEY=sk_live_abcdef123456\nPORT=8080`;
    const res = transformConfig({
      sourceFormat: "env",
      targetFormat: "env",
      content: envContent,
      maskSecrets: true,
    });
    expect(res.isValid).toBe(true);
    expect(res.convertedContent).toContain("API_KEY=********");
    expect(res.convertedContent).toContain("PORT=8080");
    expect(res.maskedSecretsCount).toBe(1);
  });
});
