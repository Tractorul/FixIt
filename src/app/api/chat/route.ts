import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse } from "@/types";
import { chatWithGemini } from "@/lib/ai/gemini";
import { redactSensitiveData } from "@/lib/privacy/redact";

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Please provide messages array." }, { status: 400 });
    }

    // Redact sensitive secrets from all messages before sending to AI
    const sanitizedMessages = body.messages.map((m) => ({
      role: m.role,
      content: redactSensitiveData(m.content),
    }));

    const sanitizedContext = body.context ? redactSensitiveData(body.context) : undefined;

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (apiKey && apiKey.trim()) {
      const response = await chatWithGemini(
        { messages: sanitizedMessages, context: sanitizedContext },
        apiKey,
        model
      );
      return NextResponse.json(response);
    }

    // Offline / fallback simulated intelligent response
    const lastUserMsg = sanitizedMessages[sanitizedMessages.length - 1]?.content || "";
    const fallbackReply: ChatResponse = {
      reply: `I am currently operating in **Offline Heuristics Mode**.\n\nTo enable full real-time conversational capabilities with Google Gemini:\n1. Open the **Settings** pill in the top header.\n2. Add \`GEMINI_API_KEY=your_key\` to your \`.env.local\` file (or in your Vercel project environment variables).\n\n*Regarding your question about:* \`${lastUserMsg.slice(0, 100)}\`\nMake sure to check the dedicated tool tabs (Error Diagnosis, Code Doctor, Git Wizard, CLI Copilot, Docker Doctor, or Config Transformer) for instant offline heuristics!`,
      model: "offline-heuristics",
    };

    return NextResponse.json(fallbackReply);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process chat message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
