import { cache } from "react";
import { createClient } from "./supabase/server";

// Verifies the session JWT locally (no round trip to Supabase) and is shared by the layout and the page within one request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims?.sub ? { id: claims.sub, email: (claims.email as string | undefined) ?? "" } : null;
});
