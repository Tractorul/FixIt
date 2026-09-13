import { NextRequest, NextResponse } from "next/server";
import { DockerDoctorRequest } from "@/types";
import { diagnoseOrGenerateDocker } from "@/lib/ai/dockerHeuristics";
import { redactSensitiveData } from "@/lib/privacy/redact";

export async function POST(req: NextRequest) {
  try {
    const body: DockerDoctorRequest = await req.json();

    const sanitizedRequest: DockerDoctorRequest = {
      mode: body.mode || "generate",
      framework: body.framework,
      descriptionOrError: redactSensitiveData(body.descriptionOrError || ""),
      existingDockerfile: body.existingDockerfile ? redactSensitiveData(body.existingDockerfile) : undefined,
      existingCompose: body.existingCompose ? redactSensitiveData(body.existingCompose) : undefined,
    };

    const response = diagnoseOrGenerateDocker(sanitizedRequest);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze Docker configuration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
