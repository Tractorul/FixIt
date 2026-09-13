import { NextRequest, NextResponse } from "next/server";
import { CliCopilotRequest } from "@/types";
import { translateNaturalLanguageToCli } from "@/lib/ai/cliHeuristics";
import { redactSensitiveData } from "@/lib/privacy/redact";

export async function POST(req: NextRequest) {
  try {
    const body: CliCopilotRequest = await req.json();

    if (!body.query || typeof body.query !== "string" || !body.query.trim()) {
      return NextResponse.json({ error: "Please provide a command request or question." }, { status: 400 });
    }

    const sanitizedRequest: CliCopilotRequest = {
      query: redactSensitiveData(body.query.trim()),
      os: body.os,
      shell: body.shell,
    };

    const response = translateNaturalLanguageToCli(sanitizedRequest);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate terminal command.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
