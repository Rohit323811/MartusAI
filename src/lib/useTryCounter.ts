"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "./useSession";

const KEY = "martusai_tries_used";
export const MAX_FREE_TRIES = 3;

export function getTriesUsed(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setTriesUsed(n: number) {
  try {
    localStorage.setItem(KEY, String(Math.max(0, n)));
    window.dispatchEvent(new Event("martusai:tries-changed"));
  } catch {
    // storage unavailable — anonymous mode stays graceful
  }
}

export function clearTries() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("martusai:tries-changed"));
  } catch {
    // ignore
  }
}

export function useTryCounter() {
  const { isSignedIn, isLoading } = useSession();
  const [triesUsed, setUsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => setUsed(getTriesUsed()), []);

  useEffect(() => {
    refresh();
    setMounted(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("martusai:tries-changed", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("martusai:tries-changed", refresh);
    };
  }, [refresh]);

  const triesRemaining = Math.max(0, MAX_FREE_TRIES - triesUsed);
  const isLimited = !isSignedIn;

  const increment = useCallback(() => {
    if (isSignedIn) return; // signed-in = unlimited
    setTriesUsed(getTriesUsed() + 1);
  }, [isSignedIn]);

  return {
    triesUsed,
    triesRemaining,
    isLimited,
    increment,
    reset: clearTries,
    canAnalyze: isSignedIn || triesRemaining > 0,
    mounted,
  };
}
