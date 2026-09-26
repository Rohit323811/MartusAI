"use client";

import { motion } from "framer-motion";
import type { SummarySpan, Citation } from "@/lib/analysis";
import { cn } from "@/lib/utils";

const CONFIDENCE_BG: Record<SummarySpan["confidence"], string> = {
  high: "",
  medium: "bg-[rgba(234,179,8,0.12)] rounded px-0.5 -mx-0.5",
  low: "bg-[rgba(220,38,38,0.12)] rounded px-0.5 -mx-0.5",
};

export function ConfidenceHeatmap({
  summary,
  citations,
  onOpenCitation,
}: {
  summary: SummarySpan[];
  citations: Citation[];
  onOpenCitation: (id: string) => void;
}) {
  const citationById = new Map(citations.map((c) => [c.id, c]));

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-border" aria-hidden="true" />
          High confidence
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded bg-[rgba(234,179,8,0.25)]" aria-hidden="true" />
          Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded bg-[rgba(220,38,38,0.25)]" aria-hidden="true" />
          Low — verify
        </span>
        <span className="hidden sm:inline">· Click dotted text to see sources.</span>
      </div>

      <div className="mt-6 max-w-[68ch] space-y-4 font-serif text-base leading-[1.75] md:text-lg">
        {summary.map((span, i) => {
          const citation = span.citation_id
            ? citationById.get(span.citation_id)
            : undefined;
          const clickable = Boolean(citation);
          const label = clickable
            ? `Open source: ${citation!.statute}`
            : span.confidence === "low"
              ? "Low confidence — verify this"
              : `${span.confidence} confidence`;

          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
            >
              <span
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={label}
                onClick={clickable ? () => onOpenCitation(citation!.id) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenCitation(citation!.id);
                        }
                      }
                    : undefined
                }
                className={cn(
                  CONFIDENCE_BG[span.confidence],
                  clickable &&
                    "cursor-pointer underline decoration-primary/60 [text-decoration-style:dotted] [text-decoration-thickness:1.5px] underline-offset-4 transition-colors hover:decoration-primary hover:bg-primary/5 focus-visible:bg-primary/10"
                )}
              >
                {span.text}
              </span>
            </motion.p>
          );
        })}
      </div>
    </div>
  );
}
