import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson, isLlmConfigured, LlmError } from "@/lib/llm";
import {
  extractDocumentText,
  ExtractedContractSchema,
  DEMO_EXTRACT,
} from "@/lib/contractflow";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "Contract analysis agent. Extract JSON: {parties, effective_date, " +
  "termination_date, renewal_terms, penalties, obligations}. " +
  "Flag deviations from standard.";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = (await request.json()) as {
      fileBase64?: unknown;
      mimeType?: unknown;
      text?: unknown;
    };

    let contractText = "";
    let meta: Record<string, unknown> = {};

    if (typeof body.fileBase64 === "string" && body.fileBase64) {
      const mimeType =
        typeof body.mimeType === "string"
          ? body.mimeType
          : "application/octet-stream";
      if (body.fileBase64.length > 12_000_000) {
        return NextResponse.json(
          { error: "File too large. Please upload a file under 9 MB.", requestId },
          { status: 413 }
        );
      }
      const doc = await extractDocumentText(body.fileBase64, mimeType);
      contractText = doc.text;
      meta = doc.meta;
    } else if (typeof body.text === "string" && body.text.trim().length >= 50) {
      contractText = body.text.trim().slice(0, 20_000);
    } else {
      return NextResponse.json(
        { error: "Provide a PDF/DOCX file (fileBase64 + mimeType) or contract text.", requestId },
        { status: 400 }
      );
    }

    if (!isLlmConfigured()) {
      return NextResponse.json({
        contract: DEMO_EXTRACT,
        meta,
        requestId,
        source: "sample",
      });
    }

    const raw = await callLlmJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Extract structured data from this contract.

Return JSON exactly matching:
{
  "parties": string[],
  "effective_date": "YYYY-MM-DD"|null,
  "termination_date": "YYYY-MM-DD"|null,
  "renewal_terms": string|null,
  "penalties": string[],
  "obligations": [{ "party": string, "obligation": string }]
}

Rules:
- Include every party and their role.
- Use ISO dates. null when absent or undeterminable.
- obligations: each binding duty with the party that owes it.

CONTRACT TEXT:
"""
${contractText}
"""

Return ONLY valid JSON. No markdown.`,
    });

    try {
      const contract = ExtractedContractSchema.parse(raw);
      return NextResponse.json({ contract, meta, requestId, source: "groq" });
    } catch (err) {
      const first =
        err instanceof z.ZodError
          ? `${err.issues[0].path.join(".")}: ${err.issues[0].message}`
          : "validation failed";
      console.error(`[contractflow-extract:${requestId}] validation failed:`, first);
      return NextResponse.json(
        { error: "Extraction failed. Please try again.", requestId },
        { status: 500 }
      );
    }
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[contractflow-extract:${requestId}] LlmError ${err.status}`);
      return NextResponse.json({ error: "Our AI is busy. Try again in a moment.", requestId }, { status: 502 });
    }
    console.error(`[contractflow-extract:${requestId}] unexpected:`, err);
    const message = err instanceof Error && /extract any text|Empty file/.test(err.message)
      ? "Could not read that file. Try a text-based PDF, DOCX, or paste the text."
      : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
