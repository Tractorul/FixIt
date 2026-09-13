import { NextRequest, NextResponse } from "next/server";
import { AnalyzeRequest } from "@/types";
import { analyzeErrorWithAI } from "@/lib/ai/provider";

const MAX_ERROR_LENGTH = 50000; // 50k characters max

export async function POST(req: NextRequest) {
  try {
    let body: Partial<AnalyzeRequest>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request." },
        { status: 400 }
      );
    }

    const { errorText, os, shell } = body;

    if (!errorText || typeof errorText !== "string" || !errorText.trim()) {
      return NextResponse.json(
        { error: "Please provide an error message or stack trace to analyze." },
        { status: 400 }
      );
    }

    if (errorText.length > MAX_ERROR_LENGTH) {
      return NextResponse.json(
        {
          error: `Error text is too large (${errorText.length.toLocaleString()} characters). Please paste a relevant snippet under ${MAX_ERROR_LENGTH.toLocaleString()} characters.`,
        },
        { status: 413 }
      );
    }

    const result = await analyzeErrorWithAI({
      errorText: errorText.trim(),
      os: os || "Unspecified",
      shell: shell || "Unspecified",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while analyzing the error.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
