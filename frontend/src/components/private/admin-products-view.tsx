"use client";

import Link from "next/link";
import { Boxes, Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getProducts, type Product } from "@/lib/private-products";

function badgeLabel(badge?: Product["badge"]) {
  if (badge === "recommended") {
    return "Recommande";
  }
  if (badge === "popular") {
    return "Populaire";
  }
  if (badge === "included") {
    return "Inclus";
  }
  return "Standard";
}

function formatPrice(product: Product) {
  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: product.price % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(product.price);
}

export function AdminProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await getProducts();
        if (active) {
          setProducts(payload);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les produits.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return products;
    }

    return products.filter((product) =>
      [
        product.title,
        product.description,
        product.category,
        product.targetAudience,
        product.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [products, query]);

  return (
    <div className="admin-products-page">
      <section className="admin-products-hero">
        <div>
          <span>Catalogue admin</span>
          <h1>Produits digitaux</h1>
          <p>
            Vue interne des produits exposes dans l&apos;espace candidat. Les actions
            d&apos;edition seront activees quand le CRUD backend sera disponible.
          </p>
        </div>
        <div className="admin-products-count">
          <Boxes size={20} />
          <strong>{filteredProducts.length}</strong>
          <span>produit(s)</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-products-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par titre, categorie, slug..."
            type="search"
            value={query}
          />
        </label>
        <button className="btn btn-outline" disabled type="button">
          Nouveau produit
        </button>
      </section>

      <section className="admin-products-table-card">
        {isLoading ? (
          <div className="admin-products-loading">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredProducts.length ? (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Categorie</th>
                  <th>Prix</th>
                  <th>Badge</th>
                  <th>Slug paiement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.title}</strong>
                      <span>{product.description}</span>
                      <small>{product.targetAudience}</small>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product)}</td>
                    <td>
                      <span className={`admin-products-badge ${product.badge ?? "standard"}`}>
                        {badgeLabel(product.badge)}
                      </span>
                    </td>
                    <td>
                      <code>{product.id}</code>
                    </td>
                    <td>
                      <Link
                        aria-label={`Voir ${product.title}`}
                        href={`/espace-etudiant/produits/${product.id}`}
                      >
                        <Eye size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !filteredProducts.length ? (
          <div className="portal-empty">
            Aucun produit ne correspond a cette recherche.
          </div>
        ) : null}
      </section>
    </div>
  );
}
