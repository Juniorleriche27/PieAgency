"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Target, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getPrivateDiagnostic,
  type PrivateDiagnosticResult,
} from "@/lib/private-diagnostic";
import { getProduct, type Product } from "@/lib/private-products";

export function PrivateDiagnosticView() {
  const [diagnostic, setDiagnostic] = useState<PrivateDiagnosticResult | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDiagnostic() {
      const nextDiagnostic = await getPrivateDiagnostic();
      const nextProducts = (
        await Promise.all(
          nextDiagnostic.recommendedProducts.map((productId) => getProduct(productId)),
        )
      ).filter((product): product is Product => Boolean(product));

      if (!active) {
        return;
      }

      setDiagnostic(nextDiagnostic);
      setRecommendedProducts(nextProducts);
    }

    void loadDiagnostic();
    return () => {
      active = false;
    };
  }, []);

  if (!diagnostic) {
    return (
      <div className="private-diagnostic-page">
        <section className="private-diagnostic-hero">
          <div className="private-diagnostic-icon">
            <CheckCircle2 size={34} />
          </div>
          <div>
            <span>Diagnostic candidat</span>
            <h1>Chargement du parcours</h1>
            <p>Nous recuperons vos donnees pour preparer une recommandation.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="private-diagnostic-page">
      <section className="private-diagnostic-hero">
        <div className="private-diagnostic-icon">
          <CheckCircle2 size={34} />
        </div>
        <div>
          <span>Diagnostic candidat</span>
          <h1>Votre parcours recommande</h1>
          <p>
            A partir de votre profil, voici les points a traiter en priorite pour
            avancer avec plus de methode.
          </p>
        </div>
      </section>

      <div className="private-diagnostic-grid">
        <article className="private-diagnostic-card">
          <div className="private-diagnostic-card-title">
            <Target size={20} />
            <h2>Priorite actuelle</h2>
          </div>
          <strong>{diagnostic.currentPriority}</strong>
          <p>Concentrez-vous sur cette etape pour progresser efficacement.</p>
        </article>

        <article className="private-diagnostic-card risk">
          <div className="private-diagnostic-card-title">
            <AlertTriangle size={20} />
            <h2>Risque principal</h2>
          </div>
          <strong>{diagnostic.mainRisk}</strong>
          <p>Ce point doit etre corrige avant de multiplier les candidatures.</p>
        </article>
      </div>

      <section className="private-diagnostic-next">
        <div>
          <div className="private-diagnostic-card-title">
            <Zap size={20} />
            <h2>Prochaine action conseillee</h2>
          </div>
          <p>{diagnostic.nextAction}</p>
        </div>
        <Link className="btn btn-green" href="/espace-etudiant/ressources">
          Acceder aux ressources
          <ArrowRight size={17} />
        </Link>
      </section>

      <section className="private-diagnostic-section">
        <div className="private-diagnostic-section-head">
          <span>Recommandations</span>
          <h2>Produits utiles pour vous</h2>
        </div>

        <div className="private-diagnostic-products">
          {recommendedProducts.map((product) => (
            <Link
              className="private-diagnostic-product"
              href={`/espace-etudiant/produits/${product.id}`}
              key={product.id}
            >
              <div>
                <span>{product.category}</span>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
              </div>
              <strong>{product.price} EUR</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="private-diagnostic-section">
        <div className="private-diagnostic-section-head">
          <span>Checklist adaptee</span>
          <h2>Ordre de travail recommande</h2>
        </div>

        <div className="private-diagnostic-checklist">
          {diagnostic.adaptedChecklist.map((item, index) => (
            <div className="private-diagnostic-check" key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="private-diagnostic-actions">
        <Link className="btn btn-primary" href="/espace-etudiant">
          Voir mon tableau de bord
        </Link>
        <Link className="btn btn-outline" href="/espace-etudiant/assistant">
          Poser une question a l&apos;assistant
        </Link>
      </section>
    </div>
  );
}
