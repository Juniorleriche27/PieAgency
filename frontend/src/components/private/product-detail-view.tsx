import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/private-products";

type Props = {
  product: Product;
};

function badgeLabel(badge: Product["badge"]) {
  if (badge === "recommended") return "Recommandé";
  if (badge === "popular") return "Populaire";
  if (badge === "included") return "Inclus";
  return null;
}

export function ProductDetailView({ product }: Props) {
  const label = badgeLabel(product.badge);

  return (
    <div>
      <Link className="prod-detail-back" href="/espace-etudiant/produits">
        <ArrowLeft size={18} aria-hidden />
        Retour aux produits
      </Link>

      <div className="prod-detail-head">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{product.title}</h1>
            <p>{product.description}</p>
          </div>
          {label && product.badge ? (
            <div
              className={`prod-card-badge ${product.badge}`}
              style={{ position: "static", flexShrink: 0 }}
            >
              {label}
            </div>
          ) : null}
        </div>

        <div className="prod-detail-price">
          <strong>{product.price.toFixed(2)}</strong>
          <span>€</span>
        </div>
      </div>

      <div className="prod-detail-layout">
        {/* Colonne principale */}
        <div className="prod-detail-main">
          <section className="prod-detail-section">
            <h2>Présentation</h2>
            <p>{product.longDescription}</p>
          </section>

          <section className="prod-detail-section">
            <h2>Ce que vous allez trouver</h2>
            <ul className="prod-detail-list">
              {product.whatYouGet.map((item, i) => (
                <li key={i}>
                  <CheckCircle2 size={18} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="prod-detail-section">
            <h2>À qui ce produit s&apos;adresse</h2>
            <p>{product.targetAudience}</p>
          </section>

          <section className="prod-detail-section">
            <h2>Aperçu des ressources incluses</h2>
            <div className="prod-preview-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="prod-preview-item">
                  <div className="prod-preview-icon" aria-hidden />
                  <p>Ressource {i}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar CTA */}
        <aside className="prod-detail-sidebar" aria-label="Acheter ce produit">
          <div className="prod-cta-card">
            <div className="prod-cta-head">
              <strong>{product.price.toFixed(2)} €</strong>
              <span>Accès illimité à toutes les ressources</span>
            </div>
            <div className="prod-cta-body">
              <ul className="prod-cta-benefits">
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Accès immédiat
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Mises à jour gratuites
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Support client
                </li>
              </ul>

              {/* TODO: brancher sur POST /payments/maketou/checkout quand disponible */}
              <button
                className="btn btn-primary"
                type="button"
                style={{ width: "100%", gap: 8 }}
              >
                <ShoppingCart size={16} aria-hidden />
                Acheter maintenant
              </button>

              <button
                className="btn btn-outline"
                type="button"
                style={{ width: "100%", gap: 8 }}
              >
                <CreditCard size={16} aria-hidden />
                S&apos;abonner
              </button>

              <div className="prod-cta-tip">
                <strong>💡 Conseil</strong>
                <br />
                Ce produit ne garantit pas une admission, mais vous donne une
                méthode claire pour avancer.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
