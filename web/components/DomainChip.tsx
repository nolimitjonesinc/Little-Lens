import { DOMAIN_COLORS } from "@/types";
import { cn } from "@/lib/utils";

export function DomainChip({ tag, size = "md" }: { tag: string; size?: "sm" | "md" }) {
  const c = DOMAIN_COLORS[tag] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        c.bg,
        c.text,
        c.border,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {tag}
    </span>
  );
}
