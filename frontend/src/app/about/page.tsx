import type { Metadata } from "next";
import { ActionLink } from "@/components/action-link";
import { PageHero } from "@/components/page-hero";
import { aboutValues, company } from "@/content/site";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "La vision, l’approche et les points de contact PieAgency entre le Togo et la France.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        breadcrumb="À propos"
        description="PieAgency est une structure d’accompagnement étudiant qui aide les candidats à construire un dossier cohérent, à choisir les formations adaptées à leur profil et à avancer avec méthode dans leurs démarches académiques et administratives vers la France et la Belgique."
        title="À propos de PieAgency"
      />

      <section className="section">
        <div className="container container-narrow">
          <p className="about-lead">
            Nous voulons rendre l’accompagnement étudiant plus clair, plus structuré
            et plus humain.
          </p>

          <div className="alt-grid">
            {aboutValues.map((value) => (
              <div className="info-block" key={value.title}>
                <span className="info-block-accent" />
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>

          <h2 className="section-title mt-32">Présence Togo / France</h2>
          <p className="section-lead">
            PieAgency dispose d’un point de contact au Togo et d’un point de contact
            en France pour rester plus proche des étudiants et mieux les orienter à
            chaque étape de leur parcours.
          </p>

          <div className="presence-grid">
            <div className="presence-card togo">
              <div className="presence-card-flag">🇹🇬</div>
              <h3>Contact Togo</h3>
              <p>
                Suivi de proximité pour les étudiants encore au Togo, de la
                préparation du dossier jusqu’au départ.
              </p>
              <div className="presence-card-contact">
                {company.contacts.togo.person} — {company.contacts.togo.phoneDisplay}
              </div>
              <div className="mt-16">
                <ActionLink
                  href={company.contacts.togo.whatsappHref}
                  variant="waTogo"
                  size="sm"
                  external
                >
                  📱 WhatsApp Togo
                </ActionLink>
              </div>
            </div>

            <div className="presence-card france">
              <div className="presence-card-flag">🇫🇷</div>
              <h3>Contact France</h3>
              <p>
                Accompagnement pour les étudiants déjà en France ou pour ceux qui ont
                besoin d’un suivi depuis la France.
              </p>
              <div className="presence-card-contact">
                {company.contacts.france.person} — {company.contacts.france.phoneDisplay}
              </div>
              <div className="mt-16">
                <ActionLink
                  href={company.contacts.france.whatsappHref}
                  variant="waFrance"
                  size="sm"
                  external
                >
                  📱 WhatsApp France
                </ActionLink>
              </div>
            </div>
          </div>

          <div className="text-center mt-32">
            <ActionLink href="/contact" variant="primary" size="lg">
              Nous contacter
            </ActionLink>
          </div>
        </div>
      </section>
    </>
  );
}
