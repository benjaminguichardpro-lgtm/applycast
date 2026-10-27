// Shown instantly while a page loads, so navigation feels immediate.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-4">
      <div className="h-4 w-40 rounded-full bg-chip" />
      <div className="h-10 w-2/3 rounded-2xl bg-chip" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-shell bg-card" />
        <div className="h-72 rounded-shell bg-card" />
        <div className="h-72 rounded-shell bg-card" />
      </div>
    </div>
  );
}
