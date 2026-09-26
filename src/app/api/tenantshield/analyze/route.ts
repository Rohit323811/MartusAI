import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson, isLlmConfigured, LlmError } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "Tenant rights assistant. Extract notice_type, response_deadline, " +
  "court_date, required_actions. Generate plain-language response " +
  "letter + court prep checklist.";

const ResultSchema = z.object({
  notice_type: z.string().min(1),
  response_deadline: z.string().nullable(),
  court_date: z.string().nullable(),
  required_actions: z.array(z.string().min(1)),
  response_letter: z.string().min(1),
  court_prep_checklist: z.array(z.string().min(1)),
});

export type TenantShieldResult = z.infer<typeof ResultSchema>;

const day = 86_400_000;
const DEMO: TenantShieldResult = {
  notice_type: "7-Day Pay-or-Quit Notice (eviction)",
  response_deadline: new Date(Date.now() + 5 * day).toISOString().slice(0, 10),
  court_date: new Date(Date.now() + 21 * day).toISOString().slice(0, 10),
  required_actions: [
    "Respond to the landlord in writing before the deadline.",
    "Request an itemized ledger of the amounts claimed.",
    "Gather proof of rent payments (receipts, bank statements).",
    "Do not ignore the notice — deadlines are strict.",
  ],
  response_letter: `[Your Name]
[Your Address]
[Date]

[Landlord's Name]
[Landlord's Address]

Re: Response to 7-Day Pay-or-Quit Notice dated [Date]

Dear [Landlord's Name],

I am writing in response to the notice I received on [Date]. I dispute the
amount claimed because it includes late fees I believe exceed what my lease
and state law allow.

I request an itemized statement of the alleged balance, a copy of my rental
ledger, and an explanation of how the late fees were calculated. I intend to
pay any amount legitimately owed within the notice period once I receive
this statement.

Please confirm in writing that my right to a jury trial and my right to
reasonable notice before entry remain in effect.

I am seeking to resolve this without court involvement and look forward to
your written reply within 7 days.

Sincerely,
[Your Name]
[Phone / Email]`,
  court_prep_checklist: [
    "Bring the notice, your lease, and every payment receipt.",
    "Bring photos or evidence that supports your side.",
    "Arrange witnesses who saw relevant events.",
    "Write a short timeline of events with dates.",
    "Arrive 30 minutes early and check in with the clerk.",
    "Ask the clerk about fee waivers if cost is a concern.",
  ],
};

// Same limiter pattern as the other module routes.
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
    const body = (await request.json()) as Record<string, unknown>;
    const state = typeof body.state === "string" ? body.state.trim().slice(0, 60) : "";
    const noticeType = typeof body.noticeType === "string" ? body.noticeType.trim().slice(0, 120) : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const deadline = typeof body.deadline === "string" ? body.deadline.trim().slice(0, 40) : "";

    if (!state || !noticeType || description.length < 20) {
      return NextResponse.json(
        { error: "State, notice type, and a description (at least 20 characters) are required.", requestId },
        { status: 400 }
      );
    }

    if (!isLlmConfigured()) {
      return NextResponse.json({ result: DEMO, requestId, source: "sample" });
    }

    const raw = await callLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Help this tenant understand their notice and prepare a response.

STATE/JURISDICTION: ${state}
NOTICE TYPE: ${noticeType}
STATED DEADLINE: ${deadline || "not provided"}
DESCRIPTION: """
${description.slice(0, 6000)}
"""

Return JSON exactly matching:
{
  "notice_type": string,
  "response_deadline": "YYYY-MM-DD"|null,
  "court_date": "YYYY-MM-DD"|null,
  "required_actions": string[],
  "response_letter": string,
  "court_prep_checklist": string[]
}

Rules:
- response_deadline / court_date: derive from the notice if stated; otherwise use the typical deadline for this notice type in this state and say so in required_actions. null only if truly unknowable.
- required_actions: what the tenant must do, in order, most urgent first.
- response_letter: a plain-language letter template the tenant can edit and send, with [bracketed placeholders].
- court_prep_checklist: concrete preparation steps if this goes to court.

Return ONLY valid JSON. No markdown.`,
    });

    try {
      const result = ResultSchema.parse(raw);
      return NextResponse.json({ result, requestId, source: "groq" });
    } catch (err) {
      const first =
        err instanceof z.ZodError ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}` : "validation failed";
      console.error(`[tenantshield:${requestId}] validation failed:`, first);
      return NextResponse.json(
        { error: "Analysis failed. Please try again.", requestId },
        { status: 500 }
      );
    }
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[tenantshield:${requestId}] LlmError ${err.status}`);
      return NextResponse.json({ error: "Our AI is busy. Try again in a moment.", requestId }, { status: 502 });
    }
    console.error(`[tenantshield:${requestId}] unexpected:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again.", requestId }, { status: 500 });
  }
}
