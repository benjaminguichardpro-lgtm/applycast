// The app and the landing live on two hosts served by the same deployment (see src/proxy.ts).
export const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
export const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3100";

export const appLink = (path: string) => `${APP_URL}${path}`;
