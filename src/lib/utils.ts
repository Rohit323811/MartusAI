import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Confidence, Urgency, Severity } from "./analysis";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatConfidence(c: Confidence) {
  switch (c) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence — verify this";
  }
}

export function formatUrgency(u: Urgency) {
  switch (u) {
    case "overdue":
      return "Overdue";
    case "soon":
      return "Due within 7 days";
    case "safe":
      return "You have time";
  }
}

export function formatSev(s: Severity) {
  switch (s) {
    case "red":
      return "High risk";
    case "yellow":
      return "Review";
    case "green":
      return "OK";
  }
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
