"use client";

import { useCallback, useEffect, useState } from "react";
import seeds from "../../data/outcomes.json";
import type { Outcome } from "./analysis";

const KEY = "martusai_outcomes";

function readMine(): Outcome[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Outcome[]) : [];
  } catch {
    return [];
  }
}

export function useOutcomes(issueType: string) {
  const [mine, setMine] = useState<Outcome[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMine(readMine());
    setMounted(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setMine(readMine());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const seedOutcomes = seeds.filter(
    (o) =>
      !issueType ||
      o.issue_type === issueType ||
      issueType.toLowerCase().includes(o.issue_type.replace("_", " "))
  );
  const visible = (seedOutcomes.length >= 3 ? seedOutcomes : seeds).slice(0, 5);

  const addOutcome = useCallback(
    (text: string, context: string) => {
      const entry: Outcome = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `o_${Date.now()}`,
        issue_type: issueType || "other",
        jurisdiction: "—",
        context,
        outcome: text,
        timeAgo: "just now",
        mine: true,
      };
      const next = [entry, ...readMine()].slice(0, 20);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      setMine(next); // optimistic re-render
    },
    [issueType]
  );

  return { outcomes: [...mine, ...visible].slice(0, 6), addOutcome };
}
