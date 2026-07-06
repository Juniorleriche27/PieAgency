import type { Metadata } from "next";
import { ActionLink } from "@/components/action-link";
import { PageHero } from "@/components/page-hero";
import { aboutValues, company } from "@/content/site";
import { SITE_URL, siteKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "À propos de PieAgency — Agence d’accompagnement étudiant France & Belgique",
  description:
    "PieAgency est une agence d’accompagnement étudiant pour Campus France, visa étudiant, Belgique, documents, entretien, logement, budget et suivi de dossier.",
  keywords: ["PieAgency", "PIE Agency", "Pie Agency", ...siteKeywords],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "À propos de PieAgency",
    description:
      "Découvrez PieAgency, agence d’accompagnement étudiant pour la France, Campus France, le visa étudiant et la Belgique.",
    url: `${SITE_URL}/about`,
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE_URL}/about#aboutpage`,
  url: `${SITE_URL}/about`,
  name: "À propos de PieAgency",
  description:
    "PieAgency est une agence d’accompagnement étudiant spécialisée dans Campus France, visa étudiant France, Belgique, documents, entretien, logement et budget.",
  mainEntity: {
    "@id": `${SITE_URL}/#organization`,
  },
};

export default function AboutPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} type="application/ld+json" />
      <PageHero
        breadcrumb="A propos"
        description="PieAgency est une structure d'accompagnement etudiant qui aide les candidats a construire un dossier coherent, a choisir les formations adaptees a leur profil et a avancer avec methode dans leurs demarches academiques et administratives vers la France et la Belgique."
        title="A propos de PieAgency"
      />

      <section className="section">
        <div className="container container-narrow">
          <div className="about-entity-panel">
            <span>Définition officielle</span>
            <h2>PieAgency est une agence d’accompagnement étudiant spécialisée dans les projets France et Belgique.</h2>
            <p>
              PieAgency accompagne les étudiants africains et francophones sur les étapes clés : diagnostic du profil,
              dossier Campus France, choix des formations, lettres de motivation, CV, entretien Campus France, visa étudiant,
              justificatifs financiers, hébergement, budget, Belgique et suivi dans un espace étudiant privé.
            </p>
          </div>

          <p className="about-lead">
            Nous voulons rendre l&apos;accompagnement etudiant plus clair, plus structure
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

          <h2 className="section-title mt-32">Presence Togo / France</h2>
          <p className="section-lead">
            PieAgency dispose d&apos;un point de repere au Togo et d&apos;un point de repere en
            France pour mieux comprendre les parcours etudiants a chaque etape.
          </p>

          <div className="presence-grid">
            <div className="presence-card togo">
              <div className="presence-card-flag">{company.contacts.togo.flag}</div>
              <h3>Presence Togo</h3>
              <p>
                Suivi de proximite pour les etudiants encore au Togo, de la
                preparation du dossier jusqu&apos;au depart.
              </p>
              <div className="presence-card-contact">
                {company.contacts.togo.person} - {company.contacts.togo.phoneDisplay}
              </div>
            </div>

            <div className="presence-card france">
              <div className="presence-card-flag">{company.contacts.france.flag}</div>
              <h3>Presence France</h3>
              <p>
                Accompagnement pour les etudiants deja en France ou pour ceux qui ont
                besoin d&apos;un suivi depuis la France.
              </p>
              <div className="presence-card-contact">
                {company.contacts.france.person} - {company.contacts.france.phoneDisplay}
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
