import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return NextResponse.json({ error: "POLLINATIONS_API_KEY is not configured." }, { status: 503 });
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=black-forest-labs/flux.1-schnell&width=720&height=1280`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `Image provider returned ${response.status}.` }, { status: 502 });
    const type = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, { headers: { "Content-Type": type, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
  }
}