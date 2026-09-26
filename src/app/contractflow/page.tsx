"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileUp,
  FileText,
  Flag,
  Route,
  BellPlus,
  Loader2,
  Check,
  CircleAlert,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

// ── Types mirroring the API payloads ──────────────────────────

interface Contract {
  parties: string[];
  effective_date: string | null;
  termination_date: string | null;
  renewal_terms: string | null;
  penalties: string[];
  obligations: { party: string; obligation: string }[];
}

interface Deviation {
  clause_name: string;
  risk_level: "low" | "medium" | "high";
  finding: string;
  standard?: string | null;
}

interface RoutePlan {
  path: string;
  approvers: string[];
  rationale: string;
  risk_level: "low" | "medium" | "high";
}

interface Deadline {
  title: string;
  date: string;
  all_day: boolean;
  description?: string;
}

const STEPS = [
  { id: 1, label: "Extract", Icon: FileText },
  { id: 2, label: "Flag", Icon: Flag },
  { id: 3, label: "Route", Icon: Route },
  { id: 4, label: "Remind", Icon: BellPlus },
] as const;

const RISK_STYLES = {
  high: "border-flag-red/40 bg-flag-red/10 text-flag-red",
  medium: "border-flag-yellow/40 bg-flag-yellow/10 text-flag-yellow",
  low: "border-flag-green/40 bg-flag-green/10 text-flag-green",
} as const;

