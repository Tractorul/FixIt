import { NextRequest, NextResponse } from "next/server";
import { getAIStatus, testAIConnection } from "@/lib/ai/provider";

export async function GET(req: NextRequest) {
  try {
    const shouldPing = req.nextUrl.searchParams.get("ping") === "true";
    if (shouldPing) {
      const status = await testAIConnection();
      return NextResponse.json(status);
    }
    const status = getAIStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        configured: false,
        provider: "fallback",
        baseUrl: "https://api.openai.com/v1",
        model: "unknown",
        hasKey: false,
        message: error instanceof Error ? error.message : "Failed to retrieve status",
      },
      { status: 200 }
    );
  }
}

export async function POST() {
  try {
    const status = await testAIConnection();
    return NextResponse.json(status);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        configured: false,
        provider: "fallback",
        baseUrl: "https://api.openai.com/v1",
        model: "unknown",
        hasKey: false,
        message: error instanceof Error ? error.message : "Failed to test connection",
      },
      { status: 200 }
    );
  }
}
