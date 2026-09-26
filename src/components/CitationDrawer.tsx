"use client";

import { useEffect, useRef } from "react";
import { X, ExternalLink } from "lucide-react";
import type { Citation } from "@/lib/analysis";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";

interface CitationDrawerProps {
  isOpen: boolean;
  citation: Citation | null;
  retrievedAt: string;
  onClose: () => void;
  /** Element to restore focus to when the drawer closes. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function CitationDrawer({
  isOpen,
  citation,
  retrievedAt,
  onClose,
  triggerRef,
}: CitationDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open; restore focus to trigger on close.
  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
      return;
    }
    triggerRef?.current?.focus?.();
  }, [isOpen, triggerRef]);

  // Esc closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Shareable hash: #citation-{id}
  useEffect(() => {
    if (isOpen && citation) {
      history.replaceState(null, "", `#citation-${citation.id}`);
    } else if (!isOpen && window.location.hash.startsWith("#citation-")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, [isOpen, citation]);

  // Open on load if hash present.
  useEffect(() => {
    if (!isOpen && window.location.hash.startsWith("#citation-") && citation) {
      // caller is responsible for opening via hash on mount; noop here
    }
  }, [isOpen, citation]);

  if (!isOpen || !citation) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-drawer-title"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="backdrop-anim absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <aside
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-3xl border border-border bg-surface shadow-lg",
          "drawer-anim-bottom lg:drawer-anim-right",
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[420px] lg:rounded-l-3xl lg:rounded-tr-none"
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Drag handle (mobile affordance) */}
        <div className="flex justify-center pt-2 lg:hidden" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-start justify-between gap-3 p-6 pb-4">
          <h2
            id="citation-drawer-title"
            className="font-display text-fluid-h3 font-semibold"
          >
            {citation.statute}
          </h2>
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon"
            aria-label="Close citation"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quoted text
          </p>
          <blockquote className="mt-2 rounded-lg border-l-4 border-primary bg-secondary p-4 font-mono text-sm leading-relaxed">
            “{citation.quote}”
          </blockquote>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Source
          </p>
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            {citation.url}
          </a>

          <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Retrieved
          </p>
          <p className="mt-1 text-caption text-xs">{formatDate(retrievedAt)}</p>
        </div>
      </aside>
    </div>
  );
}
