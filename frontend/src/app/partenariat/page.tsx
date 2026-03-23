import type { Metadata } from "next";
import { PartnershipForm } from "@/components/partnership-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Partenariat",
  description:
    "Universites, ecoles, entreprises et partenaires peuvent proposer un partenariat a PieAgency.",
};

export default function PartnershipPage() {
  return (
    <>
      <PageHero
        breadcrumb="Partenariat"
        description="Un point d'entree dedie pour les universites, ecoles, associations, institutions et partenaires qui souhaitent travailler avec PieAgency."
        title="Construisons un partenariat utile"
      />

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info-card">
              <h3>Pourquoi proposer un partenariat ?</h3>
              <p>
                PieAgency peut collaborer avec des universites, ecoles,
                institutions, associations et entreprises autour du recrutement,
                de la visibilite, des evenements et de la representation locale.
              </p>
              <div className="community-stack mt-16">
                <div className="contact-item">
                  <div className="contact-item-icon">1</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">Recrutement etudiant</div>
                    <div className="contact-item-value">
                      Mise en relation avec des profils qualifies et suivis.
                    </div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-icon">2</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">Visibilite et communication</div>
                    <div className="contact-item-value">
                      Activation de notre site, de PieHUB et de nos espaces communautaires.
                    </div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-icon">3</div>
                  <div className="contact-item-text">
                    <div className="contact-item-label">Evenements et representation</div>
                    <div className="contact-item-value">
                      Webinaires, ateliers, campagnes locales et partenariats institutionnels.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <PartnershipForm />
          </div>
        </div>
      </section>
    </>
  );
}
