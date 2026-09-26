"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookMarked, ExternalLink, Save, Share2 } from "lucide-react";
import type { ExplainMode, StoredAnalysis } from "@/lib/analysis";
import { loadAnalysisById } from "@/lib/analysisStore";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { ConfidenceHeatmap } from "@/components/ConfidenceHeatmap";
import { ExplainToggle } from "@/components/ExplainToggle";
import { CitationDrawer } from "@/components/CitationDrawer";
import { RightsRadar } from "@/components/RightsRadar";
import { CommunityWisdom } from "@/components/CommunityWisdom";
import { TryCounterBadge } from "@/components/TryCounterBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const RETRIEVED_AT = "2026-09-24T12:00:00Z";

export function ResultsView({ analysisId }: { analysisId: string }) {
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [missing, setMissing] = useState(false);
  const [explainMode, setExplainMode] = useState<ExplainMode>("plain");
  const [switching, setSwitching] = useState(false);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const stored = loadAnalysisById(analysisId);
    if (stored) {
      setAnalysis(stored);
      setExplainMode(stored.readingLevel ?? "plain");
    } else {
      setMissing(true);
    }
  }, [analysisId]);

  const citations = useMemo(() => analysis?.citations ?? [], [analysis]);
  const activeCitation = citations.find((c) => c.id === activeCitationId) ?? null;

  const openCitation = (id: string, trigger?: HTMLElement | null) => {
    if (trigger) triggerRef.current = trigger as HTMLSpanElement;
    setActiveCitationId(id);
  };

  const handleExplain = (mode: ExplainMode) => {
    if (mode === explainMode || !analysis) return;
    // All three reading levels ship in one payload from the API
    // (sample/demo mode). Real Grok mode re-queries and caches per
    // mode once EXPLAIN caching lands with the paid pipeline.
    setSwitching(true);
    setTimeout(() => {
      setExplainMode(mode);
      setSwitching(false);
    }, 200);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  if (missing) return <MissingState />;
  if (!analysis) return <ResultsSkeleton />;

  const demo = analysis.source === "sample";

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex flex-wrap items-center gap-x-2 gap-y-1 py-3 px-5">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {analysis.issue_type}
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
            {analysis.jurisdiction}
          </span>
          {demo && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
              demo data
            </span>
          )}
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
            <TryCounterBadge />
            <Button variant="secondary" size="sm" aria-label="Save analysis">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void share()}
              aria-label="Share analysis link"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container grid min-w-0 gap-10 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main column ─────────────────────────────────── */}
        <div className="min-w-0 max-w-3xl">
          {/* Summary + heatmap */}
          <section aria-labelledby="summary-heading" className="scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="summary-heading"
                className="font-display text-fluid-h2 font-semibold"
              >
                What this document means
              </h2>
              <ExplainToggle
                value={explainMode}
                onChange={handleExplain}
                switching={switching}
              />
            </div>
            <div className={switching ? "opacity-40 transition-opacity" : "transition-opacity"}>
              <div className="mt-6">
                <ConfidenceHeatmap
                  summary={analysis.summary}
                  citations={citations}
                  onOpenCitation={(id) => openCitation(id)}
                />
              </div>
            </div>
          </section>

          {/* Rights Radar */}
          <section aria-labelledby="radar-heading" className="mt-12 scroll-mt-24">
            <h2 id="radar-heading" className="font-display text-fluid-h2 font-semibold">
              Rights Radar — your deadlines
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every date that matters, in order. Tap a date to set a reminder.
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <RightsRadar deadlines={analysis.deadlines} />
            </div>
            <p className="sr-only">
              Deadlines are colored by urgency: red overdue, amber within a
              week, green safe.
            </p>
          </section>

          {/* Community Wisdom */}
          <CommunityWisdom issueType={analysis.issue_type} />
        </div>

        {/* ── Sidebar (sticky desktop) ────────────────────── */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start" aria-label="Sources and actions">
          {/* Citations mini-TOC */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <BookMarked className="h-4 w-4 text-primary" aria-hidden="true" />
              Sources ({citations.length})
            </h3>
            <ul className="mt-3 space-y-2">
              {citations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openCitation(c.id)}
                    className="w-full rounded-xl p-2 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="line-clamp-2 font-medium">{c.statute}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      open quote & link
                    </span>
                  </button>
                </li>
              ))}
              {citations.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No verifiable citations for this analysis.
                </li>
              )}
            </ul>
          </div>

          {/* Save card */}
          <div className="mt-4 rounded-2xl border border-border bg-secondary p-5">
            <h3 className="font-display text-lg font-semibold">
              Keep this analysis
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Anonymous analyses live in this browser only. Sign in to keep
              them on any device.
            </p>
            <Button size="sm" className="mt-3 w-full" aria-label="Save analysis to your account">
              Save this analysis
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-caption">
            Created {formatDate(analysis.createdAt)} · not legal advice
          </p>
        </aside>
      </div>

      {/* Bottom CTA */}
      <div className="container px-5 pb-16">
        <div className="rounded-3xl border border-border bg-secondary p-8 text-center">
          <h3 className="font-display text-fluid-h3 font-semibold">
            Want a human to look at this?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Connect with a free legal aid volunteer who handles cases like
            yours. No cost, no obligation.
          </p>
          <Button size="lg" className="mt-5 max-w-full">
            <span className="whitespace-normal">Connect with a legal aid volunteer</span>
          </Button>
        </div>
      </div>

      <CitationDrawer
        isOpen={Boolean(activeCitation)}
        citation={activeCitation}
        retrievedAt={RETRIEVED_AT}
        onClose={() => setActiveCitationId(null)}
        triggerRef={triggerRef}
      />
    </div>
  );
}

function MissingState() {
  return (
    <div className="container px-5 py-24 text-center">
      <BookMarked className="mx-auto h-10 w-10 text-caption" aria-hidden="true" />
      <h1 className="mt-4 font-display text-fluid-h2 font-semibold">
        Analysis not found
      </h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        Anonymous analyses live only on the device that created them. Start a
        new analysis, or sign in to see your saved ones.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Start a new analysis
      </Link>
    </div>
  );
}
