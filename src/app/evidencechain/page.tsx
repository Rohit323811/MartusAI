"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Fingerprint,
  ShieldCheck,
  ShieldX,
  Loader2,
  CircleAlert,
  Camera,
  FileText,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";

interface RegisterResponse {
  action: "register";
  entry_id: string;
  file_name: string;
  file_hash: string;
  logged_at: string;
  uploader_note: string | null;
  metadata: Record<string, unknown>;
  persisted: boolean;
}

interface VerifyResponse {
  action: "verify";
  computed_hash: string;
  expected_hash: string;
  match: boolean;
  file_name: string | null;
  logged_at: string | null;
}

const ACCEPT =
  "image/*,video/*,application/pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf";

const META_LABELS: Record<string, string> = {
  Make: "Camera make",
  Model: "Camera model",
  DateTimeOriginal: "Original date",
  CreateDate: "Created",
  ModifyDate: "Modified",
  ISO: "ISO",
  FNumber: "Aperture",
  ExposureTime: "Exposure",
  GPSLatitude: "GPS latitude",
  GPSLongitude: "GPS longitude",
  ImageWidth: "Width",
  ImageHeight: "Height",
  Orientation: "Orientation",
  Software: "Software",
  pages: "Pages",
  size_bytes: "Size",
  mime_type: "Type",
};

function typeIcon(mime: string) {
  if (mime.startsWith("image/")) return Camera;
  if (mime.startsWith("video/")) return Video;
  return FileText;
}

