import { join } from "node:path";
import { readRuntimeFile } from "@/src/services/runtime-files";

// Serves images generated after `next build`; static public/ serving only
// covers files that existed at build time.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const file = await readRuntimeFile(join(process.cwd(), "public", "generated"), path);

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "no-store"
    }
  });
}
