import Link from "next/link";
import { Logo } from "@/components/logo";
import { LEGAL } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line dark:border-line/60">
      <div className="mx-auto flex max-w-[1136px] flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Applycast">
          <Logo height={22} />
        </Link>
        <nav aria-label="Footer" className="flex gap-6">
          <a href={`mailto:${LEGAL.email}`} className="hover:text-ink">Contact</a>
          <Link href="/legal-notice" className="hover:text-ink">Legal notice</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
        </nav>
        <p className="text-xs">© {new Date().getFullYear()} Applycast</p>
      </div>
    </footer>
  );
}
