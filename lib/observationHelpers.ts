import { SEED_OBSERVATIONS } from "./seed-data";

export function observationCountFor(childId: string): number {
  return SEED_OBSERVATIONS.filter((o) => o.childId === childId && o.confirmed).length;
}

export function daysSinceLastObservation(childId: string): number | null {
  const obs = SEED_OBSERVATIONS
    .filter((o) => o.childId === childId && o.confirmed)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (obs.length === 0) return null;
  const diff = Date.now() - obs[0].createdAt.getTime();
  return Math.floor(diff / 86400000);
}
