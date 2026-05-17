"use client";

import { Edit2, Plus, Search, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adminCreatePlan,
  adminDeletePlan,
  adminUpdatePlan,
  fetchPrivateSubscriptions,
  type PrivateSubscriptionPlan,
} from "@/lib/private-subscriptions";

type PlanFormData = {
  title: string;
  description: string;
  price: string;
  currency: string;
  billing_period: PrivateSubscriptionPlan["billing_period"];
  features: string;
  recommended: boolean;
  service_slug: string;
};

const EMPTY_FORM: PlanFormData = {
  title: "",
  description: "",
  price: "0",
  currency: "EUR",
  billing_period: "monthly",
  features: "",
  recommended: false,
  service_slug: "",
};

function planToForm(p: PrivateSubscriptionPlan): PlanFormData {
  return {
    title: p.title,
    description: p.description,
    price: String(p.price),
    currency: p.currency,
    billing_period: p.billing_period,
    features: p.features.join("\n"),
    recommended: p.recommended,
    service_slug: p.service_slug,
  };
}

function billingLabel(period: PrivateSubscriptionPlan["billing_period"]) {
  if (period === "one_time") return "Unique";
  if (period === "yearly") return "Annuel";
  return "Mensuel";
}

function formatPrice(plan: PrivateSubscriptionPlan) {
  if (plan.price === 0) return "Gratuit";
  return new Intl.NumberFormat("fr-FR", {
    currency: plan.currency,
    maximumFractionDigits: plan.price % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(plan.price);
}

function PlanModal({
  initialData,
  onClose,
  onSave,
  title,
}: {
  initialData: PlanFormData;
  onClose: () => void;
  onSave: (data: PlanFormData) => Promise<void>;
  title: string;
}) {
  const [form, setForm] = useState<PlanFormData>(initialData);
  const [saving, setSaving] = useState(false);

  function set(field: keyof PlanFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.service_slug.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="crud-overlay" onClick={onClose}>
      <div className="crud-modal admin-sub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-head">
          <h2>{title}</h2>
          <button className="crud-close" onClick={onClose} type="button"><X size={18} /></button>
        </div>

        <div className="crud-modal-body">
          <div className="crud-field">
            <label>Nom du plan *</label>
            <input onChange={(e) => set("title", e.target.value)} placeholder="Ex : Essentiel" type="text" value={form.title} />
          </div>
          <div className="crud-field">
            <label>Description</label>
            <input onChange={(e) => set("description", e.target.value)} placeholder="Pour avancer avec méthode" type="text" value={form.description} />
          </div>
          <div className="crud-field-row">
            <div className="crud-field">
              <label>Prix (€) *</label>
              <input min="0" onChange={(e) => set("price", e.target.value)} step="0.01" type="number" value={form.price} />
            </div>
            <div className="crud-field">
              <label>Cycle</label>
              <select onChange={(e) => set("billing_period", e.target.value)} value={form.billing_period}>
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
                <option value="one_time">Unique</option>
              </select>
            </div>
          </div>
          <div className="crud-field">
            <label>Slug paiement *</label>
            <input onChange={(e) => set("service_slug", e.target.value)} placeholder="essentiel-mensuel" type="text" value={form.service_slug} />
            <span className="crud-hint">Utilisé dans l&apos;URL de paiement Maketou</span>
          </div>
          <div className="crud-field">
            <label>Features (une par ligne)</label>
            <textarea
              onChange={(e) => set("features", e.target.value)}
              placeholder={"Guides pratiques\nChecklists détaillées\nModèles de base"}
              rows={5}
              value={form.features}
            />
          </div>
          <div className="crud-field crud-field-check">
            <label>
              <input
                checked={form.recommended}
                onChange={(e) => set("recommended", e.target.checked)}
                type="checkbox"
              />
              Marquer comme recommandé
            </label>
          </div>
        </div>

        <div className="crud-modal-foot">
          <button className="btn btn-ghost" onClick={onClose} type="button">Annuler</button>
          <button
            className="btn btn-primary"
            disabled={saving || !form.title.trim() || !form.service_slug.trim()}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSubscriptionsView() {
  const [plans, setPlans] = useState<PrivateSubscriptionPlan[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingPlan, setEditingPlan] = useState<PrivateSubscriptionPlan | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await fetchPrivateSubscriptions();
        if (active) setPlans(data);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Erreur de chargement.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) =>
      [p.title, p.description, p.service_slug, p.features.join(" ")].join(" ").toLowerCase().includes(q),
    );
  }, [plans, query]);

  async function handleCreate(form: PlanFormData) {
    const result = await adminCreatePlan({
      title: form.title,
      description: form.description,
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      billing_period: form.billing_period,
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      recommended: form.recommended,
      service_slug: form.service_slug,
    });
    if (result) setPlans((prev) => [...prev, result]);
    setShowAdd(false);
  }

  async function handleUpdate(form: PlanFormData) {
    if (!editingPlan) return;
    const parsed = {
      title: form.title,
      description: form.description,
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      billing_period: form.billing_period,
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      recommended: form.recommended,
      service_slug: form.service_slug,
    };
    setPlans((prev) => prev.map((p) => p.id === editingPlan.id ? { ...p, ...parsed } : p));
    setEditingPlan(null);
    await adminUpdatePlan(editingPlan.id, parsed);
  }

  async function handleDelete(planId: string) {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    setDeletingId(null);
    await adminDeletePlan(planId);
  }

  return (
    <div className="admin-subscriptions-page">
      <section className="admin-candidates-hero">
        <div>
          <span>Cockpit admin</span>
          <h1>Gestion des abonnements</h1>
          <p>Créez, modifiez et supprimez les plans visibles dans l&apos;espace candidat.</p>
        </div>
        <div className="admin-candidates-count">
          <ShieldCheck size={20} />
          <strong>{plans.length}</strong>
          <span>plan(s)</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-candidates-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, slug, feature..."
            type="search"
            value={query}
          />
        </label>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} type="button">
          <Plus size={17} /> Nouveau plan
        </button>
      </section>

      <section className="admin-candidates-table-card">
        {isLoading ? (
          <div className="admin-candidates-loading">
            {Array.from({ length: 4 }).map((_, i) => <span key={i} />)}
          </div>
        ) : null}

        {!isLoading && filteredPlans.length ? (
          <div className="admin-candidates-table-wrap">
            <table className="admin-candidates-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Prix</th>
                  <th>Cycle</th>
                  <th>Features</th>
                  <th>Slug</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.title}</strong>
                      <span>{plan.description}</span>
                      {plan.recommended ? (
                        <small className="admin-sub-recommended"><Star size={11} fill="currentColor" /> Recommandé</small>
                      ) : null}
                    </td>
                    <td><strong>{formatPrice(plan)}</strong></td>
                    <td>{billingLabel(plan.billing_period)}</td>
                    <td><span className="admin-candidates-chip">{plan.features.length} item(s)</span></td>
                    <td><code className="admin-sub-slug">{plan.service_slug}</code></td>
                    <td>
                      <span className={`admin-candidates-status ${plan.is_active ? "active" : "closed"}`}>
                        {plan.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-sub-actions">
                        <button className="crud-btn" onClick={() => setEditingPlan(plan)} title="Modifier" type="button">
                          <Edit2 size={14} />
                        </button>
                        {deletingId === plan.id ? (
                          <div className="admin-docs-confirm-del">
                            <span>Supprimer ?</span>
                            <button className="btn btn-danger" onClick={() => void handleDelete(plan.id)} type="button">Oui</button>
                            <button className="btn btn-ghost" onClick={() => setDeletingId(null)} type="button">Non</button>
                          </div>
                        ) : (
                          <button className="crud-btn delete" onClick={() => setDeletingId(plan.id)} title="Supprimer" type="button">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !filteredPlans.length ? (
          <div className="portal-empty">Aucun plan. Cliquez sur &quot;Nouveau plan&quot; pour commencer.</div>
        ) : null}
      </section>

      {showAdd ? (
        <PlanModal
          initialData={EMPTY_FORM}
          onClose={() => setShowAdd(false)}
          onSave={(data) => handleCreate(data)}
          title="Nouveau plan"
        />
      ) : null}

      {editingPlan ? (
        <PlanModal
          initialData={planToForm(editingPlan)}
          onClose={() => setEditingPlan(null)}
          onSave={(data) => handleUpdate(data)}
          title={`Modifier — ${editingPlan.title}`}
        />
      ) : null}
    </div>
  );
}
