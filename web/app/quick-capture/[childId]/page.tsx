"use client";

import { SEED_CHILDREN, DEMO_TEACHER } from "@/lib/seed-data";
import { addObservation } from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MicOrb } from "@/components/MicOrb";
import { DomainChip } from "@/components/DomainChip";
import { Observation } from "@/types";

type Phase = "recording" | "processing" | "review";

export default function QuickCaptureChild() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();
  const child = SEED_CHILDREN.find((c) => c.id === params.childId);
  const [phase, setPhase] = useState<Phase>("recording");
  const [rawText, setRawText] = useState("");
  const [cleaned, setCleaned] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [typedMode, setTypedMode] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [aiError, setAiError] = useState(false);

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Child not found. <button onClick={() => router.back()} className="underline">Go back</button></div>
      </div>
    );
  }

  async function processText(text: string) {
    setRawText(text);
    setPhase("processing");
    setAiError(false);
    try {
      const res = await fetch("/api/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, childName: child!.firstName }),
      });
      if (!res.ok) throw new Error("Tagging failed");
      const data = await res.json();
      setCleaned(data.cleaned || text);
      setTags(data.tags || []);
    } catch {
      setAiError(true);
      setCleaned(text);
      setTags(guessTags(text));
    } finally {
      setPhase("review");
    }
  }

  function onFinal(transcript: string) {
    void processText(transcript);
  }

  function onCancel() {
    router.back();
  }

  function saveAndReturn() {
    const obs: Observation = {
      id: `obs-${Date.now()}`,
      childId: child!.id,
      teacherId: DEMO_TEACHER.id,
      rawTranscript: rawText,
      cleanedObservation: cleaned,
      tags,
      confirmed: true,
      source: typedMode ? "manual" : "voice",
      createdAt: new Date().toISOString(),
    };
    addObservation(obs);
    sessionStorage.setItem("qc:lastSaved", child!.firstName);
    router.push(`/quick-capture?classId=${child!.classId}`);
  }

  function saveAndNext() {
    saveAndReturn();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <button onClick={() => router.back()} className="text-sm text-sage-600 hover:text-amber-700">
            ← Cancel
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-xs font-bold text-white">
              {child.initials}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-amber-900 leading-tight">
                {child.firstName} {child.lastName}
              </div>
              <div className="text-[11px] text-sage-500">Capturing a note</div>
            </div>
          </div>
          <div className="w-14" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8">
        {phase === "recording" && !typedMode && (
          <>
            <MicOrb onFinal={onFinal} onCancel={onCancel} />
            <div className="mt-8 text-center">
              <button
                onClick={() => setTypedMode(true)}
                className="text-sm text-sage-600 underline hover:text-amber-700"
              >
                Or type instead
              </button>
            </div>
          </>
        )}

        {phase === "recording" && typedMode && (
          <div className="mx-auto w-full max-w-xl">
            <label className="text-sm font-medium text-amber-900">What did you observe?</label>
            <textarea
              autoFocus
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={`e.g., ${child.firstName} sorted the colored blocks and taught another child how to do it`}
              rows={6}
              className="mt-2 w-full rounded-2xl border border-sage-300 bg-white p-4 text-base text-amber-900 placeholder:text-sage-400 focus:border-amber-400 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => { setTypedMode(false); setTypedText(""); }}
                className="text-sm text-sage-600 underline hover:text-amber-700"
              >
                ← Use voice
              </button>
              <button
                onClick={() => typedText.trim() && processText(typedText.trim())}
                disabled={!typedText.trim()}
                className="rounded-full bg-amber-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-sage-300"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
            <p className="text-sm text-sage-700">Tagging developmental domains...</p>
            <p className="text-xs text-sage-500 italic max-w-xs text-center">&ldquo;{rawText}&rdquo;</p>
          </div>
        )}

        {phase === "review" && (
          <div className="mx-auto w-full max-w-xl">
            {aiError && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                AI tagging offline — using fallback tags. You can still save this note.
              </div>
            )}

            <div className="rounded-2xl border border-sage-200 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-500">
                Observation
              </p>
              <textarea
                value={cleaned}
                onChange={(e) => setCleaned(e.target.value)}
                rows={4}
                className="mt-2 w-full resize-none bg-transparent text-base leading-relaxed text-amber-900 focus:outline-none"
              />
              {rawText && rawText !== cleaned && (
                <details className="mt-3 text-xs text-sage-500">
                  <summary className="cursor-pointer">Original transcript</summary>
                  <p className="mt-2 italic">&ldquo;{rawText}&rdquo;</p>
                </details>
              )}
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-500 mb-2">
                Developmental domains
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-sage-500 italic">No tags assigned</p>
                ) : (
                  tags.map((t) => <DomainChip key={t} tag={t} />)
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={saveAndReturn}
                className="flex-1 rounded-full bg-sage-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-sage-700"
              >
                ✓ Save &amp; done
              </button>
              <button
                onClick={saveAndNext}
                className="flex-1 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-amber-600"
              >
                ✓ Save &amp; next child →
              </button>
            </div>
            <button
              onClick={() => { setPhase("recording"); setRawText(""); setCleaned(""); setTags([]); setTypedText(""); }}
              className="mt-3 w-full text-center text-xs text-sage-600 underline hover:text-amber-700"
            >
              Redo this note
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function guessTags(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  if (/block|puzzle|sort|count|shape|color|pattern|figure/.test(lower)) hits.push("Cognitive Development");
  if (/draw|paint|cut|scissor|pencil|trace|zip|button/.test(lower)) hits.push("Fine Motor Skills");
  if (/climb|jump|run|ball|ladder|balance|throw/.test(lower)) hits.push("Gross Motor Skills");
  if (/friend|share|help|cry|upset|hug|comfort|play with/.test(lower)) hits.push("Social-Emotional");
  if (/said|told|story|word|sentence|sang|speak|talk/.test(lower)) hits.push("Language & Communication");
  if (/art|paint|draw|sing|dance|create|imagine/.test(lower)) hits.push("Creative Expression");
  if (/bathroom|wash|dress|shoe|snack|clean up|potty/.test(lower)) hits.push("Self-Care & Independence");
  if (/solve|figure out|try again|persist|challenge|stuck/.test(lower)) hits.push("Problem Solving");
  return hits.slice(0, 3);
}
