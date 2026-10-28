// Creates (or reuses) a confirmed test user and prints a one-time sign-in link, so you can log in without an inbox.
// Run: node --env-file=.env.local scripts/create-test-user.mjs [email]
// Uses the service role key; it is never printed. The link only works once and expires quickly.
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2] || "test@applycast.dev";
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, NEXT_PUBLIC_SITE_URL: site } = process.env;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing (run with --env-file=.env.local).");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const created = await admin.auth.admin.createUser({ email, email_confirm: true });
if (created.error && !/already|registered|exists/i.test(created.error.message)) {
  console.error("Could not create the user:", created.error.message);
  process.exit(1);
}
console.log(created.error ? `User ${email} already exists.` : `User ${email} created.`);

const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error("Could not generate the link:", error.message);
  process.exit(1);
}
const base = site || "http://localhost:3100";
console.log(`\nOpen this link once in your browser:\n${base}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink\n`);
