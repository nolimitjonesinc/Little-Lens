"use client";

import { SEED_CHILDREN, SEED_CLASSES, DEMO_TEACHER } from "@/lib/seed-data";
import { observationCountFor, daysSinceLastObservation } from "@/lib/storage";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo, useState, useEffect } from "react";
import { ClassPicker } from "@/components/ClassPicker";

function QuickCaptureInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialClassId = searchParams.get("classId") ?? DEMO_TEACHER.classIds[0] ?? SEED_CLASSES[0].id;
  const [activeClassId, setActiveClassId] = useState(initialClassId);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("qc:lastSaved");
    if (saved) {
      setJustSaved(saved);
      sessionStorage.removeItem("qc:lastSaved");
      const t = setTimeout(() => setJustSaved(null), 2400);
      return () => clearTimeout(t);
    }
  }, []);

  const activeClass = SEED_CLASSES.find((c) => c.id === activeClassId)!;
  const children = useMemo(
    () => SEED_CHILDREN.filter((c) => c.classId === activeClassId),
    [activeClassId],
  );

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-sm text-sage-600 hover:text-amber-700">
            ← Done
          </Link>
          <div className="text-center">
            <h1 className="font-serif text-lg font-semibold text-amber-900">Quick Capture</h1>
            <p className="text-xs text-sage-500">Tap a name to start</p>
          </div>
          <Link href="/scan" className="text-sm text-sage-600 hover:text-amber-700">
            📄 Scan
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-5">
        {justSaved && (
          <div className="mb-4 rounded-full border border-sage-300 bg-sage-50 px-4 py-2 text-center text-sm font-medium text-sage-800 shadow-sm">
            ✓ Note saved for {justSaved}
          </div>
        )}

        <ClassPicker
          classes={SEED_CLASSES}
          activeClassId={activeClassId}
          onSelect={setActiveClassId}
        />

        <div className="mt-4 mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-amber-900">
              {activeClass.emoji} {activeClass.name}
            </h2>
            <p className="text-xs text-sage-500">{activeClass.ageRange}</p>
          </div>
          <p className="text-xs text-sage-500">{children.length} children</p>
        </div>

        {children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sage-300 bg-white p-8 text-center text-sm text-sage-600">
            No children in this class.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {children.map((child) => {
              const obsCount = observationCountFor(child.id);
              const days = daysSinceLastObservation(child.id);
              const stale = days === null || days >= 7;
              const fresh = days !== null && days <= 1;
              return (
                <button
                  key={child.id}
                  onClick={() => router.push(`/quick-capture/${child.id}`)}
                  className={`group relative flex aspect-[4/3] flex-col justify-between rounded-2xl border-2 bg-white p-4 text-left transition-all active:scale-[0.97] hover:shadow-lg ${
                    stale ? "border-amber-300 bg-amber-50/50" : "border-sage-200 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-base font-bold text-white">
                      {child.initials}
                    </div>
                    {fresh ? (
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-sage-700">
                        ✓ today
                      </span>
                    ) : stale ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        {days ?? "new"}{days !== null ? "d" : ""}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <div className="text-lg font-semibold leading-tight text-amber-900">
                      {child.firstName}
                    </div>
                    <div className="text-xs text-sage-600">{child.lastName}</div>
                    <div className="mt-1 text-[11px] text-sage-500">
                      {obsCount} {obsCount === 1 ? "note" : "notes"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function QuickCapturePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sage-600">Loading...</div>}>
      <QuickCaptureInner />
    </Suspense>
  );
}
