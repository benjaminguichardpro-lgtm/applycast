import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile-db";
import { createClient } from "@/lib/supabase/server";
import { ContextForm } from "./context-form";

export default async function ContextPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  return <ContextForm initial={await getProfile(supabase, user.id)} />;
}
