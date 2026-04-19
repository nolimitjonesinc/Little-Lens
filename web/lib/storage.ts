"use client";

import { Observation } from "@/types";
import { SEED_OBSERVATIONS } from "./seed-data";

const KEY = "littlelens:observations:v1";

function readStore(): Observation[] {
  if (typeof window === "undefined") return SEED_OBSERVATIONS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return SEED_OBSERVATIONS;
    const parsed = JSON.parse(raw) as Observation[];
    return [...SEED_OBSERVATIONS, ...parsed.filter((p) => !SEED_OBSERVATIONS.some((s) => s.id === p.id))];
  } catch {
    return SEED_OBSERVATIONS;
  }
}

function writeStore(newOnes: Observation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(newOnes));
  } catch {}
}

export function getAllObservations(): Observation[] {
  return readStore();
}

export function getObservationsForChild(childId: string): Observation[] {
  return readStore()
    .filter((o) => o.childId === childId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addObservation(obs: Observation): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  const existing: Observation[] = raw ? JSON.parse(raw) : [];
  existing.push(obs);
  writeStore(existing);
}

export function addObservations(list: Observation[]): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  const existing: Observation[] = raw ? JSON.parse(raw) : [];
  existing.push(...list);
  writeStore(existing);
}

export function observationCountFor(childId: string): number {
  return readStore().filter((o) => o.childId === childId && o.confirmed).length;
}

export function lastObservationDateFor(childId: string): string | null {
  const all = getObservationsForChild(childId);
  return all.length ? all[0].createdAt : null;
}

export function daysSinceLastObservation(childId: string): number | null {
  const last = lastObservationDateFor(childId);
  if (!last) return null;
  const diff = Date.now() - new Date(last).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
