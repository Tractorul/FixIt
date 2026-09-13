import { describe, it, expect } from "vitest";
import { diagnoseGitDisaster, GIT_SCENARIOS } from "./gitHeuristics";

describe("diagnoseGitDisaster heuristics", () => {
  it("should match committed to main scenario", () => {
    const res = diagnoseGitDisaster({
      scenario: "committed-to-main",
    });
    expect(res.scenarioTitle).toContain("main");
    expect(res.steps.length).toBeGreaterThan(1);
    expect(res.steps.some((s) => s.command.includes("feature"))).toBe(true);
  });

  it("should match committed secret from keyword search", () => {
    const res = diagnoseGitDisaster({
      customDescription: "I accidentally committed my stripe api key and password",
    });
    expect(res.scenarioTitle.toLowerCase()).toContain("secret");
    expect(res.steps[0].command).toContain("git reset --soft");
  });

  it("should match detached head scenario", () => {
    const res = diagnoseGitDisaster({
      gitStatusOutput: "HEAD detached at a1b2c3d\nChanges not staged for commit",
    });
    expect(res.scenarioTitle.toLowerCase()).toContain("detached head");
  });

  it("should provide safe fallback for unknown queries", () => {
    const res = diagnoseGitDisaster({
      customDescription: "something completely unknown 12345",
    });
    expect(res.steps[0].command).toBe("git status");
    expect(res.confidence).toBe("medium");
  });

  it("should have all scenarios well structured", () => {
    expect(GIT_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    for (const sc of GIT_SCENARIOS) {
      expect(sc.id).toBeTruthy();
      expect(sc.steps.length).toBeGreaterThan(0);
      expect(sc.summary).toBeTruthy();
    }
  });
});
