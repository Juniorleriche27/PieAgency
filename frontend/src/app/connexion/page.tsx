import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connexion aux espaces etudiant et admin de la plateforme PieAgency.",
};

export default function LoginPage() {
  return (
    <>
      <PageHero
        breadcrumb="Connexion"
        description="Accedez a votre espace personnel pour suivre les dossiers, les documents et l&apos;activite de la plateforme."
        title="Connexion a la plateforme"
      />

      <section className="section">
        <div className="container container-narrow">
          <Suspense fallback={<div className="portal-access-card">Chargement du formulaire...</div>}>
            <AuthForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
