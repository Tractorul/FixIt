import { FixItCommand } from "@/types";

const DANGEROUS_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  {
    regex: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f*|--recursive|--force)/i,
    reason: "Permanently deletes files and directories recursively without confirmation.",
  },
  {
    regex: /\bfind\b.*(-delete|-exec\s+rm\b)/i,
    reason: "Searches and bulk-deletes files directly without safety prompts.",
  },
  {
    regex: /\b(dd\s+if=|mkfs(?:\.[a-z0-9]+)?|fdisk|parted|gdisk|wipefs)/i,
    reason: "Can format, overwrite, or partition entire storage devices, risking severe data loss.",
  },
  {
    regex: /\b(chmod|chown)\s+(-R|--recursive)\s+(777|000|\/|\/etc|\/usr|\/var|\/root|\/bin|\/home|\/boot)\b/i,
    reason: "Modifies global system permissions recursively, which can compromise security or break the OS.",
  },
  {
    regex: />\s*\/dev\/(sd[a-z]|nvme[0-9]n[0-9]|null\b|zero\b|urandom\b)/i,
    reason: "Directly overwrites raw disk devices or critical virtual devices.",
  },
  {
    regex: /\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f[a-zA-Z]*|push\s+-[a-zA-Z]*f[a-zA-Z]*|push\s+--force)/i,
    reason: "Destructively discards uncommitted work or overwrites remote branch history.",
  },
  {
    regex: /\bkill\s+-9\s+(1|-1)\b|\bpkill\s+-9\b/i,
    reason: "Forcefully terminates critical system processes or all user processes immediately.",
  },
  {
    regex: /\b(curl|wget)\s+[^|]+\|\s*(sudo\s+)?(bash|sh|zsh)\b/i,
    reason: "Directly downloads and executes unverified remote code in the shell.",
  },
  {
    regex: /\b(iptables\s+-F|ufw\s+disable|systemctl\s+(?:stop|disable|mask)\s+(?:firewalld|ufw|iptables))\b/i,
    reason: "Disables system firewall protection, exposing open network ports.",
  },
  {
    regex: /\bsystemctl\s+(?:stop|disable|mask)\s+(?:ssh|sshd|NetworkManager|systemd-resolved)\b/i,
    reason: "Stops critical networking or remote administration services, which can lock you out of remote servers.",
  },
  {
    regex: /\bdocker\s+(?:system|container|volume|image)\s+prune\b/i,
    reason: "Bulk deletes Docker containers, volumes, or cached images irreversibly.",
  },
  {
    regex: /\b(drop\s+database|truncate\s+table)\b/i,
    reason: "Irreversibly deletes database data.",
  },
  {
    regex: /\b(userdel|groupdel)\s+(-r|--remove)?\b/i,
    reason: "Deletes system user accounts or groups and potentially their home directories.",
  },
  {
    regex: /\b(export\s+PATH\s*=\s*["']?["']?|unset\s+PATH)\b/i,
    reason: "Clears executable search path, breaking shell binary resolution.",
  },
  {
    regex: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    reason: "Shell fork bomb designed to exhaust system PID table and crash the kernel.",
  },
  {
    regex: /\b(npm|yarn|pnpm)\s+cache\s+clean\s+--force\b/i,
    reason: "Force-clears local package caches which may impact local build reproducibility.",
  },
];

/**
 * Inspects a command string and annotates it if dangerous.
 */
export function inspectCommandSafety(cmd: FixItCommand): FixItCommand {
  const isAlreadyFlagged = cmd.isDangerous;
  let detectedReason = cmd.dangerReason;

  for (const { regex, reason } of DANGEROUS_PATTERNS) {
    if (regex.test(cmd.command)) {
      detectedReason = detectedReason ? `${detectedReason} (${reason})` : reason;
      return {
        ...cmd,
        isDangerous: true,
        dangerReason: detectedReason,
      };
    }
  }

  return {
    ...cmd,
    isDangerous: isAlreadyFlagged || false,
    dangerReason: isAlreadyFlagged ? cmd.dangerReason : undefined,
  };
}

export function sanitizeAndInspectCommands(commands: unknown[]): FixItCommand[] {
  if (!Array.isArray(commands)) return [];

  return commands
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const rawCommand = typeof item.command === "string" ? item.command.trim() : "";
      const explanation = typeof item.explanation === "string" ? item.explanation.trim() : "";
      const isDangerous = Boolean(item.isDangerous);
      const dangerReason = typeof item.dangerReason === "string" ? item.dangerReason.trim() : undefined;

      const baseCmd: FixItCommand = {
        command: rawCommand,
        explanation: explanation || "Execute this command to address the issue.",
        isDangerous,
        dangerReason,
      };

      return inspectCommandSafety(baseCmd);
    })
    .filter((cmd) => cmd.command.length > 0);
}
