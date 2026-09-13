import { NextRequest, NextResponse } from "next/server";
import { ConfigConverterRequest } from "@/types";
import { transformConfig } from "@/lib/ai/configHeuristics";

export async function POST(req: NextRequest) {
  try {
    const body: ConfigConverterRequest = await req.json();

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "Please provide content to convert." }, { status: 400 });
    }

    const response = transformConfig(body);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to transform configuration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
