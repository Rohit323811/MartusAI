// SERVER ONLY — shared LLM client for the module APIs (PlainSite,
// ContractFlow, TenantShield). Uses Groq's OpenAI-compatible endpoint.
import OpenAI from "openai";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const LLM_MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 45_000;

export class LlmError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string
  ) {
    super(message);
    this.name = "LlmError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new LlmError("GROQ_API_KEY is not configured", 500, "");
  }
  if (!client) {
    client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  }
  return client;
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/**
 * Send a system + user prompt and return the parsed JSON object.
 * Throws LlmError on transport/HTTP/parse failure.
 */
export async function callLlmJson(opts: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await getClient().chat.completions.create(
      {
        model: LLM_MODEL,
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: opts.temperature ?? 0.2,
      },
      { signal: controller.signal }
    );

    const text = res.choices?.[0]?.message?.content;
    if (!text) {
      throw new LlmError("LLM returned an empty response", 502, "");
    }
    return extractJson(text);
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err instanceof OpenAI.APIError) {
      throw new LlmError(
        `Groq API error ${err.status}`,
        err.status ?? 502,
        err.message.slice(0, 2000)
      );
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError("LLM request timed out", 504, "");
    }
    throw new LlmError(
      err instanceof Error ? err.message : "LLM request failed",
      502,
      ""
    );
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    // Models occasionally wrap JSON in prose despite json_object mode.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new LlmError("LLM returned invalid JSON", 502, trimmed.slice(0, 500));
  }
}
