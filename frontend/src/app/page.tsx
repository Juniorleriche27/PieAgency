import { ActionLink } from "@/components/action-link";
import { FAQAccordion } from "@/components/faq-accordion";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import {
  company,
  faqItems,
  homeApproach,
  homeMethodSteps,
  homeStudentSpaceFeatures,
  serviceCards,
  servicePages,
} from "@/content/site";

const campusFrancePage = servicePages.find((page) => page.slug === "campus-france")!;
const visaPage = servicePages.find((page) => page.slug === "visa")!;
const alternativePages = servicePages.filter((page) =>
  ["belgique", "paris-saclay", "parcoursup", "ecoles"].includes(page.slug),
);
const visibleCommunityLinks = company.communityLinks;
const homepageFaqItems = faqItems.slice(0, 5);

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-inner">
          <div className="hero-content animate">
            <div className="hero-badge">
              <div className="hero-dot" />
              <span>Cabinet d&apos;accompagnement étudiant</span>
            </div>
            <h1>
              Étudiez en France ou en Belgique avec un accompagnement{" "}
              <em>clair, humain</em> et structuré
            </h1>
            <p>
              Analyse du dossier, choix des formations, rédaction des documents,
              préparation à l&apos;entretien Campus France, accompagnement visa et
              suivi personnalisé.
            </p>
            <div className="hero-ctas">
              <ActionLink href="/contact" variant="gold" size="lg">
                Commencer mon dossier
              </ActionLink>
              <ActionLink href="/faq" variant="outlineWhite" size="lg">
                Comprendre le processus
              </ActionLink>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-title">Nos contacts directs</div>
              <div className="hero-trust-item">
                <span>📍</span>
                France : {company.contacts.france.person}{" "}
                {company.contacts.france.phoneDisplay}
              </div>
              <div className="hero-trust-item">
                <span>📍</span>
                Togo : {company.contacts.togo.person} {company.contacts.togo.phoneDisplay}
              </div>
              <div className="hero-trust-item">
                <span>✉️</span>
                {company.emails.primary}
              </div>
            </div>
          </div>

          <div className="hero-visual animate delay-2">
            <div className="dashboard-card">
              <div className="dash-header">
                <div className="dash-title">Suivi de dossier — Campus France</div>
                <div className="dash-badge">● En cours</div>
              </div>
              <div className="dash-progress">
                <div className="dash-progress-label">
                  <span>Progression</span>
                  <span>4 / 7 étapes</span>
                </div>
                <div className="dash-bar">
                  <div className="dash-bar-fill" style={{ width: "57%" }} />
                </div>
              </div>
              <div className="dash-steps">
                {campusFrancePage.timeline?.slice(0, 4).map((step) => (
                  <div className="dash-step done" key={step.title}>
                    <div className="dash-step-icon">✓</div>
                    <div className="dash-step-text">{step.title}</div>
                  </div>
                ))}
                {campusFrancePage.timeline?.slice(4).map((step, index) => (
                  <div className="dash-step pending" key={step.title}>
                    <div className="dash-step-icon">{index + 5}</div>
                    <div className="dash-step-text">{step.title}</div>
                  </div>
                ))}
              </div>
              <div className="dash-mini-badges">
                <span className="dash-mini-badge a">Campus France</span>
                <span className="dash-mini-badge b">Suivi actif</span>
                <span className="dash-mini-badge a">France 🇫🇷</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm trust-band">
        <div className="container">
          <SectionHeader
            eyebrow="Notre approche"
            title="Un accompagnement pensé pour avancer avec méthode"
            subtitle="Chez PieAgency, chaque étudiant est accompagné avec une logique claire : compréhension du profil, structuration du projet, préparation des documents, soumission du dossier et accompagnement jusqu’aux étapes décisives."
          />
          <div className="trust-grid">
            {homeApproach.map((item, index) => (
              <Reveal className="trust-item" delay={index * 80} key={item.title}>
                <div className="trust-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Ce que nous faisons"
            title="Nos accompagnements"
            subtitle="Nous accompagnons les étudiants sur plusieurs parcours, selon leur profil, leur projet et la procédure concernée."
            withDivider
          />
          <div className="services-grid">
            {serviceCards.map((service, index) => (
              <Reveal className="service-card" delay={index * 70} key={service.slug}>
                <div className="service-card-number">{service.number}</div>
                <h3>{service.shortTitle}</h3>
                <p>{service.summary}</p>
                <div className="service-card-cta">
                  <ActionLink href={`/${service.slug}`} variant="primary" size="sm">
                    En savoir plus
                  </ActionLink>
                  <ActionLink
                    href="/contact"
                    variant="outline"
                    size="sm"
                  >
                    Démarrer
                  </ActionLink>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-gray">
        <div className="container">
          <div className="two-col wide-gap">
            <div>
              <div className="section-label">Service phare</div>
              <h2 className="section-title">{campusFrancePage.heroTitle}</h2>
              <p className="section-lead">{campusFrancePage.summary}</p>
              <h4 className="section-mini-title">Comment ça fonctionne ?</h4>
              <div className="timeline">
                {campusFrancePage.timeline?.map((step, index) => (
                  <div className="timeline-item" key={step.title}>
                    <div className="timeline-num">{String(index + 1).padStart(2, "0")}</div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-32">
                <ActionLink href="/campus-france" variant="primary" size="lg">
                  Lancer mon accompagnement Campus France
                </ActionLink>
              </div>
            </div>

            <div>
              <div className="section-label">Procédure Visa</div>
              <h2 className="section-title">{visaPage.heroTitle}</h2>
              <p className="section-lead">{visaPage.summary}</p>
              <h4 className="section-mini-title">Comment ça fonctionne ?</h4>
              <div className="timeline">
                {visaPage.timeline?.map((step, index) => (
                  <div className="timeline-item" key={step.title}>
                    <div className="timeline-num">{String(index + 1).padStart(2, "0")}</div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-32">
                <ActionLink href="/visa" variant="outline" size="lg">
                  Préparer mon dossier visa
                </ActionLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="D’autres voies"
            title="D’autres parcours selon votre projet"
            subtitle="Parce que chaque étudiant a un parcours différent, PieAgency propose aussi un accompagnement ciblé sur d’autres procédures et voies d’accès."
          />
          <div className="alt-grid">
            {alternativePages.map((page, index) => (
              <Reveal className="service-card" delay={index * 70} key={page.slug}>
                <div className="service-card-number">{page.badge}</div>
                <h3>{page.shortTitle}</h3>
                <p>{page.summary}</p>
                <div className="service-card-cta mt-16">
                  <ActionLink href={`/${page.slug}`} variant="outline" size="sm">
                    Découvrir →
                  </ActionLink>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-gray">
        <div className="container">
          <SectionHeader
            eyebrow="Notre méthode"
            title="Une méthode claire, étape par étape"
            subtitle="Nous ne faisons pas avancer les étudiants au hasard. Chaque accompagnement suit une logique simple : comprendre le profil, structurer le projet, préparer les documents, avancer sur la procédure et accompagner jusqu’aux étapes importantes."
          />
          <div className="method-grid">
            {homeMethodSteps.map((step, index) => (
              <Reveal className="method-step" delay={index * 80} key={step.title}>
                <div className="method-num">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="two-col wide-gap top-align">
            <div>
              <div className="section-label">En développement</div>
              <h2 className="section-title">
                Un accompagnement mieux organisé grâce à un espace étudiant
              </h2>
              <p className="section-lead compact">
                PieAgency évolue vers une expérience encore plus structurée, avec un
                espace étudiant permettant de suivre le dossier, centraliser les
                documents, recevoir les consignes et mieux visualiser les étapes à
                venir.
              </p>
              <ul className="feature-list">
                {homeStudentSpaceFeatures.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
              <ActionLink href="/contact" variant="primary">
                Être informé à l’ouverture
              </ActionLink>
            </div>

            <div className="dashboard-preview">
              <div className="dash-preview-header">
                <div>
                  <div className="dash-preview-kicker">Espace étudiant</div>
                  <div className="dash-preview-title">
                    Mon dossier — Campus France 🇫🇷
                  </div>
                </div>
                <div className="dash-preview-meta">
                  Dernière mise à jour : aujourd&apos;hui
                </div>
              </div>
              <div className="dash-preview-grid">
                <div className="dash-pcard">
                  <div className="dash-pcard-label">Progression</div>
                  <div className="dash-pcard-val">57%</div>
                  <div className="dash-pcard-sub">4 étapes sur 7 validées</div>
                </div>
                <div className="dash-pcard">
                  <div className="dash-pcard-label">Prochain rendez-vous</div>
                  <div className="dash-pcard-val small">
                    Entretien
                    <br />
                    <span className="text-green">Préparation →</span>
                  </div>
                </div>
              </div>
              <div className="dash-checklist">
                <div className="dash-check-label">Checklist des documents</div>
                <div className="dash-check-item">
                  <div className="dash-check-box done">✓</div>
                  Relevés de notes officiels
                </div>
                <div className="dash-check-item">
                  <div className="dash-check-box done">✓</div>
                  Copie du baccalauréat
                </div>
                <div className="dash-check-item">
                  <div className="dash-check-box done">✓</div>
                  Lettre de motivation rédigée
                </div>
                <div className="dash-check-item">
                  <div className="dash-check-box alert">!</div>
                  CV — correction en attente
                </div>
                <div className="dash-check-item">
                  <div className="dash-check-box todo" />
                  Justificatifs financiers
                </div>
                <div className="dash-check-item">
                  <div className="dash-check-box todo" />
                  Photo d&apos;identité conforme
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-gray">
        <div className="container">
          <SectionHeader
            eyebrow="Communauté"
            title="Rejoignez la communauté PieAgency"
            subtitle="Retrouvez des échanges, des conseils et des informations utiles à travers nos espaces communautaires."
          />
          <div className="community-grid">
            {visibleCommunityLinks.map((community, index) => (
              <Reveal className="community-card" delay={index * 80} key={community.label}>
                <div className={`community-icon ${community.iconClass}`}>
                  {community.icon}
                </div>
                <h3>{community.label}</h3>
                <p>{community.description}</p>
                <ActionLink
                  href={community.href}
                  variant={community.variant}
                  external
                >
                  {community.cta}
                </ActionLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Contactez-nous"
            title="Notre équipe est disponible"
            subtitle="Notre équipe reste disponible pour vous orienter et vous aider à choisir l’accompagnement adapté à votre situation."
          />
          <div className="contact-snippet-grid">
            {[company.contacts.france, company.contacts.togo].map((contact) => (
              <div className="trust-item contact-snippet-card" key={contact.label}>
                <div className="contact-snippet-head">
                  <span className="contact-snippet-flag">{contact.flag}</span>
                  <span className="contact-snippet-label">{contact.label}</span>
                </div>
                <div className="contact-snippet-person">{contact.person}</div>
                <div className="contact-snippet-phone">{contact.phoneDisplay}</div>
              </div>
            ))}
          </div>
          <div className="contact-actions">
            <ActionLink href="/contact" variant="primary">
              Formulaire de contact
            </ActionLink>
            <ActionLink href="/faq" variant="outline">
              Questions frequentes
            </ActionLink>
          </div>
        </div>
      </section>

      <section className="section bg-gray">
        <div className="container container-faq">
          <SectionHeader eyebrow="Questions fréquentes" title="Questions fréquentes" />
          <FAQAccordion items={homepageFaqItems} />
          <div className="text-center mt-24">
            <ActionLink href="/faq" variant="outline">
              Voir toutes les questions →
            </ActionLink>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Prêt à démarrer votre dossier ?</h2>
          <p>
            Parlez avec un conseiller et avancez avec une méthode plus claire pour
            vos démarches d’études vers la France ou la Belgique.
          </p>
          <div className="cta-btns">
            <ActionLink href="/contact" variant="gold" size="lg">
              Commencer mon dossier
            </ActionLink>
            <ActionLink href="/faq" variant="outlineWhite" size="lg">
              Voir les questions frequentes
            </ActionLink>
          </div>
        </div>
      </section>
    </>
  );
}
