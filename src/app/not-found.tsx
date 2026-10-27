import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md rounded-shell bg-shell p-8 text-center">
        <h1 className="text-3xl font-medium tracking-tight">We can’t find that page</h1>
        <p className="mt-2 text-sm text-muted">It may have been deleted, or the link is wrong.</p>
        <Link href="/analyze" className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-on-navy">
          Back to Applycast
        </Link>
      </div>
    </main>
  );
}
