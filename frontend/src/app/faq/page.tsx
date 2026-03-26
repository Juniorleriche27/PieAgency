import type { Metadata } from "next";
import { ActionLink } from "@/components/action-link";
import { FAQAccordion } from "@/components/faq-accordion";
import { PageHero } from "@/components/page-hero";
import { faqItems } from "@/content/site";

const visibleFaqItems = faqItems.map((item) =>
  item.question.toLowerCase().includes("whatsapp")
    ? {
        question: "Comment contacter PieAgency ?",
        answer:
          "Le formulaire du site et le chat PieAgency sont les deux canaux prevus pour prendre contact et etre oriente correctement.",
      }
    : item.question.toLowerCase().includes("comment d") ||
        item.question.toLowerCase().includes("comment dÃ©marrer")
      ? {
          ...item,
          answer:
            "Il suffit de remplir le formulaire de contact du site ou d'utiliser le chat. Un premier echange permet d'analyser le profil et d'identifier l'accompagnement adapte.",
        }
      : item,
);

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
          <FAQAccordion initialOpenIndex={0} items={visibleFaqItems} />
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
