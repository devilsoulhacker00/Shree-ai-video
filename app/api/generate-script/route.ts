import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return NextResponse.json({ error: "POLLINATIONS_API_KEY is not configured." }, { status: 503 });
  try {
    const { idea, scenes = 5, language = "English" } = await request.json();
    if (!idea?.trim()) return NextResponse.json({ error: "Video idea is required." }, { status: 400 });
    const count = Math.min(12, Math.max(2, Number(scenes) || 5));
    const prompt = "Create a concise " + count + '-scene short-video script from this idea: "' + idea.trim() + '". Language: ' + language + ". Return ONLY the scene lines, one scene per line, with no numbering, bullets, headings, quotes, or extra commentary. Make every line visual and suitable for an AI video editor.";
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.4-nano",
        messages: [
          { role: "system", content: "You are a professional short-form video script writer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8
      }),
      cache: "no-store"
    });
    if (!response.ok) return NextResponse.json({ error: "Text provider returned " + response.status + "." }, { status: 502 });
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return NextResponse.json({ error: "AI returned an empty script." }, { status: 502 });
    const clean = text.replace(/\r/g, "").split("\n")
      .map((line: string) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean).slice(0, count).join("\n");
    return NextResponse.json({ script: clean });
  } catch {
    return NextResponse.json({ error: "AI script generation failed." }, { status: 500 });
  }
}