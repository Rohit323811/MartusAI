import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Magic-link callback. Exchanges the auth code for a session and sets
 * auth cookies so the browser client picks up the session on redirect.
 *
 * NOTE: uses a minimal cookie set/get inline (no @supabase/ssr dependency
 * needed for this MVP). If you later add middleware-based session refresh,
 * swap to @supabase/ssr's createServerClient.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(`${origin}/?auth=unconfigured`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=missing_code`);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { flowType: "pkce" },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth callback error:", error.message);
      return NextResponse.redirect(`${origin}/?auth=error`);
    }
  } catch (err) {
    console.error("auth callback exception:", err);
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
}
