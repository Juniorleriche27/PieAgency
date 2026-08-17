"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("pie-theme");
    document.documentElement.setAttribute(
      "data-theme",
      storedTheme === "dark" ? "dark" : "light",
    );
  }, []);

  return (
    <main className="central-auth-page">
      <div className="central-auth-shell">
        <Link className="central-auth-brand" href="/" aria-label="Retour à PieAgency">
          <Image
            src="/pieagency-logo.jpg"
            alt="PieAgency"
            width={64}
            height={64}
            priority
          />
          <div>
            <span className="central-auth-brand-name">PieAgency</span>
            <span className="central-auth-brand-subtitle">Un compte. Tous vos espaces.</span>
          </div>
        </Link>

        <section className="central-auth-panel" aria-label="Authentification PieAgency">
          {children}
        </section>

        <div className="central-auth-footer">
          <span>Connexion sécurisée PieAgency</span>
          <span aria-hidden="true">•</span>
          <span>Compte central PieAgency</span>
        </div>
      </div>
    </main>
  );
}
