import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
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

  const { isPro, isFounding, left } = await getAnalysesLeft(supabase, user.id);

  return (
    <div className="min-h-screen bg-shell">
      <div className="mx-auto max-w-[1600px] p-4 sm:px-10 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/context" aria-label="Applycast" className="rounded-full border border-line bg-card px-5 py-2">
            <Logo height={26} />
          </Link>
          <NavLinks />
          <div className="flex items-center gap-2">
            <Link href="/upgrade" className="rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold">
              {isPro ? `${isFounding ? "Pro · Founding" : "Pro"} · ${left} left` : `Upgrade · ${left} left`}
            </Link>
            <ThemeToggle />
            <UserMenu email={user.email} isPro={isPro} isFounding={isFounding} />
          </div>
        </header>
        <main id="main" className="mt-8">{children}</main>
      </div>
    </div>
  );
}
