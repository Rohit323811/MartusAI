import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson, isLlmConfigured, LlmError } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "Legal plain-language translator. Rewrite at 6th-grade level. " +
  "Preserve legal meaning. Extract up to 5 key points. " +
  "Flag user-disadvantageous clauses.";

const ResponseSchema = z.object({
  plain_english: z.string().min(1),
  key_points: z.array(z.string().min(1)).max(5),
  red_flags: z.array(
    z.object({
      clause: z.string().min(1),
      why_it_hurts_you: z.string().min(1),
      severity: z.enum(["high", "medium", "low"]),
    })
  ),
});

export type PlainSiteResult = z.infer<typeof ResponseSchema>;

const DEMO: PlainSiteResult = {
  plain_english:
    "This paper says you must pay $1,400 by the 3rd of next month. If you pay late, they add $75 for every day you are late — that can grow very fast. You give up your right to a jury trial if there is ever a fight about this. They can also come into your home without telling you first. If you do not pay, they can start the process to make you leave.",
  key_points: [
    "You owe $1,400 due on the 3rd of next month.",
    "Late fee is $75 per day — that adds up fast.",
    "You give up your right to a jury trial.",
    "They may enter your home without advance notice.",
    "Missing payment can start an eviction.",
  ],
  red_flags: [
    {
      clause: "…landlord may enter the premises at any time without notice…",
      why_it_hurts_you:
        "Most states require 24–48 hours' written notice before entry, except in emergencies. This removes that protection.",
      severity: "high",
    },
    {
      clause: "…late fee of $75 per day applies after the 3rd of the month…",
      why_it_hurts_you:
        "Per-day fees are capped or banned in many states. $75/day may be an unlawful penalty.",
      severity: "medium",
    },
  ],
};

// Same in-memory limiter pattern as /api/analyze.
const RATE_LIMIT = 10;
const rateMap = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now > e.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  e.count += 1;
  return e.count > RATE_LIMIT;
}
function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again.", requestId },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < 50) {
      return NextResponse.json(
        { error: "Please paste at least 50 characters of legal text.", requestId },
        { status: 400 }
      );
    }
    if (text.length > 20_000) {
      return NextResponse.json(
        { error: "That text is too long. Please paste up to 20,000 characters.", requestId },
        { status: 413 }
      );
    }

    if (!isLlmConfigured()) {
      return NextResponse.json({ result: DEMO, requestId, source: "sample" });
    }

    const raw = await callLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Translate the following legal text for a layperson.

Return JSON exactly matching:
{ "plain_english": string, "key_points": string[] (max 5), "red_flags": [{ "clause": string, "why_it_hurts_you": string, "severity": "high"|"medium"|"low" }] }

Rules:
- plain_english: rewrite the WHOLE document at 6th-grade reading level. Keep every deadline, dollar amount, and obligation. Never add meaning.
- key_points: the most important facts a reader must not miss, as short standalone bullets.
- red_flags: clauses that disadvantage the reader (waivers, penalties, one-sided rights, auto-renewals). Empty array only if genuinely none.

TEXT:
"""
${text}
"""

Return ONLY valid JSON. No markdown.`,
    });

    try {
      const result = ResponseSchema.parse(raw);
      return NextResponse.json({ result, requestId, source: "groq" });
    } catch (err) {
      const first =
        err instanceof z.ZodError ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}` : "validation failed";
      console.error(`[plainsite:${requestId}] validation failed:`, first);
      return NextResponse.json(
        { error: "Translation failed. Please try again.", requestId },
        { status: 500 }
      );
    }
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[plainsite:${requestId}] LlmError ${err.status}:`, err.body || err.message);
      return NextResponse.json(
        { error: "Our AI is busy. Try again in a moment.", requestId },
        { status: 502 }
      );
    }
    console.error(`[plainsite:${requestId}] unexpected:`, err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", requestId },
      { status: 500 }
    );
  }
}
