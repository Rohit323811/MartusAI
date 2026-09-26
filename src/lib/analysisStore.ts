"use client";

import type { StoredAnalysis } from "./analysis";

const LAST_KEY = "martusai_last_analysis";
const INDEX_KEY = "martusai_analysis_index";
const MAX_KEPT = 10;

function safeGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string, persistent: boolean) {
  try {
    (persistent ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // storage full/unavailable — anonymous mode stays functional
  }
}

/** Called by /processing right after a successful analyze call. */
export function stashAnalysis(analysis: StoredAnalysis) {
  // sessionStorage for this navigation…
  safeSet(LAST_KEY, JSON.stringify(analysis), false);
  // …and localStorage so refresh/direct-load keeps working anonymously.
  safeSet(LAST_KEY, JSON.stringify(analysis), true);
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    const index: Record<string, string> = raw ? JSON.parse(raw) : {};
    index[analysis.id] = analysis.createdAt;
    const trimmed = Object.entries(index)
      .sort((a, b) => (a[1] < b[1] ? 1 : -1))
      .slice(0, MAX_KEPT);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // ignore
  }
}

export function loadAnalysisById(id: string): StoredAnalysis | null {
  const raw = safeGet(LAST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAnalysis;
    return parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}

export function loadLastAnalysis(): StoredAnalysis | null {
  const raw = safeGet(LAST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAnalysis;
  } catch {
    return null;
  }
}

/** Pending input stashed before navigating to /processing. */
export function stashPendingInput(input: unknown) {
  try {
    window.sessionStorage.setItem("martusai_pending_input", JSON.stringify(input));
  } catch {
    // ignore
  }
}

export function takePendingInput<T>(): T | null {
  try {
    const raw = window.sessionStorage.getItem("martusai_pending_input");
    if (!raw) return null;
    window.sessionStorage.removeItem("martusai_pending_input");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
