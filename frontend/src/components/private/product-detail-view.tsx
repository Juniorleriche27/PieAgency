"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getIncludedResources,
  getProduct,
  getProductAccess,
  type Product,
  type ProductAccess,
  type ProductIncludedResource,
} from "@/lib/private-products";
import { euroToXof, formatEuro, formatEuroToXof } from "@/lib/currency";

type Props = {
  product: Product;
};

function badgeLabel(badge: Product["badge"]) {
  if (badge === "recommended") return "Recommandé";
  if (badge === "popular") return "Populaire";
  if (badge === "included") return "Inclus";
  return null;
}

function resourceState(
  resource: ProductIncludedResource,
  unlockedResourceIds: Set<string>,
) {
  if (unlockedResourceIds.has(resource.id)) {
    return {
      label: "Débloquée",
      className: "is-unlocked",
      action: "Ouvrir",
      icon: <CheckCircle2 size={16} aria-hidden />,
    };
  }

  if (resource.status === "coming") {
    return {
      label: "En préparation",
      className: "is-coming",
      action: "Bientôt",
      icon: <Sparkles size={16} aria-hidden />,
    };
  }

  return {
    label: "Incluse après paiement",
    className: "is-locked",
    action: "Voir l’aperçu",
    icon: <LockKeyhole size={16} aria-hidden />,
  };
}

