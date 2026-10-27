import { formatHours, overBy, round1 } from "@/lib/effort";

// Weekly effort gauge: normal while within the limit, alert styling and a message above it.
export function EffortGauge({ hours, limit, perWeek = hours }: { hours: number; limit: number; perWeek?: number }) {
  const over = overBy(perWeek, limit);
  const pct = Math.min(100, Math.round((perWeek / limit) * 100));
  const room = round1(limit - perWeek);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider opacity-80">Effort</span>
        <span className="text-base font-medium">
          {round1(perWeek)} h of {round1(limit)} h per week
        </span>
      </div>
      <div
        role="meter"
        aria-label="Weekly effort"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(perWeek, limit)}
        aria-valuetext={over > 0 ? `${round1(perWeek)} hours of ${round1(limit)}, over your limit by ${over} hours` : `${round1(perWeek)} hours of ${round1(limit)} per week`}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20"
      >
        <div className={`h-full rounded-full ${over > 0 ? "bg-[#ff8a80]" : "bg-white"}`} style={{ width: `${pct}%` }} />
      </div>
      {over > 0 ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-[#ff8a80]">
          Over your limit by {formatHours(over)}
        </p>
      ) : (
        <p className="mt-2 text-xs opacity-80">{formatHours(Math.max(0, room))} of room left this week.</p>
      )}
      <span className="sr-only">{hours} hours selected in total</span>
    </div>
  );
}
