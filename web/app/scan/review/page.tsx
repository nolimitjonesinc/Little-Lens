"use client";

import { SEED_CHILDREN, DEMO_TEACHER } from "@/lib/seed-data";
import { addObservations } from "@/lib/storage";
import { DomainChip } from "@/components/DomainChip";
import { PendingScanItem, Observation } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ReviewRow {
  id: string;
  childId: string | null;
  childName: string;
  note: string;
  tags: string[];
  confidence: "high" | "medium" | "low";
  include: boolean;
}

export default function ScanReview() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "processing" | "review" | "error">("loading");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const img = sessionStorage.getItem("scan:image");
    if (!img) {
      router.replace("/scan");
      return;
    }
    setImage(img);
    setPhase("processing");
    void runScan(img);
  }, [router]);

  async function runScan(dataUrl: string) {
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, roster: SEED_CHILDREN.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName })) }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Scan failed");
      }
      const data = await res.json();
      const items: PendingScanItem[] = data.items || [];
      if (items.length === 0) {
        setErrorMessage("No observations detected in that image. Try a clearer photo.");
        setPhase("error");
        return;
      }
      const mapped: ReviewRow[] = items.map((it, i) => {
        const matched = matchChild(it.childName);
        return {
          id: `scan-${Date.now()}-${i}`,
          childId: matched?.id ?? null,
          childName: it.childName,
          note: it.note,
          tags: (it as any).tags || [],
          confidence: it.confidence,
          include: true,
        };
      });
      setRows(mapped);
      setPhase("review");
    } catch (e: any) {
      setErrorMessage(e?.message || "Scan failed");
      setPhase("error");
    }
  }

  function matchChild(rawName: string) {
    const n = rawName.trim().toLowerCase();
    return SEED_CHILDREN.find((c) =>
      c.firstName.toLowerCase() === n ||
      `${c.firstName.toLowerCase()} ${c.lastName.toLowerCase()}` === n ||
      c.firstName.toLowerCase().startsWith(n)
    );
  }

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function saveAll() {
    const toSave = rows.filter((r) => r.include && r.childId);
    if (toSave.length === 0) {
      alert("Match each observation to a child before saving, or uncheck ones you don't want to keep.");
      return;
    }
    const now = new Date().toISOString();
    const obs: Observation[] = toSave.map((r) => ({
      id: r.id,
      childId: r.childId!,
      teacherId: DEMO_TEACHER.id,
      rawTranscript: r.note,
      cleanedObservation: r.note,
      tags: r.tags,
      confirmed: true,
      source: "scan",
      createdAt: now,
    }));
    addObservations(obs);
    sessionStorage.removeItem("scan:image");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link href="/scan" className="text-sm text-sage-600 hover:text-amber-700">
            ← Retake
          </Link>
          <h1 className="font-serif text-lg font-semibold text-amber-900">Review Scanned Notes</h1>
          <div className="w-14" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-6">
        {image && (
          <details className="mb-4 rounded-2xl border border-sage-200 bg-white p-3">
            <summary className="cursor-pointer text-xs font-medium text-sage-600">
              Show original page
            </summary>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Scanned page" className="mt-3 max-h-80 w-full rounded-lg object-contain" />
          </details>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-sm text-sage-700">Reading your handwriting...</p>
            <p className="max-w-xs text-center text-xs text-sage-500">
              Claude is parsing names and notes. Usually 5–10 seconds.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
            <p className="font-semibold text-amber-900">Couldn&apos;t scan that page</p>
            <p className="mt-1 text-sm text-amber-800">{errorMessage}</p>
            <p className="mt-2 text-xs text-sage-600">
              (If you haven&apos;t set <code className="rounded bg-sage-100 px-1">ANTHROPIC_API_KEY</code>, the scan API will fail. See the morning briefing.)
            </p>
            <Link
              href="/scan"
              className="mt-4 inline-block rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Try again
            </Link>
          </div>
        )}

        {phase === "review" && (
          <>
            <p className="mb-4 text-sm text-sage-600">
              <strong>{rows.filter((r) => r.include).length} observations</strong> found. Review each, confirm the child, then Save All.
            </p>

            <div className="space-y-3">
              {rows.map((row) => {
                const needsMatch = !row.childId;
                return (
                  <div
                    key={row.id}
                    className={`rounded-2xl border bg-white p-4 shadow-sm ${
                      !row.include ? "opacity-50" : needsMatch ? "border-amber-400" : "border-sage-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                        className="mt-1 h-5 w-5 accent-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <select
                            value={row.childId ?? ""}
                            onChange={(e) => updateRow(row.id, { childId: e.target.value || null })}
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${
                              needsMatch ? "border-amber-400 bg-amber-50 text-amber-900" : "border-sage-300 bg-white text-amber-900"
                            }`}
                          >
                            <option value="">— pick a child —</option>
                            {SEED_CHILDREN.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.firstName} {c.lastName}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-sage-500">
                            scanned as &ldquo;{row.childName}&rdquo;
                          </span>
                          {row.confidence !== "high" && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                              {row.confidence} confidence
                            </span>
                          )}
                        </div>

                        <textarea
                          value={row.note}
                          onChange={(e) => updateRow(row.id, { note: e.target.value })}
                          rows={2}
                          className="mt-3 w-full resize-none rounded-lg border border-sage-200 bg-[color:var(--color-background)] p-2 text-sm leading-relaxed text-amber-900 focus:border-amber-400 focus:outline-none"
                        />

                        {row.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {row.tags.map((t) => (
                              <DomainChip key={t} tag={t} size="sm" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-6 mt-8 flex justify-center">
              <button
                onClick={saveAll}
                className="rounded-full bg-sage-600 px-8 py-3 text-sm font-semibold text-white shadow-xl hover:bg-sage-700"
              >
                ✓ Save All ({rows.filter((r) => r.include && r.childId).length})
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
