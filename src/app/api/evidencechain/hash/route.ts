import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 30;

// exif-parser has no bundled types; see src/types/modules.d.ts.
import { create as createExifParser } from "exif-parser";

const RegisterSchema = z.object({
  action: z.literal("register"),
  fileBase64: z.string().min(1),
  mimeType: z.string().min(1),
  fileName: z.string().min(1).max(255),
  uploaderNote: z.string().max(2000).optional(),
});

const VerifySchema = z.object({
  action: z.literal("verify"),
  fileBase64: z.string().min(1),
  entryId: z.string().uuid().optional(),
  expectedHash: z.string().length(64).optional(),
});

const BodySchema = z.discriminatedUnion("action", [RegisterSchema, VerifySchema]);

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function extractImageMeta(buf: Buffer): Record<string, unknown> {
  try {
    const parser = createExifParser(buf);
    parser.enableBinaryFields(false);
    const result = parser.parse();
    const tags = result.tags ?? {};
    const pick: Record<string, unknown> = {};
    const keys = [
      "Make", "Model", "DateTimeOriginal", "CreateDate", "ModifyDate",
      "ISO", "FNumber", "ExposureTime", "GPSLatitude", "GPSLongitude",
      "ImageWidth", "ImageHeight", "Orientation", "Software",
    ] as const;
    for (const k of keys) {
      if (tags[k] !== undefined && tags[k] !== null) pick[k] = tags[k];
    }
    return pick;
  } catch {
    return {}; // no EXIF — not an image or stripped; not an error
  }
}

async function extractPdfMeta(buf: Buffer): Promise<Record<string, unknown>> {
  try {
    if (buf.subarray(0, 4).toString() !== "%PDF") return {};
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try {
      const info = await parser.getInfo();
      return {
        pages: info.total,
        info: info.info ?? {},
      };
    } finally {
      await parser.destroy().catch(() => {});
    }
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: provide action=register or action=verify with fileBase64.", requestId },
        { status: 400 }
      );
    }
    const body = parsed.data;

    if (body.fileBase64.length > 34_000_000) {
      return NextResponse.json(
        { error: "File too large. Maximum is 25 MB.", requestId },
        { status: 413 }
      );
    }
    const buf = Buffer.from(body.fileBase64, "base64");
    if (buf.length === 0) {
      return NextResponse.json({ error: "Empty file.", requestId }, { status: 400 });
    }

    const hash = sha256(buf);

    // ── Verify: re-hash and compare against a stored entry ─────
    if (body.action === "verify") {
      let expected = body.expectedHash ?? null;
      let loggedAt: string | null = null;
      let fileName: string | null = null;

      const admin = getSupabaseAdmin();
      if (body.entryId && admin) {
        const { data, error } = await admin
          .from("evidence_log")
          .select("file_name, file_hash, timestamp")
          .eq("id", body.entryId)
          .maybeSingle();
        if (error) {
          console.error(`[evidencechain:${requestId}] lookup failed:`, error.message);
          return NextResponse.json({ error: "Could not load the evidence record.", requestId }, { status: 500 });
        }
        if (!data) {
          return NextResponse.json({ error: "Evidence record not found.", requestId }, { status: 404 });
        }
        expected = data.file_hash;
        loggedAt = data.timestamp;
        fileName = data.file_name;
      }

      if (!expected) {
        return NextResponse.json(
          { error: "Provide entryId or expectedHash to verify against.", requestId },
          { status: 400 }
        );
      }

      return NextResponse.json({
        action: "verify",
        computed_hash: hash,
        expected_hash: expected,
        match: hash === expected,
        file_name: fileName,
        logged_at: loggedAt,
        requestId,
      });
    }

    // ── Register: hash + metadata + persist ────────────────────
    const meta: Record<string, unknown> = {
      size_bytes: buf.length,
      mime_type: body.mimeType,
    };
    if (body.mimeType.startsWith("image/")) {
      Object.assign(meta, extractImageMeta(buf));
    } else if (body.mimeType === "application/pdf") {
      Object.assign(meta, await extractPdfMeta(buf));
    }

    const admin = getSupabaseAdmin();
    let entryId = crypto.randomUUID();
    let loggedAt = new Date().toISOString();
    let persisted = false;

    if (admin) {
      const { data, error } = await admin
        .from("evidence_log")
        .insert({
          file_name: body.fileName,
          file_hash: hash,
          uploader_note: body.uploaderNote ?? null,
        })
        .select("id, timestamp")
        .single();
      if (error) {
        console.error(`[evidencechain:${requestId}] insert failed:`, error.message);
        return NextResponse.json({ error: "Could not save the evidence record.", requestId }, { status: 500 });
      }
      entryId = data.id;
      loggedAt = data.timestamp;
      persisted = true;
    }

    return NextResponse.json({
      action: "register",
      entry_id: entryId,
      file_name: body.fileName,
      file_hash: hash,
      logged_at: loggedAt,
      uploader_note: body.uploaderNote ?? null,
      metadata: meta,
      persisted,
      requestId,
    });
  } catch (err) {
    console.error(`[evidencechain:${requestId}] unexpected:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again.", requestId }, { status: 500 });
  }
}
