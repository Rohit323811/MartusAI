"use client";

import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MagicLinkModal } from "@/components/MagicLinkModal";
import { useState } from "react";

interface SignUpGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Soft gate after the 3 free anonymous analyses. Never blocks results. */
export function SignUpGateModal({ open, onOpenChange }: SignUpGateModalProps) {
  const [showMagicLink, setShowMagicLink] = useState(false);

  return (
    <>
      <Dialog open={open && !showMagicLink} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <DialogHeader>
            <DialogTitle className="font-display text-fluid-h3">
              You&apos;ve used your 3 free analyses
            </DialogTitle>
            <DialogDescription>
              Sign in with your email — no password needed. We&apos;ll send you
              a magic link.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={() => setShowMagicLink(true)}>
            Sign in — it&apos;s free
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="mt-1 text-center text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Or continue browsing — your saved analyses stay on this device.
          </button>
        </DialogContent>
      </Dialog>
      <MagicLinkModal
        open={open && showMagicLink}
        onOpenChange={(o) => {
          if (!o) setShowMagicLink(false);
          onOpenChange(o);
        }}
        title="Keep going — free"
        subhead="We'll email you a magic link. No password, no spam."
      />
    </>
  );
}
