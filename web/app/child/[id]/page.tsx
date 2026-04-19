"use client";

import { SEED_CHILDREN, SEED_CLASSES } from "@/lib/seed-data";
import { getObservationsForChild } from "@/lib/storage";
import { DomainChip } from "@/components/DomainChip";
import { ageYearsMonths, formatDate, relativeTime } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Observation } from "@/types";

export default function ChildProfile() {
  const params = useParams();
  const childId = params.id as string;
  const [observations, setObservations] = useState<Observation[]>([]);
  const [mounted, setMounted] = useState(false);

  const child = SEED_CHILDREN.find((c) => c.id === childId);
  const classRoom = child && SEED_CLASSES.find((c) => c.id === child.classId);

  useEffect(() => {
    setObservations(getObservationsForChild(childId));
    setMounted(true);
  }, [childId]);

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-amber-900">Child not found</p>
          <Link href="/dashboard" className="text-sm text-sage-600 underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const sourceCounts = observations.reduce(
    (acc, o) => { acc[o.source] = (acc[o.source] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/dashboard" className="text-sm text-sage-600 hover:text-amber-700">
            ← Back
          </Link>
          <Link
            href={`/quick-capture/${child.id}`}
            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
          >
            + Note
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-5">
        <div className="rounded-3xl border border-sage-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-lg font-bold text-white">
              {child.initials}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-amber-900">
                {child.firstName} {child.lastName}
              </h1>
              <p className="mt-0.5 text-sm text-sage-600">
                {ageYearsMonths(child.dateOfBirth)} • Born {formatDate(child.dateOfBirth)}
              </p>
              {classRoom && (
                <p className="mt-1 text-xs text-sage-500">
                  {classRoom.emoji} {classRoom.name} • {classRoom.ageRange}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-sage-100 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{observations.length}</p>
              <p className="text-[11px] uppercase tracking-wide text-sage-500">Notes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{sourceCounts.voice || 0}</p>
              <p className="text-[11px] uppercase tracking-wide text-sage-500">Voice</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{sourceCounts.scan || 0}</p>
              <p className="text-[11px] uppercase tracking-wide text-sage-500">Scanned</p>
            </div>
          </div>
        </div>

        {observations.length >= 3 && (
          <div className="mt-4">
            <Link
              href={`/report/${child.id}`}
              className="block rounded-2xl border border-sage-300 bg-gradient-to-r from-sage-500 to-sage-600 p-4 text-center text-white shadow hover:shadow-lg transition-all"
            >
              <p className="font-semibold">📄 Generate Developmental Report</p>
              <p className="text-xs text-sage-50/90 mt-0.5">
                {observations.length} observations · AI-drafted narrative
              </p>
            </Link>
          </div>
        )}

        <h2 className="mt-8 mb-3 font-serif text-lg font-semibold text-amber-900">
          Observation Timeline
        </h2>

        {!mounted ? (
          <div className="rounded-2xl border border-sage-200 bg-white p-6 text-center text-sm text-sage-500">
            Loading...
          </div>
        ) : observations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sage-300 bg-white p-8 text-center">
            <p className="text-sm text-sage-600">No observations yet.</p>
            <Link
              href={`/quick-capture/${child.id}`}
              className="mt-3 inline-block rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-600"
            >
              Capture the first note
            </Link>
          </div>
        ) : (
          <ol className="space-y-3">
            {observations.map((obs) => (
              <li
                key={obs.id}
                className="rounded-2xl border border-sage-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-sage-500">
                    {relativeTime(obs.createdAt)} · {formatDate(obs.createdAt)}
                  </span>
                  <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-sage-700">
                    {obs.source === "voice" ? "🎤 voice" : obs.source === "scan" ? "📄 scanned" : "✎ typed"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-amber-900">
                  {obs.cleanedObservation}
                </p>
                {obs.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {obs.tags.map((t) => (
                      <DomainChip key={t} tag={t} size="sm" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-6 flex justify-center no-print">
        <Link
          href={`/quick-capture/${child.id}`}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-2xl shadow-amber-500/30 soft-glow"
        >
          🎤 Add a note for {child.firstName}
        </Link>
      </div>
    </div>
  );
}
