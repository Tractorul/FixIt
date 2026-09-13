import { describe, it, expect } from "vitest";
import { inspectCommandSafety, sanitizeAndInspectCommands } from "./safety";
import { FixItCommand } from "@/types";

describe("inspectCommandSafety", () => {
  it("should flag rm -rf commands as dangerous", () => {
    const cmd: FixItCommand = {
      command: "sudo rm -rf /var/cache/*",
      explanation: "Clean cache",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(true);
    expect(inspected.dangerReason).toContain("deletes files");
  });

  it("should flag recursive chmod 777 as dangerous", () => {
    const cmd: FixItCommand = {
      command: "chmod -R 777 /var/www",
      explanation: "Grant full permissions",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(true);
  });

  it("should flag dd and mkfs as dangerous", () => {
    const cmd: FixItCommand = {
      command: "sudo dd if=/dev/zero of=/dev/sda bs=1M",
      explanation: "Zero drive",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(true);
  });

  it("should flag curl | bash as dangerous", () => {
    const cmd: FixItCommand = {
      command: "curl -fsSL https://example.com/install.sh | sudo bash",
      explanation: "Run script",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(true);
  });

  it("should flag stopping sshd or firewalld as dangerous", () => {
    const cmd: FixItCommand = {
      command: "sudo systemctl stop sshd",
      explanation: "Stop SSH daemon",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(true);
  });

  it("should flag find -delete as dangerous", () => {
    const cmd: FixItCommand = {
      command: "find /tmp -name '*.tmp' -delete",
      explanation: "Delete temp files",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(true);
  });

  it("should mark safe diagnostic commands as non-dangerous", () => {
    const cmd: FixItCommand = {
      command: "journalctl -xeu nginx.service",
      explanation: "Check logs",
    };
    const inspected = inspectCommandSafety(cmd);
    expect(inspected.isDangerous).toBe(false);
  });
});

describe("sanitizeAndInspectCommands", () => {
  it("should filter out empty or invalid command entries", () => {
    const result = sanitizeAndInspectCommands([
      null,
      {},
      { command: "" },
      { command: "systemctl status docker", explanation: "Check status" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].command).toBe("systemctl status docker");
    expect(result[0].isDangerous).toBe(false);
  });
});
