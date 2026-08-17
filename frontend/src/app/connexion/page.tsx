import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Un compte PieAgency pour accéder à tous vos espaces et produits.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="central-auth-loading">Chargement sécurisé…</div>}>
        <AuthForm />
      </Suspense>
    </AuthLayout>
  );
}
