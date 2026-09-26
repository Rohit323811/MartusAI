"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CalendarPlus, ChevronDown } from "lucide-react";
import type { Deadline, Urgency } from "@/lib/analysis";
import { Button } from "@/components/ui/button";
import { MagicLinkModal } from "@/components/MagicLinkModal";
import { useSession } from "@/lib/useSession";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { cn, formatDate } from "@/lib/utils";

/** Urgency computed client-side from the date — never trust the model. */
function computeUrgency(iso: string): Urgency {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "safe";
  const now = Date.now();
  if (d < now) return "overdue";
  if (d - now < 7 * 86400000) return "soon";
  return "safe";
}

const URGENCY_COLOR: Record<Urgency, string> = {
  overdue: "bg-flag-red",
  soon: "bg-deadline",
  safe: "bg-flag-green",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Overdue",
  soon: "Due within 7 days",
  safe: "You have time",
};

function daysLabel(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Math.round((d - Date.now()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

export function RightsRadar({ deadlines }: { deadlines: Deadline[] }) {
  const { isSignedIn } = useSession();
  const [openNode, setOpenNode] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [reminderState, setReminderState] = useState<Record<string, "idle" | "saving" | "saved" | "local">>({});
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (deadlines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
        <p className="font-medium">No deadlines detected in this document.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          If you know of one, add it manually.
        </p>
        <Button variant="secondary" size="sm" className="mt-3">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Add a deadline
        </Button>
      </div>
    );
  }

  const remind = async (d: Deadline) => {
    if (!isSignedIn) {
      setSignInOpen(true);
      return;
    }
    setReminderState((s) => ({ ...s, [d.label]: "saving" }));
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from("reminders").insert({
          label: d.label,
          due_date: d.date,
        });
        if (error) throw error;
      }
      setReminderState((s) => ({ ...s, [d.label]: "saved" }));
    } catch {
      // Supabase unavailable — fall back to a local reminder.
      try {
        const raw = localStorage.getItem("martusai_local_reminders");
        const list: string[] = raw ? JSON.parse(raw) : [];
        list.push(`${d.label}@${d.date}`);
        localStorage.setItem("martusai_local_reminders", JSON.stringify(list));
      } catch {
        // ignore
      }
      setReminderState((s) => ({ ...s, [d.label]: "local" }));
    }
  };

  return (
    <div>
      {/* Timeline: vertical mobile → horizontal desktop */}
      <ol
        className={cn(
          "relative",
          "flex flex-col gap-4 pl-6",
          "md:flex-row md:gap-0 md:pl-0"
        )}
        aria-label="Deadlines timeline"
      >
        {/* connecting line */}
        <span
          aria-hidden="true"
          className="absolute left-[7px] top-2 bottom-2 w-px bg-border md:left-8 md:right-8 md:top-[7px] md:bottom-auto md:h-px md:w-auto"
        />
        {deadlines.map((d, i) => {
          const urgency = computeUrgency(d.date);
          const expanded = openNode === d.label;
          const state = reminderState[d.label] ?? "idle";
          return (
            <motion.li
              key={d.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.1 }}
              className="relative md:flex-1 md:px-4"
            >
              <div
                ref={(el) => {
                  nodeRefs.current[d.label] = el;
                }}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={() => setOpenNode(expanded ? null : d.label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenNode(expanded ? null : d.label);
                  }
                }}
                className="cursor-pointer rounded-2xl p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
                  <span className="relative shrink-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "block h-4 w-4 rounded-full ring-4 ring-background",
                        URGENCY_COLOR[urgency],
                        urgency === "overdue" && "animate-pulse"
                      )}
                    />
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-snug">{d.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(d.date)} · {daysLabel(d.date)}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs font-medium",
                        urgency === "overdue" && "text-flag-red",
                        urgency === "soon" && "text-yellow-700 dark:text-deadline",
                        urgency === "safe" && "text-flag-green"
                      )}
                    >
                      {URGENCY_LABEL[urgency]}
                    </p>
                  </div>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "ml-auto h-4 w-4 text-muted-foreground transition-transform md:hidden",
                      expanded && "rotate-180"
                    )}
                  />
                </div>
              </div>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden md:text-center"
                >
                  <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl bg-secondary p-3 md:justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        void remind(d);
                      }}
                    >
                      <Bell className="h-4 w-4" aria-hidden="true" />
                      {state === "saved"
                        ? "Reminder saved ✓"
                        : state === "local"
                          ? "Saved on device ✓"
                          : state === "saving"
                            ? "Saving…"
                            : "Remind me"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      3 days before, by email
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.li>
          );
        })}
      </ol>

      <MagicLinkModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        title="Get deadline reminders"
        subhead="Sign in with email and we'll remind you 3 days before each deadline."
      />
    </div>
  );
}
