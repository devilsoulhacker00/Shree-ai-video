import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return NextResponse.json({ error: "POLLINATIONS_API_KEY is not configured." }, { status: 503 });
  try {
    const { text, voice = "alloy" } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: "Text is required." }, { status: 400 });
    const url = "https://gen.pollinations.ai/audio/" + encodeURIComponent(text.trim()) + "?model=openai-audio&voice=" + encodeURIComponent(voice);
    const response = await fetch(url, { headers: { Authorization: "Bearer " + key }, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Audio provider returned " + response.status + "." }, { status: 502 });
    const type = response.headers.get("content-type") || "audio/mpeg";
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, { headers: { "Content-Type": type, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Voice generation failed." }, { status: 500 });
  }
}