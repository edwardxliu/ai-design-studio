import { NextResponse } from "next/server";
import { createDefaultSystemSettingsStore } from "@/src/services/system-settings";

export async function GET() {
  return NextResponse.json({ settings: await createDefaultSystemSettingsStore().read() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.country || !body?.language) {
    return NextResponse.json({ error: "缺少 country 或 language。" }, { status: 400 });
  }

  const settings = await createDefaultSystemSettingsStore().save({
    country: String(body.country),
    language: String(body.language)
  });

  return NextResponse.json({ settings });
}
