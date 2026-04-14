import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { CALENDLY_HREF } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez PieAgency via le formulaire en ligne ou prenez un rendez-vous de consultation.",
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="contact-rdv-banner">
          <div className="contact-rdv-text">
            <span className="contact-rdv-emoji">📅</span>
            <div>
              <strong>Consultation en ligne gratuite — 15 min</strong>
              <span>Parlez directement avec un conseiller PieAgency pour faire le point sur votre projet.</span>
            </div>
          </div>
          <a
            className="btn btn-green"
            href={CALENDLY_HREF}
            rel="noreferrer"
            target="_blank"
          >
            Réserver un créneau
          </a>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
