import { NextResponse } from "next/server";
import { getAnthropic, MODEL_HAIKU } from "@/lib/anthropic";
import { DEVELOPMENTAL_TAGS } from "@/types";

export const runtime = "nodejs";

const PROMPT = `You are helping a preschool teacher capture a developmental observation.

Child: {childName}
Raw transcript: "{text}"

Tasks:
1. Clean the transcript into one professional observation sentence (2-3 sentences max). Preserve the teacher's voice and intent. Do not invent details.
2. Tag it with 1-4 developmental domains from this exact list:
${DEVELOPMENTAL_TAGS.map((t) => `- ${t}`).join("\n")}

Return JSON only with this exact shape:
{ "cleaned": string, "tags": string[] }`;

export async function POST(req: Request) {
  try {
    const { text, childName } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const client = getAnthropic();
    const resp = await client.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: PROMPT.replace("{text}", text).replace("{childName}", childName || "the child"),
        },
      ],
    });

    const block = resp.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const json = extractJson(raw);
    if (!json) {
      return NextResponse.json({ cleaned: text, tags: [] });
    }
    return NextResponse.json({
      cleaned: typeof json.cleaned === "string" ? json.cleaned : text,
      tags: Array.isArray(json.tags) ? json.tags.filter((t: string) => DEVELOPMENTAL_TAGS.includes(t as any)).slice(0, 4) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Tagging failed" }, { status: 500 });
  }
}

function extractJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}
