"use client";

import { DEMO_SCHOOL, DEMO_TEACHER, SEED_CHILDREN, SEED_CLASSES } from "@/lib/seed-data";
import { observationCountFor, daysSinceLastObservation } from "@/lib/storage";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClassPicker } from "@/components/ClassPicker";

export default function Dashboard() {
  const teacherClasses = SEED_CLASSES.filter((c) => DEMO_TEACHER.classIds.includes(c.id));
  const [activeClassId, setActiveClassId] = useState<string>(teacherClasses[0]?.id ?? SEED_CLASSES[0].id);

  const activeClass = SEED_CLASSES.find((c) => c.id === activeClassId)!;
  const children = useMemo(
    () => SEED_CHILDREN.filter((c) => c.classId === activeClassId),
    [activeClassId],
  );

  const totalObs = children.reduce((sum, c) => sum + observationCountFor(c.id), 0);
  const stale = children.filter((c) => {
    const d = daysSinceLastObservation(c.id);
    return d === null || d >= 7;
  }).length;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold text-amber-900 truncate">
                LittleLens
              </h1>
              <p className="text-xs text-sage-600 truncate">
                {DEMO_TEACHER.name} • {DEMO_SCHOOL.name}
              </p>
            </div>
            <Link
              href="/scan"
              className="rounded-full border border-sage-300 bg-white px-3 py-1.5 text-xs font-medium text-sage-700 hover:bg-sage-50"
            >
              📄 Scan
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-5">
        {/* Primary CTA */}
        <Link
          href={`/quick-capture?classId=${activeClassId}`}
          className="group block rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 p-6 shadow-lg transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xl font-semibold text-white">Quick Capture</div>
              <div className="text-sm text-amber-50/90">
                Tap a child, speak, walk away.
              </div>
            </div>
            <span className="text-2xl text-white/80">→</span>
          </div>
        </Link>

        {/* Class picker */}
        <div className="mt-6">
          <ClassPicker
            classes={SEED_CLASSES}
            activeClassId={activeClassId}
            onSelect={setActiveClassId}
          />
        </div>

        {/* Summary row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatTile label="Children" value={children.length.toString()} emoji={activeClass.emoji} />
          <StatTile label="Notes this period" value={totalObs.toString()} emoji="✎" />
          <StatTile label="Need check-in" value={stale.toString()} emoji="⏰" warn={stale > 0} />
        </div>

        {/* Children roster */}
        <h2 className="mt-8 mb-3 font-serif text-lg font-semibold text-amber-900">
          {activeClass.name}
          <span className="ml-2 text-sm font-normal text-sage-500">{activeClass.ageRange}</span>
        </h2>

        {children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sage-300 bg-white p-8 text-center">
            <p className="text-sm text-sage-600">No children rostered in this class yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {children.map((child) => {
              const obsCount = observationCountFor(child.id);
              const days = daysSinceLastObservation(child.id);
              const isStale = days === null || days >= 7;

              return (
                <Link
                  key={child.id}
                  href={`/child/${child.id}`}
                  className={`group rounded-2xl border-2 bg-white p-4 transition-all active:scale-[0.98] hover:shadow-md ${
                    isStale ? "border-amber-300 bg-amber-50/60" : "border-sage-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-white">
                      {child.initials}
                    </div>
                    {obsCount >= 5 ? (
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-sage-700">
                        ✓ report
                      </span>
                    ) : isStale ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        {days ?? "—"}d
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 text-base font-semibold leading-tight text-amber-900">
                    {child.firstName}
                  </div>
                  <div className="text-xs text-sage-600">{child.lastName}</div>
                  <div className="mt-2 text-xs text-sage-500">
                    {obsCount} {obsCount === 1 ? "note" : "notes"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating capture button for mobile */}
      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center no-print">
        <Link
          href={`/quick-capture?classId=${activeClassId}`}
          className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-2xl shadow-amber-500/30 soft-glow"
        >
          <span>🎤</span>
          <span>Quick Capture</span>
        </Link>
      </div>
    </div>
  );
}

function StatTile({ label, value, emoji, warn }: { label: string; value: string; emoji: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-3 ${warn ? "border-amber-300" : "border-sage-200"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xl font-bold ${warn ? "text-amber-700" : "text-amber-900"}`}>{value}</span>
        <span className="text-lg">{emoji}</span>
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-sage-500">
        {label}
      </div>
    </div>
  );
}
