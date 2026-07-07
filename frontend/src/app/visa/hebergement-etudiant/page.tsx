import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLongFormPage } from "@/components/seo-long-form-page";
import { getSeoLongPage } from "@/lib/seo-long-pages";
import { SITE_URL } from "@/lib/seo";

const page = getSeoLongPage("visa/hebergement-etudiant");

export const metadata: Metadata = page
  ? {
      title: `${page.shortTitle} | Guide complet PieAgency`,
      description: page.description,
      keywords: page.keywords,
      alternates: { canonical: `/${page.slug}` },
      openGraph: {
        title: `${page.shortTitle} | PieAgency`,
        description: page.description,
        url: `${SITE_URL}/${page.slug}`,
        type: "article",
        siteName: "PieAgency",
        images: [{ url: "/pieagency-logo.jpg", width: 1200, height: 630, alt: `${page.shortTitle} PieAgency` }],
      },
    }
  : {};

export default function SeoLongPage() {
  if (!page) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    mainEntityOfPage: `${SITE_URL}/${page.slug}`,
    author: { "@type": "Organization", name: "PieAgency", url: SITE_URL },
    publisher: { "@type": "Organization", name: "PieAgency", logo: { "@type": "ImageObject", url: `${SITE_URL}/pieagency-logo.jpg` } },
    inLanguage: "fr-FR",
    keywords: page.keywords.join(", "),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: page.parentPath.includes("visa") ? "Visa" : "Campus France", item: `${SITE_URL}${page.parentPath}` },
      { "@type": "ListItem", position: 3, name: page.shortTitle, item: `${SITE_URL}/${page.slug}` },
    ],
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} type="application/ld+json" />
      <SeoLongFormPage page={page} />
    </>
  );
}
