"use client";

import {
  Archive,
  Boxes,
  CheckCircle2,
  Eye,
  LinkIcon,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { setStoredProducts } from "@/lib/admin-store";
import {
  getIncludedResources,
  getProducts,
  PRODUCT_CATEGORIES,
  type Product,
  type ProductBadge,
  type ProductPublicationStatus,
} from "@/lib/private-products";

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

const STATUS_OPTIONS: Array<{ value: ProductPublicationStatus; label: string }> = [
  { value: "published", label: "Publié" },
  { value: "draft", label: "Brouillon" },
  { value: "archived", label: "Archivé" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  longDescription: "",
  targetAudience: "",
  whatYouGet: "",
  price: "",
  futurePrice: "",
  badge: "" as ProductBadge | "",
  category: PRODUCT_CATEGORIES[1] as string,
  serviceSlug: "",
  includedResourceIds: "",
  publicationStatus: "published" as ProductPublicationStatus,
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

function productPublicationStatus(product: Product): ProductPublicationStatus {
  if (product.publicationStatus) return product.publicationStatus;
  return product.isActive === false ? "archived" : "published";
}

function formToProduct(form: FormState, id: string, previous?: Product): Product {
  return {
    ...previous,
    id,
    title: form.title.trim(),
    description: form.description.trim(),
    longDescription: form.longDescription.trim() || form.description.trim(),
    targetAudience: form.targetAudience.trim(),
    whatYouGet: form.whatYouGet.split("\n").map((s) => s.trim()).filter(Boolean),
    price: parseFloat(form.price) || 0,
    futurePrice: form.futurePrice.trim() ? parseFloat(form.futurePrice) || null : null,
    badge: form.badge || undefined,
    category: form.category,
    serviceSlug: form.serviceSlug.trim() || previous?.serviceSlug || id,
    includedResourceIds: form.includedResourceIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    publicationStatus: form.publicationStatus,
    isActive: form.publicationStatus !== "archived" && form.isActive,
  };
}

function productToForm(product: Product): FormState {
  const status = productPublicationStatus(product);
  return {
    title: product.title,
    description: product.description,
    longDescription: product.longDescription,
    targetAudience: product.targetAudience,
    whatYouGet: product.whatYouGet.join("\n"),
    price: String(product.price),
    futurePrice: product.futurePrice != null ? String(product.futurePrice) : "",
    badge: product.badge ?? "",
    category: product.category,
    serviceSlug: product.serviceSlug ?? product.id,
    includedResourceIds: (product.includedResourceIds ?? []).join(", "),
    publicationStatus: status,
    isActive: product.isActive !== false && status !== "archived",
  };
}

export function AdminProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductPublicationStatus | "">("");
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

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm(productToForm(product));
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      save(products.map((product) => (
        product.id === editingId ? formToProduct(form, editingId, product) : product
      )));
    } else {
      const id = newId();
      save([...products, formToProduct(form, id)]);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    save(products.filter((product) => product.id !== id));
    setDeleteId(null);
  }

  function toggleActive(product: Product) {
    const nextIsActive = product.isActive === false;
    save(products.map((item) => (
      item.id === product.id
        ? {
            ...item,
            isActive: nextIsActive,
            publicationStatus: nextIsActive ? "published" : "archived",
          }
        : item
    )));
  }

  function archiveProduct(product: Product) {
    save(products.map((item) => (
      item.id === product.id
        ? { ...item, isActive: false, publicationStatus: "archived" }
        : item
    )));
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const status = productPublicationStatus(product);
      if (statusFilter && status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return `${product.title} ${product.description} ${product.category} ${product.serviceSlug ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [products, query, statusFilter]);

  const stats = useMemo(() => {
    const published = products.filter((product) => productPublicationStatus(product) === "published").length;
    const archived = products.filter((product) => productPublicationStatus(product) === "archived").length;
    const linkedResources = products.reduce((total, product) => total + (product.includedResourceIds?.length ?? 0), 0);
    const futurePrices = products.filter((product) => product.futurePrice != null).length;
    return { published, archived, linkedResources, futurePrices };
  }, [products]);

  return (
    <div className="admin-products-page admin-products-control-page">
      <section className="admin-products-hero admin-products-control-hero">
        <div>
          <span>Catalogue admin</span>
          <h1>Produits digitaux</h1>
          <p>
            Pilotez les produits vendus, les ressources débloquées, les futurs prix
            et la publication du catalogue privé.
          </p>
        </div>
        <div className="admin-products-count">
          <Boxes size={20} />
          <strong>{filtered.length}</strong>
          <span>produit(s)</span>
        </div>
      </section>

      <section className="admin-products-metrics">
        <div><strong>{stats.published}</strong><span>publié(s)</span></div>
        <div><strong>{stats.archived}</strong><span>archivé(s)</span></div>
        <div><strong>{stats.linkedResources}</strong><span>ressource(s) liées</span></div>
        <div><strong>{stats.futurePrices}</strong><span>prix futur(s)</span></div>
      </section>

      <section className="admin-products-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un produit, slug, catégorie..."
            type="search"
            value={query}
          />
        </label>
        <select
          className="admin-products-filter"
          onChange={(event) => setStatusFilter(event.target.value as ProductPublicationStatus | "")}
          value={statusFilter}
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={openNew} type="button">
          <Plus size={16} /> Nouveau produit
        </button>
      </section>

      <section className="admin-products-table-card">
        {isLoading ? (
          <div className="admin-products-loading">
            {Array.from({ length: 4 }).map((_, index) => <span key={index} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="portal-empty">Aucun produit trouvé.</div>
        ) : (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table admin-products-control-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Statut</th>
                  <th>Prix</th>
                  <th>Ressources liées</th>
                  <th>Badge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = productPublicationStatus(product);
                  const linkedResources = getIncludedResources(product);
                  return (
                    <tr key={product.id} className={status === "archived" ? "is-muted" : ""}>
                      <td>
                        <strong>{product.title}</strong>
                        <span>{product.description}</span>
                        <code>{product.serviceSlug ?? product.id}</code>
                      </td>
                      <td>
                        <span className={`admin-product-status is-${status}`}>
                          {STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status}
                        </span>
                        <small>{product.isActive === false ? "Inactif" : "Actif"}</small>
                      </td>
                      <td>
                        <strong>{formatPrice(product.price)}</strong>
                        {product.futurePrice != null ? (
                          <small>Futur : {formatPrice(product.futurePrice)}</small>
                        ) : (
                          <small>Pas de futur prix</small>
                        )}
                      </td>
                      <td>
                        <div className="admin-linked-resources">
                          {linkedResources.length ? linkedResources.map((resource) => (
                            <span key={resource.id}>{resource.title}</span>
                          )) : <small>Aucune ressource liée</small>}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-products-badge ${product.badge ?? "standard"}`}>
                          {BADGE_OPTIONS.find((badge) => badge.value === (product.badge ?? ""))?.label ?? "Aucun"}
                        </span>
                      </td>
                      <td>
                        <div className="crud-actions">
                          <button
                            className="crud-btn edit"
                            onClick={() => openEdit(product)}
                            title="Modifier"
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="crud-btn"
                            onClick={() => toggleActive(product)}
                            title={product.isActive === false ? "Publier" : "Désactiver"}
                            type="button"
                          >
                            {product.isActive === false ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                          </button>
                          <button
                            className="crud-btn"
                            onClick={() => archiveProduct(product)}
                            title="Archiver"
                            type="button"
                          >
                            <Archive size={15} />
                          </button>
                          <button
                            className="crud-btn delete"
                            onClick={() => setDeleteId(product.id)}
                            title="Supprimer"
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal ? (
        <div className="crud-overlay" onClick={() => setShowModal(false)}>
          <div className="crud-modal" onClick={(event) => event.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>{editingId ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button className="crud-close" onClick={() => setShowModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="crud-modal-body">
              <div className="crud-row">
                <div className="crud-field">
                  <label>Titre *</label>
                  <input onChange={(event) => field("title", event.target.value)} type="text" value={form.title} />
                </div>
                <div className="crud-field">
                  <label>Slug paiement</label>
                  <input onChange={(event) => field("serviceSlug", event.target.value)} placeholder="prod-001" type="text" value={form.serviceSlug} />
                </div>
              </div>

              <div className="crud-field">
                <label>Description courte *</label>
                <input onChange={(event) => field("description", event.target.value)} type="text" value={form.description} />
              </div>

              <div className="crud-field">
                <label>Description longue</label>
                <textarea onChange={(event) => field("longDescription", event.target.value)} rows={3} value={form.longDescription} />
              </div>

              <div className="crud-field">
                <label>Public cible</label>
                <input onChange={(event) => field("targetAudience", event.target.value)} type="text" value={form.targetAudience} />
              </div>

              <div className="crud-row">
                <div className="crud-field">
                  <label>Prix actuel</label>
                  <input min="0" onChange={(event) => field("price", event.target.value)} step="0.01" type="number" value={form.price} />
                </div>
                <div className="crud-field">
                  <label>Prix futur</label>
                  <input min="0" onChange={(event) => field("futurePrice", event.target.value)} placeholder="Optionnel" step="0.01" type="number" value={form.futurePrice} />
                </div>
                <div className="crud-field">
                  <label>Statut</label>
                  <select onChange={(event) => field("publicationStatus", event.target.value as ProductPublicationStatus)} value={form.publicationStatus}>
                    {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="crud-row">
                <div className="crud-field">
                  <label>Catégorie</label>
                  <select onChange={(event) => field("category", event.target.value)} value={form.category}>
                    {PRODUCT_CATEGORIES.filter((category) => category !== "Tous").map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="crud-field">
                  <label>Badge</label>
                  <select onChange={(event) => field("badge", event.target.value as ProductBadge | "")} value={form.badge}>
                    {BADGE_OPTIONS.map((badge) => <option key={badge.value || "none"} value={badge.value}>{badge.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="crud-field">
                <label>Ressources liées</label>
                <input
                  onChange={(event) => field("includedResourceIds", event.target.value)}
                  placeholder="res-001, res-003, res-004"
                  type="text"
                  value={form.includedResourceIds}
                />
                <span className="crud-hint">IDs séparés par des virgules. Ces ressources sont débloquées après paiement.</span>
              </div>

              <div className="crud-field">
                <label>Ce que le produit contient</label>
                <textarea onChange={(event) => field("whatYouGet", event.target.value)} rows={5} value={form.whatYouGet} />
                <span className="crud-hint">Une ligne par élément.</span>
              </div>

              <label className="admin-toggle-row">
                <input
                  checked={form.isActive}
                  onChange={(event) => field("isActive", event.target.checked)}
                  type="checkbox"
                />
                <span>Produit actif dans le catalogue privé</span>
              </label>
            </div>

            <div className="crud-modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} type="button">
                Annuler
              </button>
              <button className="btn btn-primary" disabled={!form.title.trim() || !form.description.trim()} onClick={handleSave} type="button">
                {editingId ? "Enregistrer" : "Créer le produit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="crud-overlay" onClick={() => setDeleteId(null)}>
          <div className="crud-modal crud-modal-sm" onClick={(event) => event.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>Supprimer ce produit ?</h2>
              <button className="crud-close" onClick={() => setDeleteId(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              <p>Cette action retire le produit du catalogue local admin.</p>
            </div>
            <div className="crud-modal-foot">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)} type="button">
                Annuler
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} type="button">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
