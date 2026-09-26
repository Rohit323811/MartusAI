"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, BookOpen, Scale, PenLine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { takePendingInput } from "@/lib/analysisStore";
import { useTryCounter } from "@/lib/useTryCounter";
import type { Analysis, PendingInput, StoredAnalysis } from "@/lib/analysis";

const STEPS = [
  { Icon: FileText, label: "Reading your document…" },
  { Icon: BookOpen, label: "Checking your local laws…" },
  { Icon: Scale, label: "Finding similar cases…" },
  { Icon: PenLine, label: "Drafting your response…" },
];

const STEP_MS = 1800;

function ProcessingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as "upload" | "type") ?? "type";
  const { increment } = useTryCounter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const interval = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      STEP_MS
    );

    const run = async () => {
      const pending = takePendingInput<PendingInput>();
      if (!pending) {
        setError({ message: "No document or situation found. Start a new analysis." });
        return;
      }
      try {
        const payload =
          pending.mode === "upload"
            ? {
                type: "image",
                imageBase64: pending.imageBase64,
                mimeType: pending.mimeType,
              }
            : { type: "text", text: pending.text };

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "Analysis failed.", {
            cause: data?.requestId,
          });
        }

        const stored: StoredAnalysis = {
          ...(data.analysis as Analysis),
          id: data.id,
          createdAt: new Date().toISOString(),
          mode: pending.mode,
          source: data.source ?? "grok",
          readingLevel: "plain",
        };
        // Increment only on success (and only for anonymous users).
        increment();
        import("@/lib/analysisStore").then((m) => m.stashAnalysis(stored));
        router.push(`/results/${stored.id}`);
      } catch (e) {
        if (cancelled.current) return;
        const err = e as Error & { cause?: string };
        setError({
          message:
            err.message || "Something went wrong on our end. Please try again.",
          requestId: typeof err.cause === "string" ? err.cause : undefined,
        });
      }
    };
    run();
    return () => {
      cancelled.current = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, router]);

  const Icon = STEPS[step].Icon;

  if (error) {
    return (
      <div className="container max-w-lg px-5 py-24 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-flag-red/10 text-flag-red">
          <FileText className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-fluid-h2 font-semibold">
          Something went wrong on our end
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your document is safe. Try again, or go back and edit your
          submission.
        </p>
        {error.requestId && (
          <p className="mt-2 text-xs text-caption" aria-label="Error reference">
            Reference: {error.requestId}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => router.push("/")}>Try again</Button>
          <Button variant="ghost" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="h-10 w-10" aria-hidden="true" />
            </motion.span>
          </span>
          <p aria-live="polite" className="mt-6 font-display text-fluid-h3 font-semibold">
            {STEPS[step].label}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 h-1 w-full max-w-xs overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: (STEP_MS * STEPS.length) / 1000, ease: "linear" }}
        />
      </div>

      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        This usually takes under 30 seconds. Nothing is saved unless you
        choose to save it.
      </p>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
              Loading…
            </div>
          }
        >
          <ProcessingInner />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
