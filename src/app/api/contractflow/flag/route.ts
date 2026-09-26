import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson, isLlmConfigured, LlmError } from "@/lib/llm";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { DeviationSchema, DEMO_DEVIATIONS, type Deviation } from "@/lib/contractflow";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "Contract analysis agent. Extract JSON: {parties, effective_date, " +
  "termination_date, renewal_terms, penalties, obligations}. " +
  "Flag deviations from standard.";

interface TemplateRow {
  clause_name: string;
  standard_text: string;
  risk_level: string;
  notes: string | null;
}

async function loadTemplates(): Promise<TemplateRow[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("contract_templates")
    .select("clause_name, standard_text, risk_level, notes");
  if (error) {
    console.error("[contractflow-flag] template load failed:", error.message);
    return [];
  }
  return (data ?? []) as TemplateRow[];
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json()) as { contract?: unknown };
    const parsedBody = z
      .object({
        contract: z.object({
          parties: z.array(z.string()).optional(),
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

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Provide the extracted contract object from step 1.", requestId },
        { status: 400 }
      );
    }

    const templates = await loadTemplates();

    if (!isLlmConfigured()) {
      return NextResponse.json({
        deviations: DEMO_DEVIATIONS,
        templates_considered: templates.length,
        requestId,
        source: "sample",
      });
    }

    if (templates.length === 0) {
      return NextResponse.json({
        deviations: [],
        templates_considered: 0,
        note: "No standard clause templates configured yet — add rows to contract_templates.",
        requestId,
        source: "groq",
      });
    }

    const raw = await callLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Compare this extracted contract against the company's standard clause templates.

STANDARD TEMPLATES:
${JSON.stringify(templates, null, 2)}

EXTRACTED CONTRACT:
${JSON.stringify(parsedBody.data.contract, null, 2)}

Return JSON: { "deviations": [{ "clause_name": string, "risk_level": "low"|"medium"|"high", "finding": string, "standard": string }] }

Rules:
- Only flag material deviations from the standard text (weaker notice periods, higher penalties, broader waivers, one-sided rights).
- Match clause_name to the closest template clause.
- finding: what differs and why it matters, one or two sentences.

Return ONLY valid JSON. No markdown.`,
    });

    let deviations: Deviation[];
    try {
      deviations = z.array(DeviationSchema).parse(
        (raw as { deviations?: unknown }).deviations ?? []
      );
    } catch (err) {
      const first =
        err instanceof z.ZodError ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}` : "validation failed";
      console.error(`[contractflow-flag:${requestId}] validation failed:`, first);
      return NextResponse.json({ error: "Flagging failed. Please try again.", requestId }, { status: 500 });
    }

    return NextResponse.json({
      deviations,
      templates_considered: templates.length,
      requestId,
      source: "groq",
    });
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[contractflow-flag:${requestId}] LlmError ${err.status}`);
      return NextResponse.json({ error: "Our AI is busy. Try again in a moment.", requestId }, { status: 502 });
    }
    console.error(`[contractflow-flag:${requestId}] unexpected:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again.", requestId }, { status: 500 });
  }
}
