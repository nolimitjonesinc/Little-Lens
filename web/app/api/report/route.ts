import { NextResponse } from "next/server";
import { getAnthropic, MODEL_SONNET } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `You are writing a developmental report for a preschool child for parents.

Child: {firstName} {lastName}, age {age}
Period: {periodStart} to {periodEnd}
Teacher: {teacherName}, {schoolName}

Observations ({count}):
{observations}

Write a warm, professional narrative report for parents. Return ONLY JSON in this shape (no prose outside JSON):
{
  "domainSummaries": { "<Domain Name>": "<2-3 sentence summary focused on growth and specific examples>", ... },
  "overallNarrative": "<4-5 short paragraphs covering strengths, growth, social engagement, and 1-2 gentle recommendations. Use the child's first name.>"
}

Only include domains that appear in the observations. Do not invent behaviors. Write with warmth.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName, lastName, age,
      periodStart, periodEnd,
      teacherName, schoolName,
      observations,
    } = body;

    if (!firstName || !Array.isArray(observations) || observations.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const obsText = observations.map((o: any, i: number) =>
      `${i + 1}. [${o.tags?.join(", ") || "untagged"}] ${o.cleanedObservation || o.rawTranscript || ""}`
    ).join("\n");

    const prompt = PROMPT
      .replace("{firstName}", firstName)
      .replace("{lastName}", lastName || "")
      .replace("{age}", age || "?")
      .replace("{periodStart}", periodStart || "")
      .replace("{periodEnd}", periodEnd || "")
      .replace("{teacherName}", teacherName || "Your teacher")
      .replace("{schoolName}", schoolName || "")
      .replace("{count}", String(observations.length))
      .replace("{observations}", obsText);

    const client = getAnthropic();
    const resp = await client.messages.create({
      model: MODEL_SONNET,
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const block = resp.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const json = extractJson(raw);
    if (!json) {
      return NextResponse.json({ error: "Could not parse report", debug: raw.slice(0, 500) }, { status: 500 });
    }
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Report failed" }, { status: 500 });
  }
}

function extractJson(text: string): any | null {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}
