"use client";

import { motion } from "framer-motion";
import { TriangleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const flags = [
  { top: "18%", height: "9%", tone: "red" },
  { top: "46%", height: "8%", tone: "red" },
  { top: "60%", height: "8%", tone: "amber" },
  { top: "74%", height: "8%", tone: "amber" },
];

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative"
    >
      <motion.div
        animate={reduceMotion() ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg sm:p-6"
      >
        {/* Mock doc header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-caption">
              Eviction notice
            </p>
            <p className="font-display text-lg font-semibold">
              Notice to Quit
            </p>
          </div>
          <span className="rounded-full bg-flag-red/10 px-2.5 py-1 text-xs font-medium text-flag-red">
            4 flags found
          </span>
        </div>

        {/* Mock doc body */}
        <div className="relative mt-4 space-y-3 font-serif text-sm leading-relaxed text-foreground">
          {Array.from({ length: 9 }).map((_, i) => {
            const flag = flags.find((f) => f.top === `${(i + 2) * 10}%`);
            return (
              <div key={i} className="relative">
                <div className="h-3 rounded bg-secondary" style={{ width: `${85 + (i % 3) * 5}%` }} />
                {flag && (
                  <div
                    className={cn(
                      "absolute -left-2 top-0 w-[calc(100%+16px)] rounded border-2",
                      flag.tone === "red"
                        ? "border-flag-red/60 bg-flag-red/10"
                        : "border-flag-yellow/60 bg-flag-yellow/10"
                    )}
                    style={{ height: "1.5rem" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Floating legend chips */}
      <motion.div
        className="absolute -left-2 top-8 hidden rounded-xl border border-border bg-surface px-3 py-2 shadow-md sm:block"
        animate={reduceMotion() ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <p className="flex items-center gap-1.5 text-xs font-medium text-flag-red">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> 2 high-risk clauses
        </p>
      </motion.div>
      <motion.div
        className="absolute -right-2 bottom-8 hidden rounded-xl border border-border bg-surface px-3 py-2 shadow-md sm:block"
        animate={reduceMotion() ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <p className="flex items-center gap-1.5 text-xs font-medium text-flag-green">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> 62% success odds
        </p>
      </motion.div>
    </motion.div>
  );
}

function reduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
