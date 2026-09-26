"use client";

import type { ExplainMode } from "@/lib/analysis";
import { cn } from "@/lib/utils";

const MODES: { id: ExplainMode; label: string }[] = [
  { id: "legal", label: "Legal" },
  { id: "plain", label: "Plain" },
  { id: "simple", label: "Simple" },
];

export function ExplainToggle({
  value,
  onChange,
  switching = false,
}: {
  value: ExplainMode;
  onChange: (mode: ExplainMode) => void;
  switching?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Explanation style"
      className={cn(
        "flex rounded-full border border-border bg-surface p-1 shadow-sm transition-opacity",
        switching && "opacity-60"
      )}
    >
      {MODES.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            role="radio"
            aria-checked={active}
            onClick={() => !active && onChange(m.id)}
            className={cn(
              "min-h-[36px] rounded-full px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
