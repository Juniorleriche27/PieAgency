import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez PieAgency par email, téléphone, WhatsApp ou via le formulaire en ligne.",
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container">
        <ContactForm />
      </div>
    </section>
  );
}
