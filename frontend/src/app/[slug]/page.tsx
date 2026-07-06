import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionLink } from "@/components/action-link";
import { PageHero } from "@/components/page-hero";
import { getServicePage, servicePages } from "@/content/site";
import { getServiceSeoProfile, SITE_URL } from "@/lib/seo";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return servicePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const servicePage = getServicePage(slug);

  if (!servicePage) {
    return {};
  }

  const seoProfile = getServiceSeoProfile(slug);

  return {
    title: `${servicePage.shortTitle} | Diagnostic, documents et accompagnement`,
    description: servicePage.heroDescription,
    keywords: seoProfile.keywords,
    alternates: {
      canonical: `/${servicePage.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/${servicePage.slug}`,
      title: `${servicePage.shortTitle} | PieAgency`,
      description: servicePage.heroDescription,
      siteName: "PieAgency",
      images: [
        {
          url: "/pieagency-logo.jpg",
          width: 1200,
          height: 630,
          alt: `${servicePage.shortTitle} PieAgency`,
        },
      ],
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const servicePage = getServicePage(slug);

  if (!servicePage) {
    notFound();
  }

  const seoProfile = getServiceSeoProfile(slug);
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: servicePage.shortTitle,
    provider: {
      "@type": "EducationalOrganization",
      name: "PieAgency",
      url: SITE_URL,
    },
    areaServed: ["France", "Belgique", "Afrique francophone"],
    serviceType: servicePage.shortTitle,
    description: servicePage.heroDescription,
    url: `${SITE_URL}/${servicePage.slug}`,
    keywords: seoProfile.keywords.join(", "),
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoProfile.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} type="application/ld+json" />
      <PageHero
        breadcrumb={servicePage.shortTitle}
        description={servicePage.heroDescription}
        theme={servicePage.theme}
        title={servicePage.heroTitle}
      />

      <section className="section">
        <div className="container container-narrow">
          <div className="section-label">Présentation</div>
          <h2 className="section-title">
            {servicePage.timeline ? "Ce que nous faisons" : servicePage.shortTitle}
          </h2>
          <p className="section-lead">{servicePage.summary}</p>

          {servicePage.timeline ? (
            <>
              <h3 className="section-mini-title">Les 7 étapes de l’accompagnement</h3>
              <div className="timeline">
                {servicePage.timeline.map((step, index) => (
                  <div className="timeline-item" key={step.title}>
                    <div className="timeline-num">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="timeline-content">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {servicePage.infoBlocks ? (
            <div className="info-blocks single-column">
              {servicePage.infoBlocks.map((block) => (
                <div className="info-block" key={block.title}>
                  <span className="info-block-accent" />
                  <h3>{block.title}</h3>
                  <p>{block.description}</p>
                </div>
              ))}
            </div>
          ) : null}

          {servicePage.alert ? (
            <div className="alert-block mt-32">
              <div className="alert-block-icon">ℹ️</div>
              <div className="alert-block-text">
                <h4>{servicePage.alert.title}</h4>
                <p>{servicePage.alert.description}</p>
              </div>
            </div>
          ) : null}

          <div className="service-seo-deep-dive mt-32">
            <div className="service-seo-intro">
              <span className="service-seo-kicker">Référencement utile</span>
              <h3>Les recherches importantes autour de {servicePage.shortTitle}</h3>
              <p>
                Cette page répond aux intentions de recherche principales avant de vous orienter vers un diagnostic clair.
                L’objectif est simple : comprendre votre situation, identifier les documents importants et choisir la bonne prochaine étape.
              </p>
            </div>
            <div className="service-seo-keywords">
              {seoProfile.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
            </div>
            <div className="service-seo-grid">
              <div className="service-seo-card">
                <h4>Intentions à traiter</h4>
                <ul>
                  {seoProfile.intents.map((intent) => <li key={intent}>{intent}</li>)}
                </ul>
              </div>
              <div className="service-seo-card">
                <h4>Questions fréquentes</h4>
                {seoProfile.faq.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="service-seo-links">
              {seoProfile.relatedLinks.map((link) => (
                <ActionLink href={link.href} key={link.label} variant="outline">
                  {link.label}
                </ActionLink>
              ))}
            </div>
          </div>

          <div className="contact-wa-btns mt-32">
            <ActionLink
              href={`${servicePage.primaryCta.href}?source=service_page&intent=${servicePage.slug}`}
              variant={servicePage.primaryCta.variant}
              size="lg"
            >
              {servicePage.primaryCta.label}
            </ActionLink>
            <ActionLink
              external={servicePage.secondaryCta.external}
              href={servicePage.secondaryCta.href}
              variant={servicePage.secondaryCta.variant}
              size="lg"
            >
              {servicePage.secondaryCta.label}
            </ActionLink>
            <ActionLink
              href={`/paiement?service=${servicePage.slug}`}
              variant="green"
              size="lg"
            >
              Payer un acompte
            </ActionLink>
          </div>
        </div>
      </section>
    </>
  );
}
