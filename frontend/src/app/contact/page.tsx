import type { Metadata } from "next";
import { ActionLink } from "@/components/action-link";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { company } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez PieAgency par email, téléphone, WhatsApp ou via le formulaire en ligne.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        breadcrumb="Contact"
        description="Parlez avec notre équipe pour mieux comprendre l’accompagnement adapté à votre situation."
        title="Contactez-nous"
      />

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="contact-info-card">
                <h3>Nos coordonnées</h3>
                <p>
                  Notre équipe est disponible pour répondre à vos questions par
                  email, téléphone ou WhatsApp.
                </p>

                <div className="contact-item">
                  <div className="contact-item-icon">✉️</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">Email principal</div>
                    <div className="contact-item-value">{company.emails.primary}</div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon">✉️</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">Email secondaire</div>
                    <div className="contact-item-value">{company.emails.secondary}</div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon">🇫🇷</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">
                      France — {company.contacts.france.person}
                    </div>
                    <div className="contact-item-value">
                      {company.contacts.france.phoneDisplay}
                    </div>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item-icon">🇹🇬</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">
                      Togo — {company.contacts.togo.person}
                    </div>
                    <div className="contact-item-value">
                      {company.contacts.togo.phoneDisplay}
                    </div>
                  </div>
                </div>

                <div className="contact-wa-btns">
                  <ActionLink
                    href={company.contacts.togo.whatsappHref}
                    variant="waTogo"
                    external
                  >
                    📱 WA Togo
                  </ActionLink>
                  <ActionLink
                    href={company.contacts.france.whatsappHref}
                    variant="waFrance"
                    external
                  >
                    📱 WA France
                  </ActionLink>
                </div>
              </div>

              <div className="community-card mt-24" style={{ textAlign: "left" }}>
                <div className="contact-snippet-label">Rejoindre la communauté</div>
                <div className="community-stack mt-16">
                  {company.communityLinks.map((community) => (
                    <ActionLink
                      external
                      href={community.href}
                      key={community.href}
                      variant={community.variant}
                      size="sm"
                    >
                      {community.icon} {community.label}
                    </ActionLink>
                  ))}
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
