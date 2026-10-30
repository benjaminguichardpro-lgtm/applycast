import { reveal } from "./reveal";

const icon = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

// What removes the last doubt next to the price. Each line is backed by the legal pages (privacy, terms).
const items = [
  {
    title: "Cancel in a click",
    text: "Online, any time. You keep Pro until the period ends.",
    svg: (
      <svg {...icon}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </svg>
    ),
  },
  {
    title: "Your history stays",
    text: "Plans, actions and check-ins are never locked.",
    svg: (
      <svg {...icon}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 7.5-2" />
      </svg>
    ),
  },
  {
    title: "Your data stays yours",
    text: "No ads, no trackers, never sold. Payments by Stripe.",
    svg: (
      <svg {...icon}>
        <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
        <path d="m9.5 12 2 2 3.5-4" />
      </svg>
    ),
  },
];

export function Reassurance() {
  return (
    <ul className="mx-auto mt-6 grid max-w-[940px] gap-x-6 gap-y-5 sm:grid-cols-3">
      {items.map((it, i) => (
        <li key={it.title} {...reveal(i)} className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chip text-primary">{it.svg}</span>
          <span>
            <span className="block text-sm font-medium">{it.title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">{it.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
