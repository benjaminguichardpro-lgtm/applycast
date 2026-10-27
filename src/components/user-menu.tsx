import { signOut } from "@/app/auth/actions";

export function UserMenu({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <details className="relative">
      <summary
        aria-label={`Account menu for ${email}`}
        className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-navy text-xs font-semibold text-on-navy [&::-webkit-details-marker]:hidden"
      >
        {initials}
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-line bg-card p-3 shadow-lg">
        <p className="truncate px-2 pb-2 text-sm text-muted">{email}</p>
        <form action={signOut}>
          <button type="submit" className="w-full rounded-xl px-2 py-2 text-left text-sm font-medium hover:bg-field">
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
