"use client";

import Link from "next/link";
import { useTryCounter, MAX_FREE_TRIES } from "@/lib/useTryCounter";
import { useSession } from "@/lib/useSession";

export function TryCounterBadge() {
  const { triesRemaining, mounted, reset } = useTryCounter();
  const { isSignedIn } = useSession();

  if (!mounted || isSignedIn) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
        aria-label={`${triesRemaining} free analyses remaining`}
      >
        {triesRemaining <= 0
          ? "0 free analyses left"
          : triesRemaining === 1
          ? "1 free analysis left"
          : `${triesRemaining} free analyses left`}
      </span>
      <button
        onClick={() => reset()}
        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Get 10 more for free
      </button>
    </div>
  );
}