export default function ContractFlowPage() {
  const [step, setStep] = useState(1); // furthest completed step
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const [contract, setContract] = useState<Contract | null>(null);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [route, setRoute] = useState<RoutePlan | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setError(null);
    if (!f) return;
    const ok =
      f.type === "application/pdf" ||
      f.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.type === "text/plain" ||
      /\.(pdf|docx|txt)$/i.test(f.name);
    if (!ok) {
      setError("Please upload a PDF, DOCX, or plain-text contract.");
      return;
    }
    if (f.size > 9 * 1024 * 1024) {
      setError("File is too large. Please use one under 9 MB.");
      return;
    }
    setFile(f);
    // Reset downstream results when a new file is chosen.
    setStep(1);
    setContract(null);
    setDeviations([]);
    setRoute(null);
    setDeadlines([]);
  };

  const toBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = String(r.result);
        resolve(s.slice(s.indexOf(",") + 1));
      };
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(f);
    });

  const post = async <T,>(url: string, body: unknown): Promise<T> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok || data.error) throw new Error(data.error || "Request failed");
    return data;
  };

  const runExtract = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fileBase64 = await toBase64(file);
      const data = await post<{ contract: Contract; source?: string }>(
        "/api/contractflow/extract",
        { fileBase64, mimeType: file.type || "application/octet-stream" }
      );
      setContract(data.contract);
      setSource(data.source ?? null);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  };

  const runFlag = async () => {
    if (!contract) return;
    setBusy(true);
    setError(null);
    try {
      const data = await post<{ deviations: Deviation[] }>(
        "/api/contractflow/flag",
        { contract }
      );
      setDeviations(data.deviations);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Flagging failed.");
    } finally {
      setBusy(false);
    }
  };

  const runRoute = async () => {
    if (!contract) return;
    setBusy(true);
    setError(null);
    try {
      const data = await post<{ route: RoutePlan }>("/api/contractflow/route", {
        deviations,
      });
      setRoute(data.route);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Routing failed.");
    } finally {
      setBusy(false);
    }
  };

  const runReminders = async () => {
    if (!contract) return;
    setBusy(true);
    setError(null);
    try {
      const data = await post<{ deadlines: Deadline[] }>(
        "/api/contractflow/reminders",
        { contract }
      );
      setDeadlines(data.deadlines);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reminder extraction failed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadIcs = async () => {
    if (!contract) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contractflow/reminders?mode=ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract }),
      });
      if (!res.ok) throw new Error("Could not generate calendar file.");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "contractflow-deadlines.ics";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <div className="container px-5">
          <header className="max-w-2xl">
            <h1 className="font-display text-fluid-h1 font-semibold">
              ContractFlow
            </h1>
            <p className="mt-2 text-muted-foreground">
              Upload a contract. Extract the key terms, flag deviations from
              your standard clauses, route it for approval, and get reminders.
            </p>
          </header>

          {/* ── Stepper ───────────────────────────────────────── */}
          <ol
            className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3"
            aria-label="Progress"
          >
            {STEPS.map(({ id, label, Icon }, i) => {
              const done = step > id;
              const current = step === id;
              return (
                <li key={id} className="flex items-center gap-2 sm:gap-3">
                  <div
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                      done
                        ? "border-flag-green/40 bg-flag-green/10 text-flag-green"
                        : current
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    )}
                    {id}. {label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="text-muted-foreground">
                      →
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* ── Step panels ───────────────────────────────────── */}
          <div className="mt-6">
            {/* Step 1: upload + extract */}
            <section
              aria-labelledby="step1-heading"
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <h2 id="step1-heading" className="font-display text-fluid-h3 font-semibold">
                1. Extract
              </h2>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={cn(
                  "mt-3 rounded-2xl border-2 border-dashed p-6 text-center",
                  file ? "border-flag-green/50 bg-flag-green/5" : "border-border bg-background"
                )}
              >
                <FileUp className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                {file ? (
                  <>
                    <p className="mt-2 text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB · ready
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm">Drag & drop a PDF, DOCX, or TXT contract</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
                      Choose a file
                    </Button>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,text/plain"
                  className="sr-only"
                  aria-label="Upload contract file"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button
                className="mt-4 w-full sm:w-auto"
                onClick={() => void runExtract()}
                disabled={busy || !file || Boolean(contract)}
              >
                {busy && step === 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : contract ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {contract ? "Extracted" : busy && step === 1 ? "Extracting…" : "Extract key terms"}
              </Button>
            </section>

            {/* Step 2: flag */}
            {step >= 2 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                aria-labelledby="step2-heading"
                className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <h2 id="step2-heading" className="font-display text-fluid-h3 font-semibold">
                  2. Flag deviations
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compare the extracted terms against your standard clause
                  library (contract_templates).
                </p>
                {deviations.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {deviations.map((d, i) => (
                      <li key={i} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide", RISK_STYLES[d.risk_level])}>
                            {d.risk_level} risk
                          </span>
                          <span className="text-sm font-semibold">{d.clause_name}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed">{d.finding}</p>
                        {d.standard && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Standard: {d.standard}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {source === "sample" && step === 2 && (
                  <p className="mt-3 text-xs text-caption">
                    Demo output — set GROQ_API_KEY + contract_templates rows for live flagging.
                  </p>
                )}
                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => void runFlag()}
                  disabled={busy || !contract || deviations.length > 0}
                >
                  {busy && step === 2 ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : deviations.length > 0 ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {deviations.length > 0 ? "Flagged" : busy && step === 2 ? "Comparing…" : "Compare to standard clauses"}
                </Button>
              </motion.section>
            )}

            {/* Step 3: route */}
            {step >= 3 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                aria-labelledby="step3-heading"
                className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <h2 id="step3-heading" className="font-display text-fluid-h3 font-semibold">
                  3. Route for approval
                </h2>
                {route && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide", RISK_STYLES[route.risk_level])}>
                      {route.risk_level} risk
                    </span>
                    <p className="mt-2 font-medium">{route.path}</p>
                    <ol className="mt-3 space-y-2">
                      {route.approvers.map((a, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {i + 1}
                          </span>
                          {a}
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 text-sm text-muted-foreground">{route.rationale}</p>
                  </div>
                )}
                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => void runRoute()}
                  disabled={busy || !contract || Boolean(route)}
                >
                  {busy && step === 3 ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : route ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {route ? "Routed" : busy && step === 3 ? "Planning…" : "Suggest approval path"}
                </Button>
              </motion.section>
            )}

            {/* Step 4: remind */}
            {step >= 4 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                aria-labelledby="step4-heading"
                className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <h2 id="step4-heading" className="font-display text-fluid-h3 font-semibold">
                  4. Remind
                </h2>
                {deadlines.length > 0 && (
                  <>
                    <ul className="mt-4 space-y-2">
                      {deadlines.map((d, i) => (
                        <li key={i} className="flex flex-wrap items-baseline gap-x-3 rounded-xl bg-secondary p-3 text-sm">
                          <span className="font-semibold">{d.title}</span>
                          <time dateTime={d.date} className="text-muted-foreground">
                            {formatDate(d.date)}
                          </time>
                          {d.description && (
                            <span className="w-full text-xs text-muted-foreground">{d.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <Button variant="secondary" className="mt-4" onClick={() => void downloadIcs()} disabled={busy}>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download .ics calendar
                    </Button>
                  </>
                )}
                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => void runReminders()}
                  disabled={busy || !contract || deadlines.length > 0}
                >
                  {busy && step === 4 ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : deadlines.length > 0 ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {deadlines.length > 0
                    ? "Deadlines ready"
                    : busy && step === 4
                      ? "Finding deadlines…"
                      : "Generate deadline reminders"}
                </Button>
              </motion.section>
            )}

            {error && (
              <div
                className="mt-4 flex items-start gap-2 rounded-xl border border-flag-red/30 bg-flag-red/10 p-3 text-sm"
                role="alert"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-flag-red" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            {source === "sample" && step > 1 && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-caption">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Running in demo mode — add GROQ_API_KEY to analyze real contracts.
              </p>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
