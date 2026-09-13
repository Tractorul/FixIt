import { describe, it, expect } from "vitest";
import { diagnoseOrGenerateDocker } from "./dockerHeuristics";

describe("diagnoseOrGenerateDocker heuristics", () => {
  it("should generate Next.js multi-stage dockerfile", () => {
    const res = diagnoseOrGenerateDocker({
      mode: "generate",
      framework: "Next.js",
      descriptionOrError: "Production deployment",
    });
    expect(res.dockerfile).toContain("FROM node:20-alpine");
    expect(res.dockerfile).toContain("USER nextjs");
    expect(res.dockerCompose).toContain("services:");
    expect(res.keyImprovements.length).toBeGreaterThan(0);
  });

  it("should generate Python Dockerfile", () => {
    const res = diagnoseOrGenerateDocker({
      mode: "generate",
      framework: "Python (FastAPI/Flask)",
      descriptionOrError: "FastAPI microservice",
    });
    expect(res.dockerfile).toContain("python:3.11-slim");
    expect(res.dockerfile).toContain("appuser");
  });

  it("should diagnose permission EACCES error", () => {
    const res = diagnoseOrGenerateDocker({
      mode: "debug",
      descriptionOrError: "npm ERR! code EACCES: permission denied, mkdir '/app/.next'",
    });
    expect(res.summary.toLowerCase()).toContain("permission");
    expect(res.dockerfile).toContain("chown");
  });
});
