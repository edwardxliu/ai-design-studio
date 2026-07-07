import { NextResponse } from "next/server";
import { buildDemoPdp } from "@/src/services/demo-api";

export async function POST(request: Request) {
  const body = await request.json();
  const result = buildDemoPdp({
    country: String(body.country ?? "Mexico"),
    language: String(body.language ?? "Spanish")
  });

  return NextResponse.json(result);
}

