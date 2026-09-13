import { describe, it, expect } from "vitest";
import { isDockerDoctorDeprecated } from "./dockerHeuristics";

describe("dockerHeuristics", () => {
  it("should be marked as deprecated", () => {
    expect(isDockerDoctorDeprecated).toBe(true);
  });
});
