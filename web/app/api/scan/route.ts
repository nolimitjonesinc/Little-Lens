import { NextResponse } from "next/server";
import { getAnthropic, MODEL_SONNET } from "@/lib/anthropic";
import { DEVELOPMENTAL_TAGS } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `You are reading a preschool teacher's handwritten clipboard page.
Each line or block typically has a child's first name followed by a short note about what that child did.

The class roster is:
{roster}

Extract every observation you can see. For each one:
- Match the child name to the roster when possible. If the handwriting is unclear, return the best guess and mark confidence "low".
- Capture the note as written (cleaned for grammar, preserving meaning).
- Tag with 1-3 developmental domains from this list:
${DEVELOPMENTAL_TAGS.map((t) => `- ${t}`).join("\n")}

Return ONLY a JSON object in this exact shape, no prose:
{
  "items": [
    { "childName": string, "note": string, "tags": string[], "confidence": "high" | "medium" | "low" }
  ]
}

If no observations are visible, return { "items": [] }.`;

export async function POST(req: Request) {
  try {
    const { image, roster } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const match = image.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid image format (expected base64 data URL)" }, { status: 400 });
    }
    const mediaType = match[1] as "image/png" | "image/jpeg" | "image/webp";
    const base64 = match[3];

    const rosterList = Array.isArray(roster)
      ? roster.map((r: any) => `- ${r.firstName} ${r.lastName || ""}`.trim()).join("\n")
      : "(unknown)";

    const client = getAnthropic();
    const resp = await client.messages.create({
      model: MODEL_SONNET,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: PROMPT.replace("{roster}", rosterList),
            },
          ],
        },
      ],
    });

    const block = resp.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const json = extractJson(raw);
    if (!json || !Array.isArray(json.items)) {
      return NextResponse.json({ items: [], debug: raw.slice(0, 500) });
    }

    const items = json.items
      .filter((it: any) => it && typeof it.childName === "string" && typeof it.note === "string")
      .map((it: any) => ({
        childName: String(it.childName).trim(),
        note: String(it.note).trim(),
        tags: Array.isArray(it.tags)
          ? it.tags.filter((t: string) => DEVELOPMENTAL_TAGS.includes(t as any)).slice(0, 3)
          : [],
        confidence: ["high", "medium", "low"].includes(it.confidence) ? it.confidence : "medium",
      }));

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Scan failed" }, { status: 500 });
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
