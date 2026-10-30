// Sets a random strong password on an existing user (or creates the user, already confirmed) and prints it once.
// Run: node --env-file=.env.local scripts/set-password.mjs <email>
// Uses the service role key; it is never printed. Change the password after the first sign-in.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
if (!email || !url || !key) {
  console.error("Usage: node --env-file=.env.local scripts/set-password.mjs <email> (needs the Supabase URL and service role key).");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const password = randomBytes(18).toString("base64url");

let id;
for (let page = 1; !id; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Could not list users:", error.message);
    process.exit(1);
  }
  id = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (data.users.length < 200) break;
}

const { error } = id
  ? await admin.auth.admin.updateUserById(id, { password, email_confirm: true })
  : await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  console.error("Could not set the password:", error.message);
  process.exit(1);
}
console.log(`${id ? "Password updated" : "User created"} for ${email}.\nPassword: ${password}`);
