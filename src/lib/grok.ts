// SERVER ONLY — never import in client components.
import { parseAnalysis, explainErrorMessage } from "./schemas";

const GROK_BASE_URL = "https://api.x.ai/v1/chat/completions";
const VISION_MODEL = "grok-2-vision-1212";
const TEXT_MODEL = "grok-2-1212";
const TIMEOUT_MS = 45_000;

export class GrokError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string
  ) {
    super(message);
    this.name = "GrokError";
  }
}

interface GrokMessage {
  role: "system" | "user";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

interface GrokOptions {
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  mimeType?: string;
}

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}

async function callGrok({
  systemPrompt,
  userPrompt,
  imageBase64,
  mimeType,
}: GrokOptions): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new GrokError("XAI_API_KEY is not configured", 500, "");
  }

  const isVision = Boolean(imageBase64 && mimeType);
  const content: GrokMessage["content"] = isVision
    ? [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${imageBase64}` },
        },
        { type: "text", text: userPrompt },
      ]
    : userPrompt;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GROK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: isVision ? VISION_MODEL : TEXT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new GrokError(
        `Grok API error ${res.status}`,
        res.status,
        body.slice(0, 2000)
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new GrokError("Grok returned an empty response", 502, "");
    }
    return text;
  } catch (err) {
    if (err instanceof GrokError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GrokError("Grok request timed out", 504, "");
    }
    throw new GrokError(
      err instanceof Error ? err.message : "Grok request failed",
      502,
      ""
    );
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    // Grok occasionally wraps JSON in prose despite json_object mode.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new GrokError("Grok returned invalid JSON", 502, trimmed.slice(0, 500));
  }
}

export async function callGrokVision(opts: {
  imageBase64: string;
  mimeType: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<unknown> {
  const text = await callGrok({ ...opts });
  return extractJson(text);
}

export async function callGrokText(opts: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<unknown> {
  const text = await callGrok({ ...opts });
  return extractJson(text);
}

export { explainErrorMessage };
