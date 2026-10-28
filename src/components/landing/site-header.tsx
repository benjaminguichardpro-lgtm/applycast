import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { appLink } from "@/lib/site";
import { primaryButton } from "./buttons";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-[1136px] items-center justify-between gap-3 px-4 py-4 sm:py-5">
      <Link href="/" aria-label="Applycast">
        <Logo height={38} />
      </Link>
      <nav aria-label="Main" className="hidden gap-8 text-sm text-muted md:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <a href={appLink("/login")} className="hidden text-sm font-semibold sm:block">
          Sign in
        </a>
        <a href={appLink("/login")} className={`${primaryButton} !px-4 !py-2 text-xs`}>
          Try it free
        </a>
        <ThemeToggle />
        <details className="relative md:hidden">
          <summary
            aria-label="Menu"
            className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-line bg-card [&::-webkit-details-marker]:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 top-12 z-20 flex w-48 flex-col gap-1 rounded-2xl border border-line bg-card p-2 text-sm shadow-lg">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-3 py-2 hover:bg-field">
                {l.label}
              </Link>
            ))}
            <a href={appLink("/login")} className="rounded-xl px-3 py-2 font-semibold hover:bg-field">
              Sign in
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
