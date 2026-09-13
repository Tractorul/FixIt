import { describe, it, expect } from "vitest";
import { analyzeWithHeuristics } from "./heuristics";
import { AnalyzeRequest } from "@/types";

describe("analyzeWithHeuristics", () => {
  it("should diagnose Apt Lock Held error", () => {
    const req: AnalyzeRequest = {
      errorText: "E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3241 (unattended-upgr)",
      os: "Ubuntu",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.technology).toContain("APT");
    expect(result?.commands.some((c) => c.command.includes("fuser") || c.command.includes("dpkg"))).toBe(true);
  });

  it("should diagnose Docker Socket Permission error", () => {
    const req: AnalyzeRequest = {
      errorText: "docker: Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock",
      os: "Debian",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.technology).toBe("Docker");
    expect(result?.commands.some((c) => c.command.includes("usermod -aG docker"))).toBe(true);
  });

  it("should diagnose EADDRINUSE with correct port extraction", () => {
    const req: AnalyzeRequest = {
      errorText: "Error: listen EADDRINUSE: address already in use :::8080",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.summary).toContain("8080");
    expect(result?.commands.some((c) => c.command.includes("8080"))).toBe(true);
  });

  it("should diagnose Git merge conflicts", () => {
    const req: AnalyzeRequest = {
      errorText: "CONFLICT (content): Merge conflict in src/app/page.tsx\nAutomatic merge failed; fix conflicts and then commit the result.",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.technology).toBe("Git");
    expect(result?.commands.some((c) => c.command === "git status")).toBe(true);
  });

  it("should diagnose Out of Memory errors", () => {
    const req: AnalyzeRequest = {
      errorText: "<--- Last few GCs --->\n[1234:0x1234] FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.commands.some((c) => c.command.includes("max-old-space-size"))).toBe(true);
  });

  it("should diagnose Disk Full (ENOSPC) errors and tailor commands to Fedora", () => {
    const req: AnalyzeRequest = {
      errorText: "npm ERR! Error: ENOSPC: no space left on device, write",
      os: "Fedora",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.commands.some((c) => c.command.includes("dnf clean all"))).toBe(true);
  });

  it("should diagnose SSL certificate errors", () => {
    const req: AnalyzeRequest = {
      errorText: "urllib.error.URLError: <urlopen error [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: certificate has expired>",
      os: "Ubuntu",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).not.toBeNull();
    expect(result?.technology).toContain("SSL");
    expect(result?.commands.some((c) => c.command.includes("update-ca-certificates"))).toBe(true);
  });

  it("should return null for unrecognized errors", () => {
    const req: AnalyzeRequest = {
      errorText: "Some totally unknown custom application error string xyz 12345",
    };
    const result = analyzeWithHeuristics(req);
    expect(result).toBeNull();
  });
});
