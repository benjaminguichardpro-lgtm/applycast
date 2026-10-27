import Image from "next/image";

// Navy wordmark: flattened to white in dark mode so it stays readable (see .logo-mark in globals.css).
export function Logo({ height = 28 }: { height?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Applycast"
      width={Math.round(height * (1600 / 543))}
      height={height}
      className="logo-mark block"
      priority
    />
  );
}
