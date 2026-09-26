"use client";

import Link from "next/link";
import { useTryCounter, MAX_FREE_TRIES } from "@/lib/useTryCounter";
import { useSession } from "@/lib/useSession";

export function TryCounterBadge() {
  const { triesRemaining, mounted } = useTryCounter();
  const { isSignedIn } = useSession();

  if (!mounted || isSignedIn) return null;

  if (triesRemaining <= 0) {
    return (
      <Link
        href="/"
        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Sign in to continue
      </Link>
    );
  }

  return (
    <span
      className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
      aria-label={`${triesRemaining} of ${MAX_FREE_TRIES} free analyses remaining`}
    >
      {triesRemaining === 1
        ? "1 free analysis left"
        : `${triesRemaining} free analyses left`}
    </span>
  );
}
