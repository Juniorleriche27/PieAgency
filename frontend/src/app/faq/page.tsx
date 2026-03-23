import type { Metadata } from "next";
import { ActionLink } from "@/components/action-link";
import { FAQAccordion } from "@/components/faq-accordion";
import { PageHero } from "@/components/page-hero";
import { faqItems } from "@/content/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Les réponses aux questions fréquentes sur les accompagnements PieAgency.",
};

export default function FAQPage() {
  return (
    <>
      <PageHero
        breadcrumb="FAQ"
        description="Retrouvez les réponses aux questions les plus posées sur les accompagnements PieAgency."
        title="Questions fréquentes"
      />

      <section className="section">
        <div className="container container-faq">
          <FAQAccordion initialOpenIndex={0} items={faqItems} />
          <div className="text-center mt-32">
            <ActionLink href="/contact" variant="primary">
              Poser ma question directement
            </ActionLink>
          </div>
        </div>
      </section>
    </>
  );
}
