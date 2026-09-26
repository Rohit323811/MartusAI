"use client";

import { useState } from "react";
import { Mail, Loader2, MailCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

interface MagicLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subhead?: string;
}

export function MagicLinkModal({
  open,
  onOpenChange,
  title = "Save your work",
  subhead = "Sign in with your email — no password needed. We'll send you a magic link.",
}: MagicLinkModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setStatus("error");
      setErrorMsg(
        "Sign-in isn't configured in this demo build yet. Add your Supabase keys to .env.local to enable it."
      );
      return;
    }
    setStatus("sending");
    setErrorMsg(null);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(
        error.message === "Signups not allowed for this instance"
          ? "This Supabase project has sign-ups disabled. Enable email sign-in in the dashboard."
          : error.message
      );
      return;
    }
    setStatus("sent");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-display text-fluid-h3">
            {title}
          </DialogTitle>
          <DialogDescription>{subhead}</DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <div className="flex items-start gap-3 rounded-xl bg-secondary p-4" role="status">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-flag-green" aria-hidden="true" />
            <p className="text-sm">
              Check your email — we sent a magic link to{" "}
              <span className="font-medium">{email}</span>. It expires in one
              hour.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label htmlFor="magic-email" className="block text-sm font-medium">
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="magic-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  "h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-base",
                  "placeholder:text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>
            {errorMsg && (
              <p className="text-sm text-flag-red" role="alert">
                {errorMsg}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "Send magic link"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Free forever for basic use. Your email is never shared.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
