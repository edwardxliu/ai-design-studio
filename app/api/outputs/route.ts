import { join } from "node:path";
import { NextResponse } from "next/server";
import { listRuntimeImages } from "@/src/services/runtime-files";

export async function GET() {
  const images = await listRuntimeImages(
    join(process.cwd(), "public", "generated"),
    "/generated"
  );
  return NextResponse.json({ outputs: images });
}
