import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Magic-link landing: swaps the one-time code for a session, then opens the app.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/context`);
  }
  // Links built from a token hash (the test user script, custom email templates) skip the PKCE code.
  if (tokenHash && searchParams.get("type") === "magiclink") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (!error) return NextResponse.redirect(`${origin}/context`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
