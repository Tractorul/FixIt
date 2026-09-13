import { CliCopilotRequest, CliCopilotResponse } from "@/types";

interface CliPattern {
  keywords: string[];
  generate: (query: string, os?: string, shell?: string) => CliCopilotResponse;
}

const PATTERNS: CliPattern[] = [
  {
    keywords: ["port", "kill process", "listening on port", "port lock", "free port", "kill port"],
    generate: (query) => {
      const match = query.match(/\b\d{2,5}\b/);
      const port = match ? match[0] : "3000";
      return {
        primaryCommand: `lsof -ti :${port} | xargs -r kill -9`,
        alternativeCommands: [
          `fuser -k ${port}/tcp`,
          `ss -tulpn | grep :${port}`,
        ],
        explanation: `Finds the process ID (PID) currently bound to TCP port ${port} and terminates it gracefully or forcefully.`,
        breakdown: [
          { part: `lsof -ti :${port}`, meaning: `Queries open Internet sockets on port ${port} and outputs PID only in terse format.` },
          { part: "|", meaning: "Pipes the extracted PID to the next command." },
          { part: "xargs -r kill -9", meaning: "Runs 'kill -9' on the PID only if at least one process was found." },
        ],
        safetyLevel: "caution",
        safetyNotes: `Ensure no critical system service is running on port ${port} before killing it.`,
        confidence: "high",
      };
    },
  },
  {
    keywords: ["large file", "bigger than", "files over", "find large", "find big", "space", "heavy files"],
    generate: (query) => {
      let size = "100M";
      if (query.match(/(\d+)\s*(gb|g)/i)) size = `${query.match(/(\d+)\s*(gb|g)/i)?.[1]}G`;
      else if (query.match(/(\d+)\s*(mb|m)/i)) size = `${query.match(/(\d+)\s*(mb|m)/i)?.[1]}M`;

      return {
        primaryCommand: `find / -type f -size +${size} -exec ls -lh {} + 2>/dev/null | awk '{ print $5, $9 }' | sort -hr | head -20`,
        alternativeCommands: [
          `du -ah / 2>/dev/null | sort -rh | head -n 20`,
          `ncdu /`,
        ],
        explanation: `Scans the filesystem for all regular files larger than ${size}, displaying their human-readable sizes sorted from largest to smallest.`,
        breakdown: [
          { part: `find / -type f -size +${size}`, meaning: `Recursively searches starting at root for regular files exceeding ${size}.` },
          { part: "2>/dev/null", meaning: "Suppresses permission denied errors on restricted system directories." },
          { part: "sort -hr | head -20", meaning: "Sorts sizes in human-readable reverse numerical order and limits to top 20." },
        ],
        safetyLevel: "safe",
        safetyNotes: "Completely non-destructive read-only operation.",
        confidence: "high",
      };
    },
  },
  {
    keywords: ["delete files older", "clean files older", "remove logs older", "older than", "days old"],
    generate: (query) => {
      const match = query.match(/(\d+)\s*days?/i);
      const days = match ? match[1] : "30";
      return {
        primaryCommand: `find /var/log -type f -name "*.log" -mtime +${days} -exec rm -i {} +`,
        alternativeCommands: [
          `find /tmp -type f -mtime +${days} -delete`,
          `find /var/log -type f -mtime +${days} -ls`, // safe preview
        ],
        explanation: `Searches for log files modified more than ${days} days ago and prompts for confirmation before deleting each file.`,
        breakdown: [
          { part: "find /var/log -type f", meaning: "Searches the directory specifically for regular files." },
          { part: `-mtime +${days}`, meaning: `Matches files whose modification time is greater than ${days} * 24 hours.` },
          { part: "-exec rm -i {} +", meaning: "Passes matched paths to 'rm -i' to prompt before deleting." },
        ],
        safetyLevel: "destructive",
        safetyNotes: "Always run with `-ls` first to preview the file list before running with `rm`.",
        confidence: "high",
      };
    },
  },
  {
    keywords: ["ip address", "unique ip", "nginx log", "access log", "top ips", "count visits"],
    generate: () => {
      return {
        primaryCommand: `awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10`,
        alternativeCommands: [
          `cut -d' ' -f1 /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -20`,
          `goaccess /var/log/nginx/access.log -c`,
        ],
        explanation: "Parses Nginx/Apache access log, extracts the client IP address from the first column, counts occurrences, and ranks the top 10 most frequent visitors.",
        breakdown: [
          { part: "awk '{print $1}'", meaning: "Extracts column 1 (IP address) from each log line." },
          { part: "sort | uniq -c", meaning: "Sorts IP addresses and tallies unique occurrences." },
          { part: "sort -nr | head -10", meaning: "Sorts counts numerically in descending order and displays top 10." },
        ],
        safetyLevel: "safe",
        confidence: "high",
      };
    },
  },
  {
    keywords: ["memory", "ram", "cpu", "hogs", "top processes", "highest cpu", "highest memory"],
    generate: () => {
      return {
        primaryCommand: "ps aux --sort=-%mem | head -n 11",
        alternativeCommands: [
          "ps aux --sort=-%cpu | head -n 11",
          "top -b -o +%MEM | head -n 17",
          "htop",
        ],
        explanation: "Displays the top 10 processes consuming the most system RAM with PID, user, CPU%, and memory% breakdown.",
        breakdown: [
          { part: "ps aux", meaning: "Lists every active process on the system." },
          { part: "--sort=-%mem", meaning: "Sorts output by memory percentage descending." },
          { part: "head -n 11", meaning: "Includes header row + top 10 process rows." },
        ],
        safetyLevel: "safe",
        confidence: "high",
      };
    },
  },
  {
    keywords: ["ssl", "certificate", "cert expiry", "expire", "check domain ssl", "tls"],
    generate: (query) => {
      const match = query.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const domain = match ? match[1] : "example.com";
      return {
        primaryCommand: `openssl s_client -servername ${domain} -connect ${domain}:443 </dev/null 2>/dev/null | openssl x509 -noout -dates -issuer -subject`,
        alternativeCommands: [
          `curl -Iv https://${domain} 2>&1 | grep -i "expire"`,
        ],
        explanation: `Connects to ${domain} over TLS and decodes the SSL/TLS certificate to show valid start date, expiration date, and issuer.`,
        breakdown: [
          { part: `openssl s_client -servername ${domain} -connect ${domain}:443`, meaning: "Establishes a raw TLS handshake with SNI support." },
          { part: "openssl x509 -noout -dates", meaning: "Parses the received X.509 certificate and prints validity period." },
        ],
        safetyLevel: "safe",
        confidence: "high",
      };
    },
  },
  {
    keywords: ["tar", "compress", "zip", "archive", "extract", "tar.gz"],
    generate: () => {
      return {
        primaryCommand: "tar -czvf archive_name.tar.gz /path/to/directory",
        alternativeCommands: [
          "tar -xzvf archive_name.tar.gz -C /target/destination",
          "zip -r archive_name.zip /path/to/directory",
        ],
        explanation: "Creates a gzip-compressed tar archive from a specified directory while printing all archived files.",
        breakdown: [
          { part: "-c", meaning: "Create a new archive." },
          { part: "-z", meaning: "Compress archive using gzip." },
          { part: "-v", meaning: "Verbosely list files processed." },
          { part: "-f", meaning: "Use archive file name specified next." },
        ],
        safetyLevel: "safe",
        confidence: "high",
      };
    },
  },
];

export function translateNaturalLanguageToCli(request: CliCopilotRequest): CliCopilotResponse {
  const query = request.query.toLowerCase().trim();

  for (const pattern of PATTERNS) {
    if (pattern.keywords.some((kw) => query.includes(kw))) {
      return pattern.generate(request.query, request.os, request.shell);
    }
  }

  // Generic intelligent fallback
  return {
    primaryCommand: `man -k "${request.query.replace(/"/g, "")}" || apropos "${request.query.replace(/"/g, "")}"`,
    alternativeCommands: [
      `which ${request.query.split(" ")[0]} 2>/dev/null || type ${request.query.split(" ")[0]}`,
    ],
    explanation: `Searches system manual page descriptions for keywords relating to "${request.query}".`,
    breakdown: [
      { part: "man -k", meaning: "Searches the short descriptions and manual page names for the query." },
      { part: "apropos", meaning: "Equivalent tool to search Linux man database for related utilities." },
    ],
    safetyLevel: "safe",
    safetyNotes: "Read-only system query.",
    confidence: "medium",
  };
}
