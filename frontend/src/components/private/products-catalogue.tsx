"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CopilotBanner } from "@/components/private/copilot-banner";
import { useEffect, useState } from "react";
import {
  PRODUCT_CATEGORIES,
  getProducts,
  type Product,
  type ProductCategory,
} from "@/lib/private-products";

type Props = {
  products: Product[];
};

function badgeLabel(badge: Product["badge"]) {
  if (badge === "recommended") return "Recommandé";
  if (badge === "popular") return "Populaire";
  if (badge === "included") return "Inclus";
  return null;
}

export function ProductsCatalogue({ products }: Props) {
  const [liveProducts, setLiveProducts] = useState(products);
  const [category, setCategory] = useState<ProductCategory>("Tous");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const nextProducts = await getProducts();
      if (active) {
        setLiveProducts(nextProducts);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    category === "Tous"
      ? liveProducts
      : liveProducts.filter((p) => p.category === category);

  return (
    <div>
      <CopilotBanner />
      <div className="prod-page-head">
        <h1>Produits digitaux</h1>
        <p>
          Découvrez nos produits pour avancer avec méthode dans votre procédure
          d&apos;études.
        </p>
      </div>

      <div className="prod-filters" role="group" aria-label="Filtrer par catégorie">
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`prod-filter-btn${category === cat ? " active" : ""}`}
            onClick={() => setCategory(cat)}
            type="button"
            aria-pressed={category === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="prod-empty">
          <ShoppingBag size={44} aria-hidden />
          <h3>Aucun produit dans cette catégorie</h3>
          <p>Essayez une autre catégorie ou consultez tous nos produits.</p>
        </div>
      ) : (
        <div className="prod-grid">
          {filtered.map((product) => {
            const label = badgeLabel(product.badge);
            return (
              <Link
                key={product.id}
                className="prod-card"
                href={`/espace-etudiant/produits/${product.id}`}
                aria-label={`Voir ${product.title}`}
              >
                {label && product.badge ? (
                  <div className={`prod-card-badge ${product.badge}`}>{label}</div>
                ) : null}

                <div className="prod-card-body">
                  <h2 className="prod-card-title">{product.title}</h2>
                  <p className="prod-card-desc">{product.description}</p>

                  <div className="prod-card-meta-label">Pour qui ?</div>
                  <p className="prod-card-audience">{product.targetAudience}</p>

                  <div className="prod-card-meta-label">Ce que contient le produit</div>
                  <ul className="prod-card-items">
                    {product.whatYouGet.slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {product.whatYouGet.length > 3 && (
                      <li className="overflow">
                        +{product.whatYouGet.length - 3} autres éléments
                      </li>
                    )}
                  </ul>
                </div>

                <div className="prod-card-foot">
                  <div className="prod-price">
                    <strong>{product.price.toFixed(2)}</strong>
                    <span>€</span>
                  </div>
                  <div className="prod-card-actions">
                    <span className="btn btn-outline" role="presentation">
                      Voir le contenu
                    </span>
                    <span className="btn btn-primary" role="presentation">
                      Acheter
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="prod-tip">
        <strong>💡 Conseil :</strong> Ces produits vous aident à structurer votre
        dossier, préparer vos documents et éviter les erreurs fréquentes. Ils ne
        garantissent pas une admission, mais vous donnent une méthode claire pour
        avancer.
      </div>
    </div>
  );
}
