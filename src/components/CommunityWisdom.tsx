"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useOutcomes } from "@/lib/useOutcomes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-primary/15 text-primary",
  "bg-deadline/15 text-yellow-700 dark:text-deadline",
  "bg-flag-green/15 text-flag-green",
  "bg-flag-red/10 text-flag-red",
];

function initialsFor(context: string): string {
  const words = context.replace(/^An?\s+/i, "").trim().split(/\s+/);
  const letters = words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "An";
}

export function CommunityWisdom({ issueType }: { issueType: string }) {
  const { outcomes, addOutcome } = useOutcomes(issueType);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [toast, setToast] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 10) return;
    addOutcome(
      trimmed,
      issueType ? `Someone facing a ${issueType.toLowerCase()} issue` : "An anonymous user"
    );
    setText("");
    setShowForm(false);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  };

  return (
    <section
      aria-labelledby="community-heading"
      className="mt-12 min-w-0 scroll-mt-20"
    >
      <h2 id="community-heading" className="font-display text-fluid-h2 font-semibold">
        What happened in similar cases
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Anonymous outcomes from people who faced something similar.
      </p>

      <div
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible"
        role="list"
        aria-label="Community outcomes"
      >
        {outcomes.slice(0, 3).map((o, i) => (
          <motion.article
            key={o.id}
            role="listitem"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="min-w-[280px] snap-start rounded-2xl border border-border bg-surface p-5 shadow-md md:min-w-0"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                  AVATAR_TONES[i % AVATAR_TONES.length]
                )}
              >
                {initialsFor(o.context)}
              </span>
              <div>
                <p className="text-sm font-medium">{o.context}</p>
                <p className="text-xs text-muted-foreground">{o.timeAgo}</p>
              </div>
            </div>
            <p className="mt-3 font-serif leading-relaxed">{o.outcome}</p>
          </motion.article>
        ))}
      </div>

      {!showForm ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add your outcome (anonymous)
        </Button>
      ) : (
        <form onSubmit={submit} className="mt-4 max-w-md rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <label htmlFor="outcome-text" className="block text-sm font-medium">
            What happened in your case?
          </label>
          <textarea
            id="outcome-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Sent the letter, landlord fixed the issue in a week."
            className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm placeholder:text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={text.trim().length < 10}>
              Submit anonymously
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            No name, no email. Stored only on this device.
          </p>
        </form>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm text-background shadow-lg"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Thanks — your outcome helps others.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
