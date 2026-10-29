import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /api/cron and the Stripe webhook authenticate themselves (bearer secret, signature); neither has a user session.
const PUBLIC_PATHS = ["/login", "/auth", "/api/cron", "/api/stripe/webhook", "/privacy", "/terms", "/legal-notice", "/mentions-legales", "/confidentialite", "/cgv"];

// Pages served on the marketing host (getapplycast.com). Everything else lives on the app host (app.getapplycast.com).
// With APP_HOST / MARKETING_HOST unset (the default), one host serves both and "/" is the landing.
const MARKETING_PATHS = ["/", "/privacy", "/terms", "/legal-notice", "/mentions-legales", "/confidentialite", "/cgv"];

// Refreshes the Supabase session cookie and sends anonymous visitors to /login.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const appHost = process.env.APP_HOST;
  const marketingHost = process.env.MARKETING_HOST;
  const splitHosts = Boolean(appHost && marketingHost);

  if (splitHosts && host === marketingHost) {
    if (MARKETING_PATHS.includes(pathname) || pathname.startsWith("/api/")) return NextResponse.next();
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, `${request.nextUrl.protocol}//${appHost}`));
  }
  if (splitHosts && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/context";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  const isPublic = pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/context";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|svg|webp|ico|mp4|webm)$).*)"],
};
