import Link from "next/link";
import { isToFill } from "@/lib/legal";

// Shell of a legal page: title, update date, a link to the other language, then the text.
export function LegalPage({
  title,
  updated,
  alt,
  children,
}: {
  title: string;
  updated: string;
  alt: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto mt-12 max-w-[760px] px-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <Link href={alt.href} className="text-sm font-medium text-primary underline">
          {alt.label}
        </Link>
      </div>
      <p className="mt-2 text-xs text-muted">{updated}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted [&_a]:text-primary [&_a]:underline [&_li]:mt-1.5 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 pt-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

// A value the publisher must fill in: highlighted while it is still a placeholder.
export function Fill({ value }: { value: string }) {
  return isToFill(value) ? <mark className="rounded bg-amber-200 px-1 text-amber-950">{value}</mark> : <>{value}</>;
}
