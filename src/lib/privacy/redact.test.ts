import { describe, it, expect } from "vitest";
import { redactSensitiveData } from "./redact";

describe("redactSensitiveData", () => {
  it("should return empty string for empty input", () => {
    expect(redactSensitiveData("")).toBe("");
  });

  it("should redact Google Gemini API keys", () => {
    const error = "Error at https://generativelanguage.googleapis.com?key=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q";
    const redacted = redactSensitiveData(error);
    expect(redacted).not.toContain("AIzaSy");
    expect(redacted).toContain("[REDACTED_GEMINI_KEY]");
  });

  it("should redact OpenAI API keys", () => {
    const error = "Failed with sk-proj-1234567890abcdef1234567890abcdef12345678";
    const redacted = redactSensitiveData(error);
    expect(redacted).toContain("[REDACTED_OPENAI_KEY]");
  });

  it("should redact Anthropic API keys", () => {
    const error = "Auth error sk-ant-api03-abcdef1234567890abcdef1234567890-test";
    const redacted = redactSensitiveData(error);
    expect(redacted).toContain("[REDACTED_ANTHROPIC_KEY]");
  });

  it("should redact GitHub Personal Access Tokens", () => {
    const error = "fatal: Authentication failed for ghp_abcdefghijklmnopqrstuvwxyz0123456789";
    const redacted = redactSensitiveData(error);
    expect(redacted).toContain("[REDACTED_GITHUB_TOKEN]");
  });

  it("should redact Stripe API keys", () => {
    const error = "Stripe card error with key STRIPE_TEST_SECRET_PLACEHOLDER";
    const redacted = redactSensitiveData(error);
    expect(redacted).toContain("[REDACTED_STRIPE_KEY]");
  });

  it("should redact database passwords in URLs", () => {
    const error = "Connection refused postgres://admin:superSecretPassword123@db.example.com:5432/mydb";
    const redacted = redactSensitiveData(error);
    expect(redacted).not.toContain("superSecretPassword123");
    expect(redacted).toContain("postgres://admin:[REDACTED_DB_PASSWORD]@db.example.com:5432/mydb");
  });

  it("should redact Bearer tokens", () => {
    const error = "Request headers: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const redacted = redactSensitiveData(error);
    expect(redacted).toContain("Bearer [REDACTED_TOKEN]");
  });

  it("should redact private key blocks", () => {
    const error = `Failed to load key:
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1+
abcdef123456
-----END RSA PRIVATE KEY-----
invalid format`;
    const redacted = redactSensitiveData(error);
    expect(redacted).toContain("[REDACTED_PRIVATE_KEY_BLOCK]");
    expect(redacted).not.toContain("MIIEowIBAAKCAQEA0Y1+");
  });
});
