import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  callGrokVision,
  callGrokText,
  isGrokConfigured,
  GrokError,
} from "@/lib/grok";
import { parseAnalysis, explainErrorMessage } from "@/lib/schemas";
import {
  SYSTEM_PROMPT_BASE,
  buildUserPromptImage,
  buildUserPromptText,
} from "@/lib/prompts";
import { createSampleAnalysis } from "@/lib/sampleAnalysis";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── In-memory rate limit (MVP; Redis comes later) ─────────────
const RATE_LIMIT = 5; // requests per minute per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const ip = clientIp(request);

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again.", requestId },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const type = body?.type as "image" | "text" | undefined;
    const jurisdictionHint =
      typeof body?.jurisdictionHint === "string"
        ? body.jurisdictionHint.slice(0, 100)
        : undefined;

    // ── Demo mode: Grok key not configured ────────────────────
    if (!isGrokConfigured()) {
      const sample = createSampleAnalysis(type === "image" ? "upload" : "type");
      return NextResponse.json({
        analysis: sample,
        id: randomUUID(),
        requestId,
        source: "sample",
      });
    }

    let raw: unknown;
    if (type === "image") {
      const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
      const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
      if (!imageBase64 || !mimeType.startsWith("image/")) {
        return NextResponse.json(
          { error: "Please attach a valid document image.", requestId },
          { status: 400 }
        );
      }
      if (imageBase64.length > 8_000_000) {
        return NextResponse.json(
          { error: "That image is too large after processing.", requestId },
          { status: 413 }
        );
      }
      raw = await callGrokVision({
        imageBase64,
        mimeType,
        systemPrompt: SYSTEM_PROMPT_BASE,
        userPrompt: buildUserPromptImage(jurisdictionHint),
      });
    } else if (type === "text") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (text.length < 20) {
        return NextResponse.json(
          { error: "Please describe your situation (at least 20 characters).", requestId },
          { status: 400 }
        );
      }
      raw = await callGrokText({
        systemPrompt: SYSTEM_PROMPT_BASE,
        userPrompt: buildUserPromptText(jurisdictionHint).replace(
          "<situation>",
          text.replace(/"/g, '\\"').slice(0, 4000)
        ),
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request type.", requestId },
        { status: 400 }
      );
    }

    // ── Validate ──────────────────────────────────────────────
    let analysis;
    try {
      analysis = parseAnalysis(raw);
    } catch (err) {
      console.error(
        `[analyze:${requestId}] Zod validation failed:`,
        explainErrorMessage(err)
      );
      return NextResponse.json(
        { error: "Analysis failed. Please try again.", requestId },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis,
      id: randomUUID(),
      requestId,
      source: "grok",
    });
  } catch (err) {
    if (err instanceof GrokError) {
      console.error(
        `[analyze:${requestId}] GrokError ${err.status}:`,
        err.body || err.message
      );
      return NextResponse.json(
        { error: "Our AI is busy. Try again in a moment.", requestId },
        { status: 502 }
      );
    }
    console.error(`[analyze:${requestId}] unexpected:`, err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", requestId },
      { status: 500 }
    );
  }
}
