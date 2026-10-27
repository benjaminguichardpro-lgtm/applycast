"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/actions", label: "My actions" },
  { href: "/history", label: "History" },
  { href: "/context", label: "Context" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 rounded-full bg-card p-1 shadow-sm">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-navy text-on-navy" : "text-ink hover:bg-field"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
