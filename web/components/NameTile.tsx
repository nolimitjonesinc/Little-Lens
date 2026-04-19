"use client";

import { Child } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  child: Child;
  observationCount: number;
  daysSinceLast: number | null;
  onClick: () => void;
}

export function NameTile({ child, observationCount, daysSinceLast, onClick }: Props) {
  const stale = daysSinceLast !== null && daysSinceLast >= 7;
  const fresh = daysSinceLast !== null && daysSinceLast <= 1;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative aspect-[4/3] rounded-2xl border-2 bg-white p-4 text-left transition-all active:scale-[0.98]",
        "hover:shadow-lg hover:border-amber-400",
        stale ? "border-amber-300 bg-amber-50/60" : "border-sage-200",
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
              "bg-gradient-to-br from-amber-400 to-amber-500 text-white",
            )}
            aria-hidden
          >
            {child.initials}
          </div>
          {stale && (
            <span className="text-xs font-semibold text-amber-700">
              {daysSinceLast}d
            </span>
          )}
          {fresh && (
            <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
              ✓ today
            </span>
          )}
        </div>
        <div>
          <div className="text-lg font-semibold text-amber-900 leading-tight">
            {child.firstName}
          </div>
          <div className="text-xs text-sage-600">
            {child.lastName}
          </div>
          <div className="mt-2 text-xs text-sage-500">
            {observationCount} {observationCount === 1 ? "note" : "notes"}
          </div>
        </div>
      </div>
    </button>
  );
}
