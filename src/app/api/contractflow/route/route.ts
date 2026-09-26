import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson, isLlmConfigured, LlmError } from "@/lib/llm";
import { RoutePlanSchema, type RoutePlan } from "@/lib/contractflow";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "Contract analysis agent. Extract JSON: {parties, effective_date, " +
  "termination_date, renewal_terms, penalties, obligations}. " +
  "Flag deviations from standard.";

const DEMO: RoutePlan = {
  path: "Standard approval — Legal review, then counterparty signature",
  approvers: ["Legal counsel", "Finance (penalties present)", "Contract owner"],
  rationale:
    "High-risk late-fee deviation and medium-risk auto-renewal deviation require legal sign-off before execution.",
  risk_level: "high",
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json()) as { deviations?: unknown };
    const parsed = z
      .object({ deviations: z.array(z.object({}).passthrough()).default([]) })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide the deviations array from step 2.", requestId },
        { status: 400 }
      );
    }
    const deviations = parsed.data.deviations;

    if (!isLlmConfigured()) {
      return NextResponse.json({ route: DEMO, requestId, source: "sample" });
    }

    const raw = await callLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Suggest an approval path for this contract based on its deviations from standard clauses.

DEVIATIONS:
${JSON.stringify(deviations, null, 2)}

Return JSON: { "path": string, "approvers": string[], "rationale": string, "risk_level": "low"|"medium"|"high" }

Rules:
- path: short label of the workflow (e.g. "Standard approval — Legal review, then signature").
- approvers: ordered list of roles who must sign off, scaled to the risk (low risk may need only the contract owner; high risk adds legal and finance).
- risk_level: overall contract risk from the deviations.

Return ONLY valid JSON. No markdown.`,
    });

    let route: RoutePlan;
    try {
      route = RoutePlanSchema.parse(raw);
    } catch (err) {
      const first =
        err instanceof z.ZodError ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}` : "validation failed";
      console.error(`[contractflow-route:${requestId}] validation failed:`, first);
      return NextResponse.json({ error: "Routing failed. Please try again.", requestId }, { status: 500 });
    }

    return NextResponse.json({ route, requestId, source: "groq" });
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[contractflow-route:${requestId}] LlmError ${err.status}`);
      return NextResponse.json({ error: "Our AI is busy. Try again in a moment.", requestId }, { status: 502 });
    }
    console.error(`[contractflow-route:${requestId}] unexpected:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again.", requestId }, { status: 500 });
  }
}
