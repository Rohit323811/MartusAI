export type Confidence = "high" | "medium" | "low";
export type Severity = "red" | "yellow" | "green";
export type Urgency = "overdue" | "soon" | "safe";
export type ExplainMode = "legal" | "plain" | "simple";

export const EXPLAIN_MODES: ExplainMode[] = ["legal", "plain", "simple"];

/** One cited/explainable sentence in the summary. */
export interface SummarySpan {
  text: string;
  confidence: Confidence;
  citation_id: string | null;
}

/** bbox is [x, y, width, height] normalized 0–1 relative to the image. */
export interface RedFlag {
  clause_text: string;
  severity: Severity;
  bbox: [number, number, number, number];
  explanation: string;
  citation_id?: string | null;
}

export interface Deadline {
  label: string;
  date: string; // ISO8601
  urgency: Urgency; // recomputed client-side as defense in depth
}

export interface Citation {
  id: string;
  statute: string;
  quote: string;
  url: string;
}

/** Raw analysis payload (what Grok returns / what we store). */
export interface Analysis {
  issue_type: string;
  jurisdiction: string;
  summary: SummarySpan[];
  red_flags: RedFlag[];
  deadlines: Deadline[];
  draft_response: string;
  citations: Citation[];
}

/** Analysis + client-side metadata persisted locally. */
export interface StoredAnalysis extends Analysis {
  id: string;
  createdAt: string;
  mode: "upload" | "type";
  source: "grok" | "sample";
  readingLevel: ExplainMode;
}

/** Input stashed in sessionStorage before navigating to /processing. */
export interface PendingInput {
  mode: "upload" | "type";
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface Outcome {
  id: string;
  issue_type: string;
  jurisdiction: string;
  context: string;
  outcome: string;
  timeAgo: string;
  mine?: boolean;
}
