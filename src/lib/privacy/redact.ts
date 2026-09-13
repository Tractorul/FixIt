/**
 * Sanitizes sensitive credentials, private keys, and API secrets from error logs
 * before sending to external AI models or storing in history.
 */

const SECRET_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // Google Gemini API keys
  { regex: /AIzaSy[A-Za-z0-9_-]{33}/g, replacement: "[REDACTED_GEMINI_KEY]" },
  // Anthropic API keys (placed before generic sk- to prevent partial match)
  { regex: /sk-ant-[A-Za-z0-9_-]{32,}/g, replacement: "[REDACTED_ANTHROPIC_KEY]" },
  // OpenAI API keys
  { regex: /sk-(?:proj-)?[A-Za-z0-9_-]{32,64}/g, replacement: "[REDACTED_OPENAI_KEY]" },
  // GitHub Personal Access & Fine-grained Tokens
  { regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g, replacement: "[REDACTED_GITHUB_TOKEN]" },
  // Hugging Face Tokens
  { regex: /hf_[A-Za-z0-9]{34,}/g, replacement: "[REDACTED_HUGGINGFACE_TOKEN]" },
  // Stripe Secret & Restricted Keys
  { regex: /(?:sk|rk)_live_[0-9a-zA-Z]{24,}/g, replacement: "[REDACTED_STRIPE_KEY]" },
  // Slack API tokens
  { regex: /xox[baprs]-[0-9a-zA-Z-]{10,64}/g, replacement: "[REDACTED_SLACK_TOKEN]" },
  // Bearer authentication tokens
  { regex: /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, replacement: "Bearer [REDACTED_TOKEN]" },
  // Database & Web Service URL credentials (e.g. postgres://user:pass@host)
  { regex: /:\/\/([^:\s/?#]+):([^@\s]+)@/g, replacement: "://$1:[REDACTED_DB_PASSWORD]@" },
  // AWS Access Key ID
  { regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g, replacement: "[REDACTED_AWS_KEY]" },
  // JSON Web Tokens (JWT)
  {
    regex: /eyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_.~+/=]{10,}/g,
    replacement: "[REDACTED_JWT_TOKEN]",
  },
  // Generic password fields in JSON / configs / shell assignments
  {
    regex: /(["']?(?:password|secret|api_key|token|auth|access_key|private_key)["']?\s*[:=]\s*["'])([^"'\n\r]{4,})(["'])/gi,
    replacement: "$1[REDACTED_SECRET]$3",
  },
  // SSH / RSA / OpenSSH Private Key headers & bodies
  {
    regex: /-----BEGIN\s+(?:RSA\s+|OPENSSH\s+|DSA\s+|EC\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+|OPENSSH\s+|DSA\s+|EC\s+)?PRIVATE\s+KEY-----/g,
    replacement: "[REDACTED_PRIVATE_KEY_BLOCK]",
  },
];

export function redactSensitiveData(input: string): string {
  if (!input) return "";
  let sanitized = input;

  for (const { regex, replacement } of SECRET_PATTERNS) {
    sanitized = sanitized.replace(regex, replacement);
  }

  return sanitized;
}
