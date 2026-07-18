import { NextResponse } from "next/server";
import { runScout } from "@/lib/campscout/run-scout";
import { searchInputSchema } from "@/lib/campscout/schema";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "CampScout could not complete the run.";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = searchInputSchema.parse(payload);
    const run = await runScout(input, { headless: true });

    return NextResponse.json(run);
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("invalid") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
