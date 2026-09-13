# FixIt 🛠️

**FixIt** is a small, Linux-first web application designed for developers and system administrators. Paste any programming traceback, compiler error, or Linux package manager failure, and FixIt explains what happened, why it happened, and provides the safest likely fix.

---

## Highlights

- ♊ **Google Gemini Integration**: First-class, zero-bloat support for **Google Gemini** (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`) with native structured JSON responses.
- 🐧 **Linux-First & Distro Aware**: Tailors package manager commands and troubleshooting steps for **Fedora** (`dnf`), **Ubuntu/Debian** (`apt`), and **Arch Linux** (`pacman`), as well as shell syntax differences (Bash, Zsh, Fish).
- 🩺 **Code Doctor & Snippet Debugger (`/code-debug`)**: Select a programming language (Python, JS/TS, Rust, Go, C++, Bash, SQL), paste buggy code, and get root cause detection, step-by-step diff explanation, and ready-to-run corrected code.
- 🛡️ **Safety-First Architecture**:
  - Never automatically executes shell commands.
  - Automatically identifies and annotates destructive or risky commands (e.g. `rm -rf`, `dd`, `mkfs`, partition tools, recursive permission changes, forced cache purges) with clear warning badges and impact explanations.
  - Prioritizes non-destructive diagnostic commands first.
- 📜 **Safe Script Generator**: Export a ready-to-inspect bash script (`fixit_remedy.sh`) featuring `set -euo pipefail` and interactive confirmation prompts before any dangerous action.
- 🔒 **Privacy Redaction Guard**: Masks API keys, bearer tokens, SSH private keys, and secrets from error logs before sending to external AI models.
- ⚡ **Structured Analysis Cards**:
  - **What happened** (concise summary)
  - **Why it happened** (root cause analysis)
  - **Most likely fix** (step-by-step resolution)
  - **Commands** (copyable code blocks with individual and bulk copy buttons)
  - **What to try next** (preventative tips & follow-ups)
- 🔌 **Multi-Provider Support**:
  - **Google Gemini API** (`GEMINI_API_KEY`)
  - **Local Offline LLMs** (**Ollama**, **LM Studio**, **vLLM**, **LocalAI**)
  - **OpenAI-Compatible APIs** (OpenAI, OpenRouter, Groq, Mistral, Together)
  - **Built-in Offline Heuristics** (Fallback if no API key is configured)
- 📜 **Local-Only History**: Stored safely in your browser's `localStorage` with title, timestamp, technology tag, and one-click restore or deletion.

---

## Requirements

- **Linux** (Fedora, Ubuntu, Debian, Arch, openSUSE, etc.) or macOS/Windows
- **Node.js** >= 18.18.0 (Node 20+ or 22+ recommended)
- **npm** (or `pnpm` / `yarn` / `bun`)

---

## Installation

```bash
# Clone or navigate to the repository
cd fixIt

# Install dependencies
npm install
```

---

## Environment Variables

Configure your preferred AI backend in `.env.local`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key (recommended) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model to query | `gemini-2.5-flash` |
| `AI_BASE_URL` | Base URL for OpenAI-compatible endpoint | `https://api.openai.com/v1` |
| `AI_API_KEY` | OpenAI / Custom API Key | `sk-...` |
| `AI_MODEL` | Model name for OpenAI/Local endpoint | `gpt-4o-mini` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL for auth guard | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key for auth guard | `eyJhbGci...` |

*(If no provider is configured, FixIt uses the built-in offline Linux diagnostic heuristics engine.)*

---

## Quick Configuration Examples

Copy the sample environment file:

```bash
cp .env.example .env.local
```

### 1. Using Google Gemini API (Recommended)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Configure `.env.local`:
   ```ini
   GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
   GEMINI_MODEL=gemini-2.5-flash
   ```

### 2. Using Local Ollama (Free & 100% Offline)

1. Start your local Ollama server and pull a model:
   ```bash
   ollama run llama3.2
   ```
2. Configure `.env.local`:
   ```ini
   AI_BASE_URL=http://localhost:11434/v1
   AI_MODEL=llama3.2
   AI_API_KEY=ollama
   ```

### 3. Using LM Studio / LocalAI / vLLM

1. Start local inference server with an OpenAI-compatible endpoint (e.g. port `1234`).
2. Configure `.env.local`:
   ```ini
   AI_BASE_URL=http://localhost:1234/v1
   AI_MODEL=qwen2.5-coder-7b-instruct
   AI_API_KEY=lm-studio
   ```

### 4. Using OpenAI

```ini
AI_API_KEY=sk-your-openai-api-key-here
AI_MODEL=gpt-4o-mini
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# 1. Build the optimized production application
npm run build

# 2. Run the production server
npm run start
```

---

## 🔒 Password Protection with Supabase

FixIt includes built-in authentication via Supabase Auth so you can securely protect your private FixIt deployment on Vercel:

1. **Create a Free Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a project.
2. **Retrieve API Credentials**:
   - In Supabase Dashboard, go to **Project Settings** → **API**.
   - Copy **Project URL** and **anon / public key**.
3. **Create your Admin User**:
   - Go to **Authentication** → **Users** → **Add User** (enter your email and desired password).
4. **Add to `.env.local`**:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
5. **Deploy to Vercel**:
   - Push your repo to GitHub / GitLab.
   - Import the project on [Vercel](https://vercel.com).
   - In Vercel Project Settings → **Environment Variables**, add:
     - `GEMINI_API_KEY` (your Google Gemini API key)
     - `GEMINI_MODEL` (`gemini-2.5-flash`)
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy! All routes are automatically password-protected.

---

## Project Structure

```
fixIt/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts   # POST /api/analyze (safe error diagnosis)
│   │   │   └── status/route.ts    # GET /api/status (backend connection info)
│   │   ├── globals.css            # Dark cinematic theme & Tailwind CSS
│   │   ├── layout.tsx             # Root layout with Geist fonts & dark mode
│   │   └── page.tsx               # Main FixIt interactive dashboard
│   ├── components/
│   │   ├── AnalysisResult.tsx     # Insight cards, script export & copy tools
│   │   ├── CommandCard.tsx        # Monospace command snippet & safety badge
│   │   ├── EnvironmentSelector.tsx# Linux distro (Fedora/Ubuntu/Debian/Arch) & Shell selector
│   │   ├── ErrorInput.tsx         # Drag & drop error textarea with quick samples
│   │   ├── Header.tsx             # Brand header, provider status & history toggle
│   │   ├── HistoryPanel.tsx       # Local storage history drawer & search
│   │   └── StatusModal.tsx        # Interactive AI connection guide & copy snippets
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini.ts          # Google Gemini native REST API client
│   │   │   ├── heuristics.ts      # Offline Linux error diagnosis engine
│   │   │   ├── provider.ts        # AI Provider router & response validator
│   │   │   └── safety.ts          # Automated dangerous command detector & annotator
│   │   ├── privacy/
│   │   │   └── redact.ts          # Sensitive credential & secret redactor
│   │   └── storage.ts             # LocalStorage manager
│   └── types/
│       └── index.ts               # TypeScript data definitions
├── .env.example                   # Template configuration
├── package.json
└── README.md
```

---

## License

MIT License. Designed with safety, speed, and developer ergonomics in mind.
