import { NextRequest, NextResponse } from "next/server";
import { GitWizardRequest } from "@/types";
import { diagnoseGitDisaster } from "@/lib/ai/gitHeuristics";
import { redactSensitiveData } from "@/lib/privacy/redact";

export async function POST(req: NextRequest) {
  try {
    const body: GitWizardRequest = await req.json();

    const sanitizedRequest: GitWizardRequest = {
      scenario: body.scenario,
      customDescription: body.customDescription ? redactSensitiveData(body.customDescription) : undefined,
      gitStatusOutput: body.gitStatusOutput ? redactSensitiveData(body.gitStatusOutput) : undefined,
    };

    // Use fast, reliable heuristic rules with AI safety
    const response = diagnoseGitDisaster(sanitizedRequest);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
