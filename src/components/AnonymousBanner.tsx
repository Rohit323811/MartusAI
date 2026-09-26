"use client";

import { useEffect, useState } from "react";
import { Lock, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagicLinkModal } from "@/components/MagicLinkModal";
import { useSession } from "@/lib/useSession";

const DISMISS_KEY = "martusai_banner_dismissed";

export function AnonymousBanner() {
  const { email, isSignedIn, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="bg-secondary text-foreground border-b border-border">
      <div className="container flex min-h-[36px] flex-wrap items-center justify-center gap-2 py-2 px-5 text-xs">
        {isSignedIn ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-flag-green" aria-hidden="true" />
            <p>
              Signed in as <span className="font-medium">{email}</span>. Your
              analyses are saved.
            </p>
            <Button
              variant="link"
              className="h-auto min-h-[36px] p-0 text-xs"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p>Anonymous mode: nothing is saved.</p>
            <Button
              variant="link"
              className="h-auto min-h-[36px] p-0 text-xs"
              onClick={() => setOpen(true)}
            >
              Sign in to save
            </Button>
          </>
        )}
        <button
          aria-label="Dismiss banner for this session"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              // ignore
            }
          }}
          className="ml-1 rounded-full p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <MagicLinkModal
        open={open}
        onOpenChange={setOpen}
        title="Save your analyses"
        subhead="Anonymous by default. Sign in only if you want saved analyses and reminders."
      />
    </div>
  );
}
