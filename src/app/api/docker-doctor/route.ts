import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Endpoint deprecated and removed." }, { status: 404 });
}
