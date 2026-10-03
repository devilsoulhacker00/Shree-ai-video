import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return NextResponse.json({ error: "AI service is not configured on the server. Add POLLINATIONS_API_KEY in the production environment." }, { status: 503 });
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    const response = await fetch("https://gen.pollinations.ai/v1/images/generations", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "flux", prompt: prompt.trim(), size: "720x1280" }),
      cache: "no-store"
    });
    if (!response.ok) return NextResponse.json({ error: "Image provider returned " + response.status + "." }, { status: 502 });
    const data = await response.json();
    const item = data?.data?.[0];
    if (item?.b64_json) return new NextResponse(Buffer.from(item.b64_json, "base64"), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
    if (item?.url) {
      const image = await fetch(item.url, { cache: "no-store" });
      if (!image.ok) throw new Error("Generated image could not be downloaded.");
      return new NextResponse(await image.arrayBuffer(), { headers: { "Content-Type": image.headers.get("content-type") || "image/png", "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "Image provider returned no image." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
  }
}
