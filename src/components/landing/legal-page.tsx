export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto mt-12 max-w-[720px] px-4">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">{children}</div>
    </article>
  );
}
