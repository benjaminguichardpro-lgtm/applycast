import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md rounded-shell bg-shell p-8">
        <p className="mb-6 inline-block rounded-full border border-line bg-card px-4 py-1.5 text-sm font-semibold">Applycast</p>
        <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">We’ll email you a magic link. No password.</p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-warn">
            That link expired or was already used. Request a new one.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
