// SERVER ONLY — shared logic for the ContractFlow API routes.
import { z } from "zod";
import { PDFParse } from "pdf-parse";

declare module "pdf-parse" {
  // Narrow the pdf-parse v2 surface to what we use (its real types are
  // pdfjs-based; these cover getText/getInfo/destroy).
  interface PDFParse {
    getText(): Promise<{ text: string; total: number }>;
    getInfo(): Promise<{ total: number; info?: Record<string, unknown> }>;
    destroy(): Promise<void>;
  }
}

// ── Schemas ────────────────────────────────────────────────────

export const ExtractedContractSchema = z.object({
  parties: z.array(z.string().min(1)).default([]),
  effective_date: z.string().nullable().default(null),
  termination_date: z.string().nullable().default(null),
  renewal_terms: z.string().nullable().default(null),
  penalties: z.array(z.string().min(1)).default([]),
  obligations: z
    .array(z.object({ party: z.string(), obligation: z.string() }))
    .default([]),
});
export type ExtractedContract = z.infer<typeof ExtractedContractSchema>;

export const DeviationSchema = z.object({
  clause_name: z.string(),
  risk_level: z.enum(["low", "medium", "high"]),
  finding: z.string(),
  standard: z.string().nullable().optional(),
});
export type Deviation = z.infer<typeof DeviationSchema>;

export const RoutePlanSchema = z.object({
  path: z.string(),
  approvers: z.array(z.string()).min(1),
  rationale: z.string(),
  risk_level: z.enum(["low", "medium", "high"]),
});

export type RoutePlan = z.infer<typeof RoutePlanSchema>;

// ── Document text extraction (PDF / DOCX / txt) ───────────────

export interface ExtractedDoc {
  text: string;
  meta: Record<string, unknown>;
  kind: "pdf" | "docx" | "text";
}

export async function extractDocumentText(
  fileBase64: string,
  mimeType: string
): Promise<ExtractedDoc> {
  const buf = Buffer.from(fileBase64, "base64");
  if (buf.length === 0) throw new Error("Empty file");

  if (mimeType === "application/pdf" || buf.subarray(0, 4).toString() === "%PDF") {
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try {
      const result = await parser.getText();
      const info = await parser.getInfo().catch(() => null);
      return {
        text: result.text,
        meta: {
          numpages: result.total,
          info: info?.info ?? {},
        },
        kind: "pdf",
      };
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    (buf.length > 1 && buf[0] === 0x50 && buf[1] === 0x4b); // ZIP magic "PK"

  if (isDocx) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return { text: value, meta: {}, kind: "docx" };
  }

  // Fallback: treat as UTF-8 text.
  const text = buf.toString("utf8").replace(/\u0000/g, "");
  if (!text.trim()) throw new Error("Could not extract any text from the file");
  return { text: text.slice(0, 200_000), meta: {}, kind: "text" };
}

// ── ICS generation (RFC 5545, minimal) ────────────────────────

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  /** ISO date-time; all-day events pass a YYYY-MM-DD date string. */
  start: string;
  allDay?: boolean;
}

export function buildIcs(events: IcsEvent[], calendarName = "ContractFlow Deadlines"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MartusAI//ContractFlow//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
  ];
  for (const ev of events) {
    const dt = new Date(ev.start);
    if (Number.isNaN(dt.getTime())) continue;
    const allDay = ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${icsStamp(new Date())}`,
      allDay
        ? `DTSTART;VALUE=DATE:${dt.toISOString().slice(0, 10).replace(/-/g, "")}`
        : `DTSTART:${icsStamp(dt)}`,
      allDay
        ? `DTEND;VALUE=DATE:${new Date(dt.getTime() + 86_400_000).toISOString().slice(0, 10).replace(/-/g, "")}`
        : `DTEND:${icsStamp(new Date(dt.getTime() + 3_600_000))}`,
      `SUMMARY:${icsEscape(ev.title)}`,
      ...(ev.description ? [`DESCRIPTION:${icsEscape(ev.description)}`] : []),
      "BEGIN:VALARM",
      "TRIGGER:-P7D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(`Reminder: ${ev.title}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ── Demo fallbacks (no GROQ_API_KEY configured) ───────────────

export const DEMO_EXTRACT: ExtractedContract = {
  parties: ["Northwind Property Group LLC (Landlord)", "Tenant (You)"],
  effective_date: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
  termination_date: new Date(Date.now() + 335 * 86_400_000).toISOString().slice(0, 10),
  renewal_terms:
    "Auto-renews for 12 months unless either party gives 60 days' written notice.",
  penalties: [
    "Late fee of $75 per day after the 3rd of the month.",
    "Early termination fee equal to 2 months' rent.",
  ],
  obligations: [
    { party: "Tenant", obligation: "Pay rent of $1,400 by the 1st of each month." },
    { party: "Tenant", obligation: "Keep the premises clean and report damage promptly." },
    { party: "Landlord", obligation: "Maintain habitability and make timely repairs (30 days)." },
  ],
};

export const DEMO_DEVIATIONS: Deviation[] = [
  {
    clause_name: "Late fee",
    risk_level: "high",
    finding:
      "Contract allows $75/day late fee; standard templates cap late fees as a flat reasonable amount.",
    standard: "Flat late fee, capped and reasonable; per-day penalties discouraged.",
  },
  {
    clause_name: "Auto-renewal",
    risk_level: "medium",
    finding:
      "Auto-renewal requires only 60 days' notice; standard requires 90 days and a written reminder to the tenant.",
    standard: "90-day notice plus affirmative renewal reminder.",
  },
];
