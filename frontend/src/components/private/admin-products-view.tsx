"use client";

import { Boxes, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getStoredProducts, setStoredProducts } from "@/lib/admin-store";
import { getProducts, PRODUCT_CATEGORIES, type Product, type ProductBadge } from "@/lib/private-products";

function newId() {
  return `prod-${Date.now()}`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    style: "currency",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

const BADGE_OPTIONS: Array<{ value: ProductBadge | ""; label: string }> = [
  { value: "", label: "Aucun" },
  { value: "recommended", label: "Recommandé" },
  { value: "popular", label: "Populaire" },
  { value: "included", label: "Inclus" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  longDescription: "",
  targetAudience: "",
  whatYouGet: "",
  price: "",
  badge: "" as ProductBadge | "",
  category: PRODUCT_CATEGORIES[1] as string,
};

type FormState = typeof EMPTY_FORM;

function formToProduct(form: FormState, id: string): Product {
  return {
    id,
    title: form.title.trim(),
    description: form.description.trim(),
    longDescription: form.longDescription.trim() || form.description.trim(),
    targetAudience: form.targetAudience.trim(),
    whatYouGet: form.whatYouGet.split("\n").map((s) => s.trim()).filter(Boolean),
    price: parseFloat(form.price) || 0,
    badge: form.badge || undefined,
    category: form.category,
  };
}

function productToForm(p: Product): FormState {
  return {
    title: p.title,
    description: p.description,
    longDescription: p.longDescription,
    targetAudience: p.targetAudience,
    whatYouGet: p.whatYouGet.join("\n"),
    price: String(p.price),
    badge: p.badge ?? "",
    category: p.category,
  };
}

export function AdminProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  function save(all: Product[]) {
    setProducts(all);
    setStoredProducts(all);
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm(productToForm(p));
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      save(products.map((p) => (p.id === editingId ? formToProduct(form, editingId) : p)));
    } else {
      save([...products, formToProduct(form, newId())]);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    save(products.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="admin-products-page">
      <section className="admin-products-hero">
        <div>
          <span>Catalogue admin</span>
          <h1>Produits digitaux</h1>
          <p>Gérez les produits visibles dans l&apos;espace candidat.</p>
        </div>
        <div className="admin-products-count">
          <Boxes size={20} />
          <strong>{filtered.length}</strong>
          <span>produit(s)</span>
        </div>
      </section>

      <section className="admin-products-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            type="search"
            value={query}
          />
        </label>
        <button className="btn btn-primary" onClick={openNew} type="button">
          <Plus size={16} /> Nouveau produit
        </button>
      </section>

      <section className="admin-products-table-card">
        {isLoading ? (
          <div className="admin-products-loading">
            {Array.from({ length: 4 }).map((_, i) => <span key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="portal-empty">Aucun produit trouvé.</div>
        ) : (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Badge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <span>{p.description}</span>
                    </td>
                    <td>{p.category}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <span className={`admin-products-badge ${p.badge ?? "standard"}`}>
                        {BADGE_OPTIONS.find((b) => b.value === (p.badge ?? ""))?.label ?? "Aucun"}
                      </span>
                    </td>
                    <td>
                      <div className="crud-actions">
                        <button
                          className="crud-btn edit"
                          onClick={() => openEdit(p)}
                          title="Modifier"
                          type="button"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="crud-btn delete"
                          onClick={() => setDeleteId(p.id)}
                          title="Supprimer"
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal ? (
        <div className="crud-overlay" onClick={() => setShowModal(false)}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>{editingId ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button className="crud-close" onClick={() => setShowModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="crud-modal-body">
              <div className="crud-field">
                <label>Titre *</label>
                <input
                  onChange={(e) => field("title", e.target.value)}
                  placeholder="Ex : Kit Campus France complet"
                  type="text"
                  value={form.title}
                />
              </div>

              <div className="crud-field">
                <label>Description courte *</label>
                <input
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="Une phrase résumant le produit"
                  type="text"
                  value={form.description}
                />
              </div>

              <div className="crud-field">
                <label>Description longue</label>
                <textarea
                  onChange={(e) => field("longDescription", e.target.value)}
                  placeholder="Détails complets du produit..."
                  rows={3}
                  value={form.longDescription}
                />
              </div>

              <div className="crud-field">
                <label>Public cible</label>
                <input
                  onChange={(e) => field("targetAudience", e.target.value)}
                  placeholder="Ex : Étudiants préparant Campus France"
                  type="text"
                  value={form.targetAudience}
                />
              </div>

              <div className="crud-field">
                <label>Ce que vous obtenez (une ligne par élément)</label>
                <textarea
                  onChange={(e) => field("whatYouGet", e.target.value)}
                  placeholder={"Guide étape par étape\nModèles de documents\nChecklist complète"}
                  rows={4}
                  value={form.whatYouGet}
                />
              </div>

              <div className="crud-row">
                <div className="crud-field">
                  <label>Prix (€) *</label>
                  <input
                    min="0"
                    onChange={(e) => field("price", e.target.value)}
                    placeholder="29.99"
                    step="0.01"
                    type="number"
                    value={form.price}
                  />
                </div>

                <div className="crud-field">
                  <label>Badge</label>
                  <select
                    onChange={(e) => field("badge", e.target.value as ProductBadge | "")}
                    value={form.badge}
                  >
                    {BADGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="crud-field">
                  <label>Catégorie</label>
                  <select
                    onChange={(e) => field("category", e.target.value)}
                    value={form.category}
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="crud-modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} type="button">
                Annuler
              </button>
              <button
                className="btn btn-primary"
                disabled={!form.title.trim() || !form.price}
                onClick={handleSave}
                type="button"
              >
                {editingId ? "Enregistrer" : "Créer le produit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="crud-overlay" onClick={() => setDeleteId(null)}>
          <div className="crud-modal crud-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>Supprimer ce produit ?</h2>
              <button className="crud-close" onClick={() => setDeleteId(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              <p>Cette action est irréversible. Le produit sera retiré de l&apos;espace candidat.</p>
            </div>
            <div className="crud-modal-foot">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} type="button">
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteId)}
                type="button"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
