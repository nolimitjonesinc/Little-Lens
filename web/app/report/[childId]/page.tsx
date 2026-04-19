"use client";

import { SEED_CHILDREN, DEMO_TEACHER, DEMO_SCHOOL } from "@/lib/seed-data";
import { getObservationsForChild } from "@/lib/storage";
import { ageYearsMonths, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Observation } from "@/types";

interface ReportData {
  domainSummaries: Record<string, string>;
  overallNarrative: string;
  cached?: boolean;
}

export default function GeneratedReport() {
  const params = useParams();
  const childId = params.childId as string;
  const child = SEED_CHILDREN.find((c) => c.id === childId);

  const [observations, setObservations] = useState<Observation[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    const obs = getObservationsForChild(childId);
    setObservations(obs);
    void generate(obs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function generate(obs: Observation[]) {
    if (!child) { setLoading(false); return; }
    if (obs.length === 0) { setLoading(false); return; }

    const cacheKey = `report:${childId}:${obs.length}`;
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        setReport({ ...(JSON.parse(cached) as ReportData), cached: true });
        setLoading(false);
        return;
      } catch {}
    }

    setLoading(true);
    setAiError(false);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: child.firstName,
          lastName: child.lastName,
          age: ageYearsMonths(child.dateOfBirth),
          periodStart: obs.length > 0 ? formatDate(obs[obs.length - 1].createdAt) : "",
          periodEnd: obs.length > 0 ? formatDate(obs[0].createdAt) : "",
          teacherName: DEMO_TEACHER.name,
          schoolName: DEMO_SCHOOL.name,
          observations: obs.map((o) => ({
            cleanedObservation: o.cleanedObservation,
            rawTranscript: o.rawTranscript,
            tags: o.tags,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReport(data);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    } catch {
      setAiError(true);
      setReport(fallbackReport(child.firstName, obs));
    } finally {
      setLoading(false);
    }
  }

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-amber-900">Child not found. <Link href="/dashboard" className="underline">Back</Link></div>
      </div>
    );
  }

  const periodStart = observations.length > 0 ? formatDate(observations[observations.length - 1].createdAt) : "—";
  const periodEnd = observations.length > 0 ? formatDate(observations[0].createdAt) : "—";

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="no-print sticky top-0 z-10 border-b border-sage-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link href={`/child/${childId}`} className="text-sm text-sage-600 hover:text-amber-700">
            ← Back to {child.firstName}
          </Link>
          <button
            onClick={() => window.print()}
            disabled={loading}
            className="rounded-full bg-sage-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sage-700 disabled:bg-sage-300"
          >
            🖨 Print / PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-sage-500 border-t-transparent" />
            <p className="text-sm text-sage-700">Drafting {child.firstName}&apos;s report...</p>
            <p className="text-xs text-sage-500">Usually 10–20 seconds</p>
          </div>
        )}

        {!loading && report && (
          <article className="rounded-3xl bg-white p-8 shadow-md font-serif print:shadow-none print:p-0 sm:p-12">
            {aiError && (
              <div className="no-print mb-6 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 font-sans">
                AI report generation offline — showing template fallback. Set ANTHROPIC_API_KEY to enable AI-drafted narrative.
              </div>
            )}
            {report.cached && (
              <p className="no-print mb-4 text-right text-[11px] text-sage-500 font-sans">
                (showing cached draft from this session)
              </p>
            )}

            <header className="border-b-2 border-amber-200 pb-8 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-sage-600">
                {DEMO_SCHOOL.name}
              </p>
              <h1 className="mt-4 text-3xl font-bold text-amber-900">
                Developmental Progress Report
              </h1>
              <p className="mt-3 text-xl text-amber-800">
                {child.firstName} {child.lastName}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-6 text-left text-sm">
                <div>
                  <p className="text-sage-600">Date of Birth</p>
                  <p className="font-medium text-amber-900">{formatDate(child.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sage-600">Age</p>
                  <p className="font-medium text-amber-900">{ageYearsMonths(child.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sage-600">Report Period</p>
                  <p className="font-medium text-amber-900">{periodStart} – {periodEnd}</p>
                </div>
              </div>
            </header>

            <section className="mt-10">
              <h2 className="mb-4 text-2xl font-bold text-amber-900">Overall Summary</h2>
              <div className="space-y-4 text-lg leading-relaxed text-amber-900">
                {report.overallNarrative.split("\n\n").filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-6 text-2xl font-bold text-amber-900">Developmental Domains</h2>
              <div className="space-y-6">
                {Object.entries(report.domainSummaries).map(([domain, summary]) => (
                  <div key={domain}>
                    <h3 className="text-lg font-semibold text-amber-800">{domain}</h3>
                    <p className="mt-1 leading-relaxed text-amber-900">{summary}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="mb-3 text-xl font-bold text-amber-900">Based on Observations</h2>
              <p className="mb-3 text-sm text-sage-700">
                This report draws from {observations.length} teacher observations captured between {periodStart} and {periodEnd}.
              </p>
              <ul className="space-y-2">
                {observations.slice(0, 6).map((o) => (
                  <li key={o.id} className="flex gap-2 text-sm text-amber-900">
                    <span className="text-amber-500">•</span>
                    <span>{o.cleanedObservation}</span>
                  </li>
                ))}
              </ul>
            </section>

            <footer className="mt-12 border-t-2 border-amber-200 pt-6 text-center text-sm text-sage-600">
              <p>Prepared by {DEMO_TEACHER.name}</p>
              <p>{DEMO_SCHOOL.name} · {DEMO_SCHOOL.city}</p>
              <p className="mt-2">{formatDate(new Date().toISOString())}</p>
            </footer>
          </article>
        )}

        {!loading && !report && observations.length === 0 && (
          <div className="rounded-2xl border border-sage-200 bg-white p-8 text-center">
            <p className="text-sage-700">No observations yet — capture a few notes to generate a report.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function fallbackReport(firstName: string, obs: Observation[]): ReportData {
  const tagCounts: Record<string, number> = {};
  obs.forEach((o) => o.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort(([,a],[,b]) => b - a).slice(0, 5);

  const domainSummaries: Record<string, string> = {};
  for (const [domain, count] of topTags) {
    domainSummaries[domain] = `${firstName} has shown growth in ${domain.toLowerCase()} across ${count} documented observations this period, demonstrating steady emerging skills.`;
  }

  const overallNarrative = `${firstName} is an engaged learner who has shown consistent growth this reporting period.\n\n` +
    `Across ${obs.length} documented observations, ${firstName} has demonstrated emerging skills in ${topTags.map(([t]) => t.toLowerCase()).slice(0, 3).join(", ")}, and continues to develop positive peer relationships and classroom routines.\n\n` +
    `We recommend continuing to offer varied materials for exploration, fostering collaborative play, and celebrating ${firstName}'s growth through specific and descriptive praise.`;

  return { domainSummaries, overallNarrative };
}
