"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Languages,
  ListChecks,
  TriangleAlert,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

type Tab = "plain" | "points" | "flags";

interface RedFlag {
  clause: string;
  why_it_hurts_you: string;
  severity: "high" | "medium" | "low";
}

interface TranslateResult {
  plain_english: string;
  key_points: string[];
  red_flags: RedFlag[];
}

const TABS: { id: Tab; label: string; Icon: typeof Languages }[] = [
  { id: "plain", label: "Plain English", Icon: Languages },
  { id: "points", label: "Key Points", Icon: ListChecks },
  { id: "flags", label: "Red Flags", Icon: TriangleAlert },
];

const SEVERITY_STYLES: Record<RedFlag["severity"], string> = {
  high: "border-flag-red/40 bg-flag-red/10 text-flag-red",
  medium: "border-flag-yellow/40 bg-flag-yellow/10 text-flag-yellow",
  low: "border-flag-green/40 bg-flag-green/10 text-flag-green",
};

export default function PlainSitePage() {
  const [text, setText] = useState("");
  const [tab, setTab] = useState<Tab>("plain");
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plainsite/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = (await res.json()) as
        | { result: TranslateResult; source?: string }
        | { error: string };
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Translation failed.");
        return;
      }
      setResult(data.result);
      setSource(data.source ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ready = text.trim().length >= 50;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <div className="container px-5">
          <header className="max-w-2xl">
            <h1 className="font-display text-fluid-h1 font-semibold">
              PlainSite
            </h1>
            <p className="mt-2 text-muted-foreground">
              Paste any legal text. Get it in plain English, the key points,
              and the clauses that work against you.
            </p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* ── Left: input ─────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <label htmlFor="legal-text" className="block text-sm font-medium">
                Legal text
              </label>
              <textarea
                id="legal-text"
                rows={16}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a lease, notice, contract clause, terms of service…"
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-base leading-relaxed placeholder:text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{text.trim().length < 50 ? "At least 50 characters" : "Ready to translate"}</span>
                <span aria-hidden="true">{text.length.toLocaleString()}</span>
              </div>
              <Button
                className="mt-3 w-full"
                onClick={() => void translate()}
                disabled={loading || !ready}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Translating…
                  </>
                ) : (
                  "Translate to plain English"
                )}
              </Button>
            </div>

            {/* ── Right: output tabs ──────────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              {!result && !loading && (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <Languages className="h-10 w-10 text-caption" aria-hidden="true" />
                  <p className="mt-3 font-medium">Your translation appears here</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Plain English, up to 5 key points, and every clause that
                    disadvantages you.
                  </p>
                </div>
              )}
              {loading && (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  <p className="text-sm">Reading the fine print…</p>
                </div>
              )}
              {result && !loading && (
                <>
                  <div
                    role="tablist"
                    aria-label="Translation views"
                    className="flex gap-1 rounded-full border border-border bg-secondary p-1"
                  >
                    {TABS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={cn(
                          "flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          tab === id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>

                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mt-4"
                  >
                    {tab === "plain" && (
                      <div className="prose-sm whitespace-pre-wrap text-base leading-relaxed text-foreground">
                        {result.plain_english}
                      </div>
                    )}

                    {tab === "points" && (
                      <ul className="space-y-3">
                        {result.key_points.map((p, i) => (
                          <li key={i} className="flex gap-3 rounded-xl bg-secondary p-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {i + 1}
                            </span>
                            <span className="text-sm leading-relaxed">{p}</span>
                          </li>
                        ))}
                        {result.key_points.length === 0 && (
                          <li className="text-sm text-muted-foreground">No key points found.</li>
                        )}
                      </ul>
                    )}

                    {tab === "flags" && (
                      <ul className="space-y-3">
                        {result.red_flags.map((f, i) => (
                          <li
                            key={i}
                            className="rounded-xl border border-border bg-background p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                                  SEVERITY_STYLES[f.severity]
                                )}
                              >
                                {f.severity} risk
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium italic">
                              “{f.clause}”
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                              {f.why_it_hurts_you}
                            </p>
                          </li>
                        ))}
                        {result.red_flags.length === 0 && (
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-flag-green" aria-hidden="true" />
                            No disadvantageous clauses found.
                          </li>
                        )}
                      </ul>
                    )}
                  </motion.div>

                  {source === "sample" && (
                    <p className="mt-4 text-center text-xs text-caption">
                      Demo output — set GROQ_API_KEY to enable live translation.
                    </p>
                  )}
                </>
              )}
              {error && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-xl border border-flag-red/30 bg-flag-red/10 p-3 text-sm"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-flag-red" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
