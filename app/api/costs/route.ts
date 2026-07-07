import { NextResponse } from "next/server";
import { readDemoCostRecords } from "@/src/services/demo-api";

export async function GET() {
  return NextResponse.json({ records: await readDemoCostRecords() });
}
