import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez PieAgency via le formulaire en ligne ou le chat du site.",
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
