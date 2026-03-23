import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionLink } from "@/components/action-link";
import { PageHero } from "@/components/page-hero";
import { getServicePage, servicePages } from "@/content/site";

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

  return {
    title: servicePage.shortTitle,
    description: servicePage.heroDescription,
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const servicePage = getServicePage(slug);

  if (!servicePage) {
    notFound();
  }

  return (
    <>
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

          <div className="contact-wa-btns mt-32">
            <ActionLink
              href={servicePage.primaryCta.href}
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
          </div>
        </div>
      </section>
    </>
  );
}
