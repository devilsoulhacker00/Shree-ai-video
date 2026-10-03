import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return NextResponse.json({ error: "POLLINATIONS_API_KEY is not configured." }, { status: 503 });
  try {
    const { prompt, duration = 4 } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    const seconds = Math.min(8, Math.max(2, Number(duration) || 4));
    const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?model=google/veo-3.1-fast&duration=${seconds}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `Video provider returned ${response.status}.` }, { status: 502 });
    const type = response.headers.get("content-type") || "video/mp4";
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, { headers: { "Content-Type": type, "Content-Disposition": 'inline; filename="shree-ai-video.mp4"', "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Video generation failed." }, { status: 500 });
  }
}