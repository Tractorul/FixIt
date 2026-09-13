import { NextRequest, NextResponse } from "next/server";
import { CodeDebugRequest } from "@/types";
import { debugCodeWithAI } from "@/lib/ai/provider";

const MAX_CODE_LENGTH = 50000;

export async function POST(req: NextRequest) {
  try {
    let body: Partial<CodeDebugRequest>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request." },
        { status: 400 }
      );
    }

    const { code, language, additionalContext } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Please provide a code snippet to analyze." },
        { status: 400 }
      );
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        {
          error: `Code snippet is too large (${code.length.toLocaleString()} characters). Please paste a snippet under ${MAX_CODE_LENGTH.toLocaleString()} characters.`,
        },
        { status: 413 }
      );
    }

    const result = await debugCodeWithAI({
      code: code.trim(),
      language: language || "Python",
      additionalContext: additionalContext?.trim(),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while analyzing the code.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
