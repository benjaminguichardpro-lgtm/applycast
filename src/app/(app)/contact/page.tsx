import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export default async function ContactPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <section>
      <h1 className="text-4xl font-medium tracking-tight">Contact</h1>
      <p className="mt-2 text-sm text-muted">A question, a bug, an idea? Write to us, we read everything.</p>
      <div className="mx-auto mt-10 max-w-2xl">
        <ContactForm email={user.email} />
      </div>
    </section>
  );
}
