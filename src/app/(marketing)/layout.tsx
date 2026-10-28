import { ScrollEffects } from "@/components/landing/scroll-effects";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import "./landing.css";

// Marks the page as animatable before first paint, so reveal-on-scroll elements never flash visible then hide.
// If ScrollEffects has not started within 4 s (it sets data-fx), everything is shown rather than left hidden.
const revealScript = `var d=document.documentElement;d.classList.add("rv");setTimeout(function(){if(!d.hasAttribute("data-fx"))d.classList.remove("rv")},4000)`;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-landing className="min-h-screen overflow-x-clip bg-page">
      <script dangerouslySetInnerHTML={{ __html: revealScript }} />
      <ScrollEffects />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
