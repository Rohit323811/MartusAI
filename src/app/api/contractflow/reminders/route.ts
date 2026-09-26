import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson, isLlmConfigured, LlmError } from "@/lib/llm";
import { buildIcs, type IcsEvent } from "@/lib/contractflow";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "Contract analysis agent. Extract JSON: {parties, effective_date, " +
  "termination_date, renewal_terms, penalties, obligations}. " +
  "Flag deviations from standard.";

const DeadlineSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(4),
  all_day: z.boolean().default(true),
  description: z.string().optional(),
});

const DEMO_DEADLINES = [
  {
    title: "Rent due",
    date: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10),
    all_day: true,
    description: "Monthly rent payment deadline.",
  },
  {
    title: "Lease auto-renewal notice deadline",
    date: new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10),
    all_day: true,
    description: "60 days' written notice required to prevent auto-renewal.",
  },
  {
    title: "Lease termination",
    date: new Date(Date.now() + 335 * 86_400_000).toISOString().slice(0, 10),
    all_day: true,
    description: "Contract ends on this date.",
  },
];

function toIcsEvents(deadlines: z.infer<typeof DeadlineSchema>[]): IcsEvent[] {
  return deadlines.map((d, i) => ({
    uid: `contractflow-${Date.now()}-${i}@martusai`,
    title: d.title,
    description: d.description,
    start: d.date,
    allDay: d.all_day,
  }));
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json()) as { contract?: unknown };
    const parsed = z
      .object({
        contract: z.object({
          effective_date: z.string().nullable().optional(),
          termination_date: z.string().nullable().optional(),
          renewal_terms: z.string().nullable().optional(),
          penalties: z.array(z.string()).optional(),
          obligations: z
            .array(z.object({ party: z.string(), obligation: z.string() }))
            .optional(),
        }),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide the extracted contract object from step 1.", requestId },
        { status: 400 }
      );
    }

    let deadlines: z.infer<typeof DeadlineSchema>[];

    if (!isLlmConfigured()) {
      deadlines = DEMO_DEADLINES;
    } else {
      const raw = await callLlmJson({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `From this contract, list every date or deadline worth a calendar reminder.

CONTRACT:
${JSON.stringify(parsed.data.contract, null, 2)}

Return JSON: { "deadlines": [{ "title": string, "date": "YYYY-MM-DD" or ISO datetime, "all_day": boolean, "description": string }] }

Rules:
- Include payment dates, notice deadlines (especially auto-renewal opt-outs), termination, review checkpoints.
- Derive notice deadlines from stated notice periods (e.g. "60 days before termination").
- Date-only deadlines use all_day=true.

Return ONLY valid JSON. No markdown.`,
      });

      try {
        deadlines = z.array(DeadlineSchema).parse(
          (raw as { deadlines?: unknown }).deadlines ?? []
        );
      } catch (err) {
        const first =
          err instanceof z.ZodError ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}` : "validation failed";
        console.error(`[contractflow-reminders:${requestId}] validation failed:`, first);
        return NextResponse.json({ error: "Reminder extraction failed. Please try again.", requestId }, { status: 500 });
      }
    }

    const ics = buildIcs(toIcsEvents(deadlines));

    // mode=ics → download the calendar file directly.
    const url = new URL(request.url);
    if (url.searchParams.get("mode") === "ics") {
      return new NextResponse(ics, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="contractflow-deadlines.ics"',
        },
      });
    }

    return NextResponse.json({
      deadlines,
      ics,
      requestId,
      source: isLlmConfigured() ? "groq" : "sample",
    });
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[contractflow-reminders:${requestId}] LlmError ${err.status}`);
      return NextResponse.json({ error: "Our AI is busy. Try again in a moment.", requestId }, { status: 502 });
    }
    console.error(`[contractflow-reminders:${requestId}] unexpected:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again.", requestId }, { status: 500 });
  }
}
