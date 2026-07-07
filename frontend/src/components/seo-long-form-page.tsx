import { ActionLink } from "@/components/action-link";
import type { SeoLongPage } from "@/lib/seo-long-pages";

type Props = {
  page: SeoLongPage;
};

export function SeoLongFormPage({ page }: Props) {
  return (
    <>
      <section className="seo-long-hero">
        <div className="container">
          <div className="seo-long-breadcrumb">
            <a href="/">Accueil</a>
            <span>/</span>
            <a href={page.parentPath}>{page.parentPath.includes("visa") ? "Visa" : "Campus France"}</a>
            <span>/</span>
            <strong>{page.shortTitle}</strong>
          </div>
          <div className="seo-long-hero-grid">
            <div>
              <span className="seo-long-eyebrow">Guide PieAgency</span>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
              <div className="seo-long-ctas">
                <ActionLink href={`/contact?source=seo_long_page&intent=${page.slug}`} variant="gold" size="lg">
                  {page.heroCta}
                </ActionLink>
                <ActionLink href={page.parentPath} variant="outlineWhite" size="lg">
                  Voir l’accompagnement complet
                </ActionLink>
              </div>
            </div>
            <aside className="seo-long-summary">
              <span>Pour qui ?</span>
              <p>{page.audience}</p>
              <strong>Objectif : transformer une recherche Google en dossier plus clair.</strong>
            </aside>
          </div>
        </div>
      </section>

      <section className="section seo-long-content-section">
        <div className="container seo-long-layout">
          <article className="seo-long-article">
            {page.sections.map((section) => (
              <section className="seo-long-section-card" key={section.title}>
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}

            <section className="seo-long-section-card">
              <h2>Checklist à vérifier</h2>
              <div className="seo-long-check-grid">
                {page.checklist.map((item) => (
                  <div key={item}>✓ {item}</div>
                ))}
              </div>
            </section>

            <section className="seo-long-section-card">
              <h2>Erreurs fréquentes à éviter</h2>
              <div className="seo-long-mistakes">
                {page.mistakes.map((item) => (
                  <div key={item}>⚠ {item}</div>
                ))}
              </div>
            </section>

            <section className="seo-long-section-card">
              <h2>Questions fréquentes</h2>
              <div className="seo-long-faq">
                {page.faq.map((item) => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>

          <aside className="seo-long-sidebar">
            <div className="seo-long-sidebar-card is-sticky">
              <span>Diagnostic</span>
              <h3>Votre cas dépend du profil, du pays, du budget et des délais.</h3>
              <p>PieAgency peut analyser votre situation et vous dire quoi corriger avant d’avancer.</p>
              <ActionLink href={`/contact?source=seo_long_sidebar&intent=${page.slug}`} variant="primary">
                Demander un diagnostic
              </ActionLink>
            </div>

            <div className="seo-long-sidebar-card">
              <span>Liens utiles</span>
              {page.related.map((item) => (
                <a className="seo-long-related-link" href={item.href} key={item.label}>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </a>
              ))}
            </div>

            <div className="seo-long-sidebar-card">
              <span>Mots-clés traités</span>
              <div className="seo-long-keywords">
                {page.keywords.map((keyword) => (
                  <em key={keyword}>{keyword}</em>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
