import type { ExplainMode } from "./analysis";

export const SYSTEM_PROMPT_BASE = `You are a legal information assistant. You DO NOT give legal advice.
You extract, explain, and cite. Every factual claim must reference a
citation_id or be marked confidence="low". If you are unsure about
jurisdiction, set jurisdiction="unknown" and confidence="low".
Never invent statutes. If no citation exists, say so explicitly.
Always return valid JSON matching the provided schema. No prose
outside the JSON.`;

export const READING_LEVEL: Record<ExplainMode, string> = {
  legal:
    "Use precise legal terminology. Assume the reader is a paralegal.",
  plain:
    "Use plain English. Explain any legal term in parentheses the first time.",
  simple:
    "Explain like the reader is 15. Short sentences. No jargon. Warm tone.",
};

export const RESPONSE_SCHEMA_HINT = `{
  "issue_type": string,
  "jurisdiction": string,
  "summary": [{ "text": string, "confidence": "high"|"medium"|"low", "citation_id": string|null }],
  "red_flags": [{ "clause_text": string, "severity": "red"|"yellow"|"green", "bbox": [x, y, width, height], "explanation": string, "citation_id": string|null }],
  "deadlines": [{ "label": string, "date": "YYYY-MM-DDTHH:mm:ssZ", "urgency": "overdue"|"soon"|"safe" }],
  "draft_response": string,
  "citations": [{ "id": string, "statute": string, "quote": string, "url": string }]
}`;

export function buildUserPromptImage(jurisdictionHint?: string): string {
  return `Read the legal document in the provided image.

1. Identify the legal issue type and jurisdiction${jurisdictionHint ? ` (user hint: ${jurisdictionHint})` : ""}.
2. Write a plain-language summary as an array of short sentences. Each sentence gets a confidence ("high"|"medium"|"low") and, when grounded, a citation_id referencing the citations array.
3. Identify problematic clauses. For EACH clause return bbox as [x, y, width, height] normalized to 0-1 relative to the full image (origin top-left). Empty red_flags array only if the document is genuinely clean.
4. Extract every date, deadline, or time-bound obligation as ISO 8601 dates with urgency: overdue (in the past), soon (within 7 days of today), or safe.
5. Draft a short response letter the user can send, citing specific statutes from citations.
6. Include only real, verifiable statutes with working source URLs in citations (id like "c1", "c2"). If you cannot verify a statute, do not cite it — mark affected claims confidence="low" with citation_id=null.

Return JSON matching this schema exactly:
${RESPONSE_SCHEMA_HINT}

Return ONLY valid JSON. No markdown.`;
}

export function buildUserPromptText(jurisdictionHint?: string): string {
  return `Analyze the user's described legal situation:

"<situation>"

1. Identify the most likely legal issue type and jurisdiction${jurisdictionHint ? ` (user hint: ${jurisdictionHint})` : ""}. If unknown, set jurisdiction="unknown".
2. Write a plain-language summary as an array of short sentences with confidence ratings and citation_ids where grounded.
3. red_flags must be [] (no image to annotate).
4. Extract every date, deadline, or time-bound obligation the user mentions (or standard ones for this issue type, clearly labeled as typical) as ISO 8601 dates with urgency: overdue, soon (within 7 days), or safe.
5. Draft a short response letter the user can send, citing specific statutes from citations.
6. Include only real, verifiable statutes with working source URLs in citations (id like "c1", "c2"). If you cannot verify a statute, do not cite it — mark affected claims confidence="low" with citation_id=null.

Return JSON matching this schema exactly:
${RESPONSE_SCHEMA_HINT}

Return ONLY valid JSON. No markdown.`;
}

export function buildExplainPrompt(
  summaryTexts: string[],
  mode: ExplainMode
): string {
  return `Rewrite each summary sentence below at a different reading level.

READING LEVEL: ${READING_LEVEL[mode]}

Rules:
- Keep the same number of sentences, same order.
- Preserve each sentence's citation_id exactly as given.
- Set confidence="high" only for sentences grounded in a citation; otherwise keep or lower it.
- citation_id values must reference statutes you are certain exist. When rewriting, never invent new citations.

Sentences (JSON array):
${JSON.stringify(summaryTexts)}

Return JSON: { "summary": [{ "text": string, "confidence": "high"|"medium"|"low", "citation_id": string|null }] }

Return ONLY valid JSON. No markdown.`;
}
