import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "shree-ai-video",
    aiConfigured: Boolean(process.env.POLLINATIONS_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
