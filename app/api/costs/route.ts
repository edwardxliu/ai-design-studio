import { NextResponse } from "next/server";
import { getDemoCostRecords } from "@/src/services/demo-api";

export async function GET() {
  return NextResponse.json({ records: getDemoCostRecords() });
}

