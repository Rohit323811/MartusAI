import { z } from "zod";
import type { Analysis, ExplainMode, SummarySpan } from "./analysis";

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export const severitySchema = z.enum(["red", "yellow", "green"]);
export const urgencySchema = z.enum(["overdue", "soon", "safe"]);

/** bbox [x, y, w, h] normalized 0–1. */
export const bboxSchema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .refine((v) => v.every((n) => n >= 0 && n <= 1), {
    message: "bbox values must be normalized 0–1",
  });

export const summarySpanSchema = z.object({
  text: z.string().min(1),
  confidence: confidenceSchema,
  citation_id: z.string().nullable(),
});

export const redFlagSchema = z.object({
  clause_text: z.string().min(1),
  severity: severitySchema,
  bbox: bboxSchema,
  explanation: z.string().min(1),
  citation_id: z.string().nullable().optional(),
});

export const deadlineSchema = z.object({
  label: z.string().min(1),
  date: z.string().min(4),
  urgency: urgencySchema,
});

export const citationSchema = z.object({
  id: z.string().min(1),
  statute: z.string().min(1),
  quote: z.string().min(1),
  url: z.string().url(),
});

export const AnalysisSchema = z.object({
  issue_type: z.string().min(1),
  jurisdiction: z.string().min(1),
  summary: z.array(summarySpanSchema).min(1),
  red_flags: z.array(redFlagSchema),
  deadlines: z.array(deadlineSchema),
  draft_response: z.string().min(1),
  citations: z.array(citationSchema),
});

export type ParsedAnalysis = z.infer<typeof AnalysisSchema>;

export const ExplainResponseSchema = z.object({
  summary: z.array(summarySpanSchema).min(1),
});

/**
 * Parse + validate a raw Grok analysis response.
 * Throws a descriptive ZodError on failure.
 */
export function parseAnalysis(raw: unknown): ParsedAnalysis {
  return AnalysisSchema.parse(raw);
}

export function parseExplain(raw: unknown): { summary: SummarySpan[] } {
  return ExplainResponseSchema.parse(raw);
}

export function explainErrorMessage(err: unknown): string {
  if (err instanceof z.ZodError) {
    const first = err.issues[0];
    return `${first.path.join(".") || "response"}: ${first.message}`;
  }
  return err instanceof Error ? err.message : "Unknown validation error";
}

export type { Analysis, ExplainMode };