export function ProductDetailView({ product }: Props) {
  const [liveProduct, setLiveProduct] = useState(product);
  const [productAccess, setProductAccess] = useState<ProductAccess | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const label = badgeLabel(liveProduct.badge);
  const includedResources = getIncludedResources(liveProduct);
  const unlockedResourceIds = useMemo(
    () => new Set(productAccess?.unlocked_resource_ids ?? []),
    [productAccess?.unlocked_resource_ids],
  );
  const unlockedCount = includedResources.filter((resource) => unlockedResourceIds.has(resource.id)).length;
  const hasProductAccess = Boolean(productAccess?.has_access);
  const paymentAmountCfa = euroToXof(liveProduct.price);
  const paymentHref = `/paiement?service=${encodeURIComponent(
    liveProduct.serviceSlug ?? liveProduct.id,
  )}&amount=${encodeURIComponent(String(paymentAmountCfa))}&reason=${encodeURIComponent(
    `Paiement pour ${liveProduct.title}`,
  )}`;

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setIsCheckingAccess(true);
      const [nextProduct, access] = await Promise.all([
        getProduct(product.id),
        getProductAccess(product.id),
      ]);

      if (!active) {
        return;
      }

      if (nextProduct) {
        setLiveProduct(nextProduct);
      }
      setProductAccess(access);
      setIsCheckingAccess(false);
    }

    void loadProduct();
    return () => {
      active = false;
    };
  }, [product.id]);

  return (
    <div className="prod-premium-page">
      <Link className="prod-detail-back" href="/espace-etudiant/produits">
        <ArrowLeft size={18} aria-hidden />
        Retour aux produits
      </Link>

      <section className="prod-premium-hero">
        <div className="prod-premium-hero-copy">
          <div className="prod-premium-kicker">
            <Sparkles size={16} aria-hidden />
            Produit digital privé
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1>{liveProduct.title}</h1>
              <p>{liveProduct.description}</p>
            </div>
            {label && liveProduct.badge ? (
              <div className={`prod-card-badge ${liveProduct.badge}`} style={{ position: "static" }}>
                {label}
              </div>
            ) : null}
          </div>

          <div className="prod-premium-meta">
            <span>{includedResources.length} ressources incluses</span>
            <span>{hasProductAccess ? "Accès actif" : "Paiement unique"}</span>
            <span>Contenu privé protégé</span>
          </div>
        </div>

        <div className="prod-premium-price-card">
          <span>Prix</span>
          <strong>{formatEuro(liveProduct.price)}</strong>
          <em>{formatEuroToXof(liveProduct.price)}</em>
          <p>{hasProductAccess ? "Vous avez déjà accès à ce produit." : "Débloque toutes les ressources listées ci-dessous."}</p>
        </div>
      </section>

      <div className="prod-detail-layout">
        <div className="prod-detail-main">
          <section className="prod-detail-section prod-premium-section">
            <div className="prod-section-headline">
              <span>Présentation</span>
              <h2>Ce que ce produit vous permet de faire</h2>
            </div>
            <p>{liveProduct.longDescription}</p>
          </section>

          <section className="prod-detail-section prod-premium-section">
            <div className="prod-section-headline">
              <span>Contenu</span>
              <h2>Ce que vous allez trouver</h2>
            </div>
            <ul className="prod-detail-list prod-premium-list">
              {liveProduct.whatYouGet.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="prod-detail-section prod-premium-section">
            <div className="prod-section-headline">
              <span>Profil</span>
              <h2>À qui ce produit s’adresse</h2>
            </div>
            <p>{liveProduct.targetAudience}</p>
          </section>

          <section className="prod-detail-section prod-premium-section">
            <div className="prod-section-headline">
              <span>Ressources incluses</span>
              <h2>Une bibliothèque privée, pas un fichier à partager</h2>
            </div>
            <p>
              Chaque ressource s’ouvre dans l’espace étudiant. Les aperçus restent visibles,
              puis l’accès complet se débloque automatiquement après paiement confirmé.
            </p>

            <div className="prod-premium-resource-grid">
              {includedResources.map((resource) => {
                const state = resourceState(resource, unlockedResourceIds);
                const content = (
                  <div className={`prod-premium-resource ${state.className}`}>
                    <div className="prod-premium-resource-top">
                      <span className="prod-premium-resource-icon">{state.icon}</span>
                      <span className="prod-premium-resource-status">{state.label}</span>
                    </div>
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                    <div className="prod-premium-resource-foot">
                      <span>{resource.category}</span>
                      <strong>
                        {state.action}
                        {resource.href && resource.status === "ready" ? <ArrowRight size={14} aria-hidden /> : null}
                      </strong>
                    </div>
                  </div>
                );

                return resource.href && resource.status === "ready" ? (
                  <Link key={resource.id} href={resource.href} className="prod-premium-resource-link">
                    {content}
                  </Link>
                ) : (
                  <div key={resource.id}>{content}</div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="prod-detail-sidebar" aria-label="Acheter ce produit">
          <div className="prod-cta-card prod-premium-cta">
            <div className="prod-cta-head">
              <span>{hasProductAccess ? "Accès actif" : "Accès produit"}</span>
              <strong>{formatEuro(liveProduct.price)}</strong>
              <em>{formatEuroToXof(liveProduct.price)}</em>
              <p>
                {isCheckingAccess
                  ? "Vérification de vos droits…"
                  : hasProductAccess
                    ? `${unlockedCount}/${includedResources.length} ressources débloquées.`
                    : `${includedResources.length} ressources incluses après paiement.`}
              </p>
            </div>

            <div className="prod-cta-body">
              <div className="prod-access-meter" aria-label="Progression des ressources débloquées">
                <span style={{ width: `${includedResources.length ? (unlockedCount / includedResources.length) * 100 : 0}%` }} />
              </div>

              <ul className="prod-cta-benefits">
                <li>
                  <ShieldCheck size={16} aria-hidden />
                  Activation liée à votre compte
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Ressources consultables dans l’espace étudiant
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Mises à jour incluses
                </li>
              </ul>

              {hasProductAccess ? (
                <Link className="btn btn-primary" style={{ width: "100%", gap: 8 }} href="/espace-etudiant/ressources">
                  <ShoppingCart size={16} aria-hidden />
                  Ouvrir mes ressources
                </Link>
              ) : (
                <Link className="btn btn-primary" style={{ width: "100%", gap: 8 }} href={paymentHref}>
                  <ShoppingCart size={16} aria-hidden />
                  Acheter et débloquer
                </Link>
              )}

              <Link className="btn btn-outline" style={{ width: "100%", gap: 8 }} href="/espace-etudiant/abonnement">
                <CreditCard size={16} aria-hidden />
                Voir les abonnements
              </Link>

              {productAccess?.message ? (
                <div className={`prod-cta-tip ${hasProductAccess ? "is-success" : ""}`}>
                  <strong>{hasProductAccess ? "✅ Accès actif" : "ℹ️ État d’accès"}</strong>
                  <br />
                  {productAccess.message}
                </div>
              ) : null}

              <div className="prod-cta-tip">
                <strong>Après paiement</strong>
                <br />
                Revenez sur la page paiement pour vérifier MakeTou. Les ressources incluses
                sont ensuite activées côté backend sur votre compte.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
