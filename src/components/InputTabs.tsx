"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Keyboard,
  ArrowRight,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downscaleImage } from "@/lib/imageUtils";
import { stashPendingInput } from "@/lib/analysisStore";
import { useTryCounter } from "@/lib/useTryCounter";
import { SignUpGateModal } from "@/components/SignUpGateModal";
import type { PendingInput } from "@/lib/analysis";

type Tab = "upload" | "type";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function InputTabs() {
  const router = useRouter();
  const { canAnalyze } = useTryCounter();
  const [tab, setTab] = useState<Tab>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const beginProcessing = useCallback(
    async (mode: "upload" | "type") => {
      if (!canAnalyze) {
        setGateOpen(true);
        return;
      }
      setSubmitting(true);
      try {
        let pending: PendingInput;
        if (mode === "upload" && file) {
          const { base64, mimeType } = await downscaleImage(file);
          pending = { mode, imageBase64: base64, mimeType };
        } else {
          pending = { mode, text: text.trim() };
        }
        stashPendingInput(pending);
        router.push(`/processing?mode=${mode}`);
      } catch {
        setError("Something went wrong reading your image. Please try again.");
        setSubmitting(false);
      }
    },
    [canAnalyze, file, text, router]
  );

  const trySample = useCallback(() => {
    if (!canAnalyze) {
      setGateOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const samplePending: PendingInput = {
        mode: "upload",
        text: "Sample Eviction Notice / Notice to Quit - 7 Day Pay or Quit",
      };
      stashPendingInput(samplePending);
      router.push(`/processing?mode=upload`);
    } catch {
      setError("Something went wrong loading the sample document. Please try again.");
      setSubmitting(false);
    }
  }, [canAnalyze, router]);

  const handleFiles = useCallback((files: FileList | null) => {
    setError(null);
    const f = files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Please upload a PNG, JPEG, or WebP image of your document.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("That image is too large. Please use one under 10 MB.");
      return;
    }
    setFile(f);
  }, []);

  const tabBase =
    "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-4 sm:px-6 text-sm sm:text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="w-full max-w-xl">
      <div
        role="tablist"
        aria-label="Choose input method"
        className="flex gap-2 rounded-full border border-border bg-surface p-1.5 shadow-sm"
      >
        {(
          [
            { id: "upload", label: "Upload Document", Icon: Upload },
            { id: "type", label: "Type Situation", Icon: Keyboard },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                tabBase,
                active
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === "upload" ? (
          <motion.div
            key="upload"
            id="panel-upload"
            role="tabpanel"
            aria-labelledby="tab-upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {file ? (
              <div className="mt-5 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      EXIF stripped · downscaled to 1600px · ready to analyze
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => void beginProcessing("upload")}
                  disabled={submitting}
                >
                  {submitting ? "Preparing…" : "Analyze document"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "mt-5 rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface"
                )}
              >
                <motion.div
                  animate={dragOver ? { scale: 1.05 } : { scale: 1 }}
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                >
                  <Upload className="h-7 w-7" aria-hidden="true" />
                  <span className="sr-only">Upload icon</span>
                </motion.div>
                <p className="font-medium">Drag & drop your document</p>
                <p className="mt-1 text-sm text-muted-foreground">or</p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose a photo or scan
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  PNG, JPEG, or WebP · up to 10 MB
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="sr-only"
                  aria-label="Upload document image"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="type"
            id="panel-type"
            role="tabpanel"
            aria-labelledby="tab-type"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-5 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
              <label htmlFor="situation" className="block text-sm font-medium">
                Describe your situation
              </label>
              <textarea
                id="situation"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. My landlord gave me a 7-day notice to pay $1,200 rent plus $75/day late fees. I think the fees are too high. What are my rights?"
                className={cn(
                  "mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-base leading-relaxed",
                  "placeholder:text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <p>At least 20 characters helps us analyze better.</p>
                <span aria-hidden="true">{text.length}</span>
              </div>
              <Button
                className="mt-3 w-full"
                onClick={() => void beginProcessing("type")}
                disabled={submitting || text.trim().length < 20}
              >
                Analyze my situation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setTab("upload");
            setTimeout(() => inputRef.current?.click(), 50);
          }}
          className="rounded-full px-4 text-xs font-medium sm:text-sm"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Upload a document
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={trySample}
          disabled={submitting}
          className="rounded-full px-4 text-xs font-medium sm:text-sm"
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Try a sample
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTab("type")}
          className="rounded-full px-4 text-xs font-medium sm:text-sm"
        >
          <Keyboard className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Describe your situation
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-start gap-2 rounded-xl border border-flag-red/30 bg-flag-red/10 p-3 text-sm text-foreground"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-flag-red"
              aria-hidden="true"
            />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <SignUpGateModal open={gateOpen} onOpenChange={setGateOpen} />
    </div>
  );
}
