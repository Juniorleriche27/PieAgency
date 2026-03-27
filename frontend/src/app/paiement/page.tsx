import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { PaymentForm } from "@/components/payment-form";

export const metadata: Metadata = {
  title: "Paiement",
  description:
    "Reglez un acompte ou un montant valide avec PieAgency via la passerelle MakeTou.",
};

export default function PaymentPage() {
  return (
    <>
      <PageHero
        breadcrumb="Paiement"
        description="Reglez uniquement un montant deja valide avec un conseiller PieAgency. Le paiement est initie en ligne et confirme sur votre moyen de paiement."
        title="Paiement en ligne"
        theme="navy"
      />

      <section className="section">
        <div className="container">
          <Suspense fallback={<div className="form-card payment-form-card">Chargement du paiement...</div>}>
            <PaymentForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
