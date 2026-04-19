"use client";

import { ClassRoom } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  classes: ClassRoom[];
  activeClassId: string;
  onSelect: (classId: string) => void;
}

export function ClassPicker({ classes, activeClassId, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {classes.map((c) => {
        const active = c.id === activeClassId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              active
                ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                : "border-sage-200 bg-white text-sage-700 hover:border-amber-300",
            )}
          >
            <span className="mr-1.5">{c.emoji}</span>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
