"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Loader2,
  CircleAlert,
  CalendarClock,
  Download,
  ListChecks,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

interface Result {
  notice_type: string;
  response_deadline: string | null;
  court_date: string | null;
  required_actions: string[];
  response_letter: string;
  court_prep_checklist: string[];
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming", "Other / not in the US",
];

const NOTICE_TYPES = [
  "Pay-or-Quit notice",
  "Cure-or-Quit notice",
  "Unconditional Quit notice",
  "Rent increase notice",
  "Lease non-renewal",
  "Notice of entry",
  "Security deposit deduction",
  "Other",
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export default function TenantShieldPage() {
  const [state, setState] = useState("California");
  const [noticeType, setNoticeType] = useState(NOTICE_TYPES[0]);
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyze = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenantshield/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, noticeType, deadline, description }),
      });
      const data = (await res.json()) as
        | { result: Result; source?: string }
        | { error: string };
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Analysis failed.");
        return;
      }
      setResult(data.result);
      setSource(data.source ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const downloadLetter = () => {
    if (!result) return;
    const blob = new Blob([result.response_letter], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tenant-response-letter.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyLetter = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.response_letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const dlDays = daysUntil(result?.response_deadline ?? null);
  const urgent = dlDays !== null && dlDays <= 7;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <div className="container px-5">
          <header className="max-w-2xl">
            <h1 className="font-display text-fluid-h1 font-semibold">
              TenantShield
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tell us what you received. Get your deadline, a response letter
              you can send, and a court prep checklist.
            </p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* ── Form ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium">
                    State
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notice-type" className="block text-sm font-medium">
                    Notice type
                  </label>
                  <select
                    id="notice-type"
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {NOTICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="deadline" className="block text-sm font-medium">
                  Deadline on the notice <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium">
                  What happened?
                </label>
                <textarea
                  id="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. My landlord gave me a 7-day notice to pay $1,400 plus $75/day late fees. I already paid October's rent and the fees look wrong."
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background p-3 text-base placeholder:text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  At least 20 characters.
                </p>
              </div>

              <Button
                className="mt-2 w-full"
                onClick={() => void analyze()}
                disabled={busy || !state || !noticeType || description.trim().length < 20}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Analyze my situation
                  </>
                )}
              </Button>

              {error && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-xl border border-flag-red/30 bg-flag-red/10 p-3 text-sm"
                  role="alert"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-flag-red" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* ── Output ──────────────────────────────────────── */}
            <div className="space-y-4">
              {!result ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-5 text-center shadow-sm">
                  <CalendarClock className="h-10 w-10 text-caption" aria-hidden="true" />
                  <p className="mt-3 font-medium">Your deadline card appears here</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Fill the form and analyze — we&apos;ll extract deadlines,
                    draft your response letter, and prep you for court.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Deadline card */}
                  <div
                    className="rounded-2xl border p-5 shadow-sm"
                    style={{
                      borderColor: urgent
                        ? "hsl(var(--flag-red) / 0.4)"
                        : "hsl(var(--border))",
                      background: urgent
                        ? "hsl(var(--flag-red) / 0.06)"
                        : "hsl(var(--surface))",
                    }}
                    aria-label="Deadline card"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {result.notice_type}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Respond by</p>
                        <p className="font-display text-xl font-semibold">
                          {fmtDate(result.response_deadline)}
                        </p>
                        {dlDays !== null && (
                          <p className={dlDays <= 7 ? "text-sm text-flag-red" : "text-sm text-muted-foreground"}>
                            {dlDays < 0
                              ? "Overdue — act today"
                              : dlDays === 0
                                ? "Due today"
                                : `${dlDays} days left`}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Court date</p>
                        <p className="font-display text-xl font-semibold">
                          {fmtDate(result.court_date)}
                        </p>
                        {result.court_date && (
                          <p className="text-sm text-muted-foreground">
                            {daysUntil(result.court_date)} days away
                          </p>
                        )}
                      </div>
                    </div>

                    {result.required_actions.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold">Do this first</h3>
                        <ul className="mt-2 space-y-1.5">
                          {result.required_actions.map((a, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {i + 1}
                              </span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Response letter */}
                  <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold">
                        Response letter
                      </h2>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => void copyLetter()}>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={downloadLetter}>
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary p-4 font-serif text-sm leading-relaxed">
                      {result.response_letter}
                    </pre>
                  </div>

                  {/* Court prep checklist */}
                  <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                      <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
                      Court prep checklist
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {result.court_prep_checklist.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <input
                            type="checkbox"
                            id={`check-${i}`}
                            className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                          />
                          <label htmlFor={`check-${i}`} className="leading-relaxed">
                            {c}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {source === "sample" && (
                    <p className="text-center text-xs text-caption">
                      Demo output — set GROQ_API_KEY for live, state-specific analysis.
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