export default function EvidenceChainPage() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [entry, setEntry] = useState<RegisterResponse | null>(null);
  const [verify, setVerify] = useState<VerifyResponse | null>(null);
  const [busy, setBusy] = useState<"register" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setError(null);
    setEntry(null);
    setVerify(null);
    setQr(null);
    if (f && f.size > 25 * 1024 * 1024) {
      setError("File is too large. Maximum is 25 MB.");
      return;
    }
    setFile(f);
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

  const register = async () => {
    if (!file) return;
    setBusy("register");
    setError(null);
    setVerify(null);
    try {
      const fileBase64 = await toBase64(file);
      const res = await fetch("/api/evidencechain/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          fileBase64,
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
          uploaderNote: note.trim() || undefined,
        }),
      });
      const data = (await res.json()) as RegisterResponse & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Registration failed.");
      setEntry(data);

      // Verification URL encoded in the QR code (shareable custody link).
      const verifyUrl = `${window.location.origin}/evidencechain?entry=${data.entry_id}&hash=${data.file_hash}`;
      const { default: QRCode } = await import("qrcode");
      setQr(await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setBusy(null);
    }
  };

  const reverify = async () => {
    if (!file || !entry) return;
    setBusy("verify");
    setError(null);
    try {
      const fileBase64 = await toBase64(file);
      const res = await fetch("/api/evidencechain/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          fileBase64,
          entryId: entry.entry_id,
        }),
      });
      const data = (await res.json()) as VerifyResponse & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Verification failed.");
      setVerify(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(null);
    }
  };

  const copyHash = async () => {
    if (!entry) return;
    try {
      await navigator.clipboard.writeText(entry.file_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <div className="container px-5">
          <header className="max-w-2xl">
            <h1 className="font-display text-fluid-h1 font-semibold">
              EvidenceChain
            </h1>
            <p className="mt-2 text-muted-foreground">
              Create a tamper-evident record of a photo, video, or PDF. SHA-256
              fingerprint, metadata, and a chain-of-custody card you can share.
            </p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* ── Upload + note ───────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-6 text-center",
                  file ? "border-flag-green/50 bg-flag-green/5" : "border-border bg-background"
                )}
              >
                <Link2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                {file ? (
                  <>
                    <p className="mt-2 text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB · {file.type || "unknown type"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm">Drag & drop a photo, video, or PDF</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
                      Choose a file
                    </Button>
                    <p className="mt-3 text-xs text-muted-foreground">Up to 25 MB</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  aria-label="Upload evidence file"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <label htmlFor="uploader-note" className="mt-4 block text-sm font-medium">
                Uploader note (optional)
              </label>
              <textarea
                id="uploader-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                placeholder="e.g. Photo of the water damage taken with my phone, kitchen, 2:15 PM"
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm placeholder:text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <Button
                className="mt-3 w-full"
                onClick={() => void register()}
                disabled={busy !== null || !file || Boolean(entry)}
              >
                {busy === "register" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : entry ? (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Fingerprint className="h-4 w-4" aria-hidden="true" />
                )}
                {entry ? "Evidence logged" : busy === "register" ? "Hashing…" : "Hash & log evidence"}
              </Button>
            </div>

            {/* ── Chain of custody card ───────────────────────── */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              {!entry ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <Fingerprint className="h-10 w-10 text-caption" aria-hidden="true" />
                  <p className="mt-3 font-medium">Chain of Custody card</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Hash, timestamp, metadata, and a QR code — generated the
                    moment you log the file.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  aria-label="Chain of custody card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold">
                      Chain of Custody
                    </h2>
                    {verify && (
                      <span
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                          verify.match
                            ? "border-flag-green/40 bg-flag-green/10 text-flag-green"
                            : "border-flag-red/40 bg-flag-red/10 text-flag-red"
                        )}
                        role="status"
                      >
                        {verify.match ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
                          </>
                        ) : (
                          <>
                            <ShieldX className="h-3.5 w-3.5" aria-hidden="true"> </ShieldX> Mismatch
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1 space-y-2 text-sm">
                      <p className="truncate">
                        <span className="text-muted-foreground">File:</span>{" "}
                        <span className="font-medium">{entry.file_name}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Logged:</span>{" "}
                        {new Date(entry.logged_at).toLocaleString()}
                      </p>
                      {entry.uploader_note && (
                        <p>
                          <span className="text-muted-foreground">Note:</span>{" "}
                          {entry.uploader_note}
                        </p>
                      )}
                      <div>
                        <p className="text-muted-foreground">SHA-256</p>
                        <code className="mt-1 block break-all rounded-lg bg-secondary p-2 font-mono text-xs">
                          {entry.file_hash}
                        </code>
                        <button
                          onClick={() => void copyHash()}
                          className="mt-1 text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {copied ? "Copied!" : "Copy hash"}
                        </button>
                      </div>
                    </div>
                    {qr && (
                      <figure className="shrink-0 self-center text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qr}
                          alt="QR code linking to this evidence record"
                          width={140}
                          height={140}
                          className="rounded-lg border border-border bg-white p-1.5"
                        />
                        <figcaption className="mt-1 text-xs text-muted-foreground">
                          Scan to verify
                        </figcaption>
                      </figure>
                    )}
                  </div>

                  {/* Metadata */}
                  {Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold">Extracted metadata</h3>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                        {Object.entries(entry.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 border-b border-border/60 py-1">
                            <dt className="text-muted-foreground">{META_LABELS[k] ?? k}</dt>
                            <dd className="truncate font-medium" title={String(v)}>
                              {String(v)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Verify button */}
                  <Button
                    variant="secondary"
                    className="mt-4 w-full"
                    onClick={() => void reverify()}
                    disabled={busy !== null}
                  >
                    {busy === "verify" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    {busy === "verify" ? "Re-hashing…" : "Verify this file again"}
                  </Button>

                  {verify && (
                    <p className="mt-2 text-center text-sm" role="status">
                      {verify.match
                        ? "Hashes match — the file is unchanged since it was logged."
                        : "Hashes DO NOT match — this file changed after logging."}
                    </p>
                  )}

                  {!entry.persisted && (
                    <p className="mt-2 text-center text-xs text-caption">
                      Demo mode — Supabase not configured, so this record lives
                      only on this page. Set SUPABASE_SERVICE_ROLE_KEY to persist.
                    </p>
                  )}
                </motion.div>
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
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
