import Link from "next/link";
import { redirect } from "next/navigation";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { getAnalysesLeft } from "@/lib/quota";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { isPro, left } = await getAnalysesLeft(supabase, user.id);

  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto max-w-[1600px] p-4 sm:px-10 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/context" className="rounded-full border border-line bg-card px-5 py-2 text-sm font-semibold">
            Applycast
          </Link>
          <NavLinks />
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold">
              {isPro ? "Pro" : `Upgrade · ${left} left`}
            </span>
            <ThemeToggle />
            <UserMenu email={user.email} />
          </div>
        </header>
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
