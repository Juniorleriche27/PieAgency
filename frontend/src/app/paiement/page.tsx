import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentForm } from "@/components/payment-form";

export const metadata: Metadata = {
  title: "Paiement",
  description:
    "Reglez un acompte ou un montant valide avec PieAgency via la passerelle MakeTou.",
};

export default function PaymentPage() {
  return (
    <section className="section-sm payment-page-section">
      <div className="container payment-page-container">
        <div className="payment-conversion-note">
          <span>Paiement sécurisé</span>
          <strong>Vous réglez uniquement après avoir identifié l’accompagnement adapté.</strong>
          <p>Après paiement, l’espace étudiant sert à suivre les prochaines étapes, documents et consignes.</p>
        </div>
        <Suspense fallback={<div className="form-card payment-form-card">Chargement du paiement...</div>}>
          <PaymentForm />
        </Suspense>
      </div>
    </section>
  );
}
