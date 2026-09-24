"use client";

import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AssistantGenieTrigger } from "@/components/private/assistant-genie-trigger";
import { CopilotBanner } from "@/components/private/copilot-banner";
import { selectContextualProduct } from "@/lib/contextual-library";
import { formatEuro, formatEuroToXof } from "@/lib/currency";
import {
  PRODUCT_CATEGORIES,
  getProducts,
  type Product,
  type ProductCategory,
} from "@/lib/private-products";
import { fetchProgressivePath, type ProgressivePath } from "@/lib/progressive-path";

type Props = {
  products?: Product[];
};

function badgeLabel(badge: Product["badge"]) {
  if (badge === "recommended") return "Recommandé";
  if (badge === "popular") return "Populaire";
  if (badge === "included") return "Inclus";
  return null;
}

function ProductCard({ product }: { product: Product }) {
  const label = badgeLabel(product.badge);
  return (
    <Link
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
          {product.whatYouGet.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {product.whatYouGet.length > 3 ? (
            <li className="overflow">+{product.whatYouGet.length - 3} autres éléments</li>
          ) : null}
        </ul>
      </div>
      <div className="prod-card-foot">
        <div className="prod-price prod-price-dual">
          <strong>{formatEuro(product.price)}</strong>
          <span>{formatEuroToXof(product.price)}</span>
        </div>
        <div className="prod-card-actions">
          <span className="btn btn-outline" role="presentation">Voir le contenu</span>
          <span className="btn btn-primary" role="presentation">Acheter</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductsCatalogue({ products = [] }: Props) {
  const [liveProducts, setLiveProducts] = useState(products);
  const [path, setPath] = useState<ProgressivePath | null>(null);
  const [category, setCategory] = useState<ProductCategory>("Tous");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getProducts(), fetchProgressivePath()])
      .then(([nextProducts, pathData]) => {
        if (!active) return;
        setLiveProducts(nextProducts);
        setPath(pathData);
        setLoadError("");
      })
      .catch(() => {
        if (active) setLoadError("Impossible de charger les recommandations produits.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const contextualProduct = useMemo(
    () => selectContextualProduct(liveProducts, path),
    [liveProducts, path],
  );

  const filtered = useMemo(() => {
    const base = category === "Tous"
      ? liveProducts
      : liveProducts.filter((product) => product.category === category);
    if (!contextualProduct) return base;
    return base.filter((product) => product.id !== contextualProduct.product.id);
  }, [category, contextualProduct, liveProducts]);

  return (
    <div>
      <CopilotBanner />
      <div className="prod-page-head">
        <h1>Outils et produits utiles à votre parcours</h1>
        <p>
          PieAgency ne vous pousse pas un catalogue au hasard. Un produit est mis en avant uniquement
          lorsqu’il correspond à votre étape actuelle et à un besoin réel du dossier.
        </p>
      </div>

      {loadError ? <div className="portal-warning" role="alert">{loadError}</div> : null}
      {isLoading ? <div className="portal-empty">Chargement des recommandations…</div> : null}

      {!isLoading && path?.current_step ? (
        <section className="contextual-product-panel" aria-labelledby="product-now-title">
          <div className="contextual-library-heading">
            <div>
              <span><Sparkles size={15} /> Option utile pour votre étape actuelle</span>
              <h2 id="product-now-title">{path.current_step.title}</h2>
              <p>{path.current_step.next_action || path.current_step.objective}</p>
            </div>
          </div>

          {contextualProduct ? (
            <div className="contextual-product-card">
              <div className="contextual-product-main">
                <span className="contextual-product-label">Option payante facultative</span>
                <h3>{contextualProduct.product.title}</h3>
                <p>{contextualProduct.product.description}</p>
                <div className="contextual-library-explain">
                  <small>Pourquoi maintenant</small>
                  <p>{contextualProduct.reason}</p>
                </div>
                <div className="contextual-library-explain">
                  <small>Résultat attendu</small>
                  <p>{contextualProduct.expectedOutcome}</p>
                </div>
                {contextualProduct.blockers.length ? (
                  <div className="contextual-product-blockers">
                    <small>Peut aider sur</small>
                    <ul>
                      {contextualProduct.blockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="contextual-product-side">
                <div className="prod-price prod-price-dual">
                  <strong>{formatEuro(contextualProduct.product.price)}</strong>
                  <span>{formatEuroToXof(contextualProduct.product.price)}</span>
                </div>
                <Link className="btn btn-primary" href={`/espace-etudiant/produits/${contextualProduct.product.id}`}>
                  Voir ce produit
                </Link>
                <AssistantGenieTrigger
                  className="btn btn-outline"
                  message={`Dis-moi objectivement si le produit « ${contextualProduct.product.title} » est vraiment utile pour mon étape actuelle, compte tenu de mes blocages. Si je peux avancer sans l'acheter, dis-le clairement.`}
                  requestedAction="evaluate_contextual_product"
                >
                  Demander à Assistant PieAgency
                </AssistantGenieTrigger>
              </div>
            </div>
          ) : (
            <div className="portal-empty">
              Aucun produit payant n’est nécessaire pour avancer sur cette étape. Suivez d’abord l’action principale du parcours.
            </div>
          )}
        </section>
      ) : null}

      <section className="contextual-library-explore" aria-labelledby="product-library-title">
        <div className="contextual-library-section-head">
          <div>
            <span>Secondaire</span>
            <h2 id="product-library-title">Explorer d’autres outils</h2>
            <p>Ces produits restent disponibles, mais ils ne remplacent jamais les actions prioritaires de votre parcours.</p>
          </div>
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

        {!isLoading && filtered.length === 0 ? (
          <div className="prod-empty">
            <ShoppingBag size={44} aria-hidden />
            <h3>Aucun autre produit dans cette catégorie</h3>
            <p>Essayez une autre catégorie ou revenez à votre parcours.</p>
          </div>
        ) : !isLoading ? (
          <div className="prod-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      <div className="prod-tip">
        <strong>Principe PieAgency :</strong> un produit est un outil facultatif. Il ne garantit aucune admission
        et ne doit jamais être présenté comme obligatoire pour accomplir une procédure officielle.
      </div>
    </div>
  );
}
