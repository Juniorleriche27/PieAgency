"use client";

import {
  BookOpen,
  CheckSquare,
  FileText,
  Lightbulb,
  LinkIcon,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getStoredResources, setStoredResources } from "@/lib/admin-store";
import {
  fetchPrivateResources,
  RESOURCE_CATEGORIES,
  type PrivateResource,
  type PrivateResourceType,
} from "@/lib/private-resources";

const TYPE_LABELS: Record<PrivateResourceType, string> = {
  guide: "Guide",
  template: "Modèle",
  video: "Vidéo",
  checklist: "Checklist",
  example: "Exemple",
  exercise: "Exercice",
  link: "Lien",
};

const TYPE_ICONS: Record<PrivateResourceType, React.ElementType> = {
  guide: BookOpen,
  template: FileText,
  video: PlayCircle,
  checklist: CheckSquare,
  example: Lightbulb,
  exercise: Wrench,
  link: LinkIcon,
};

const ACCESS_LABELS: Record<PrivateResource["access_level"], string> = {
  free: "Gratuit",
  student: "Étudiant",
  premium: "Premium",
};

function newId() {
  return `res-${Date.now()}`;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  category: RESOURCE_CATEGORIES[1] as string,
  resource_type: "guide" as PrivateResourceType,
  badge_label: "Guide PDF",
  action_label: "Télécharger",
  duration_label: "",
  access_level: "free" as PrivateResource["access_level"],
  url: "",
};

type FormState = typeof EMPTY_FORM;

function formToResource(f: FormState, id: string): PrivateResource {
  return {
    id,
    title: f.title.trim(),
    description: f.description.trim(),
    category: f.category,
    resource_type: f.resource_type,
    badge_label: f.badge_label.trim() || TYPE_LABELS[f.resource_type],
    action_label: f.action_label,
    duration_label: f.duration_label.trim() || null,
    access_level: f.access_level,
    url: f.url.trim() || null,
  };
}

function resourceToForm(r: PrivateResource): FormState {
  return {
    title: r.title,
    description: r.description,
    category: r.category,
    resource_type: r.resource_type,
    badge_label: r.badge_label,
    action_label: r.action_label,
    duration_label: r.duration_label ?? "",
    access_level: r.access_level,
    url: r.url ?? "",
  };
}

export function AdminResourcesView() {
  const [resources, setResources] = useState<PrivateResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<PrivateResourceType | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrivateResources().then((data) => {
      setResources(data);
      setIsLoading(false);
    });
  }, []);

  function save(all: PrivateResource[]) {
    setResources(all);
    setStoredResources(all);
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(r: PrivateResource) {
    setEditingId(r.id);
    setForm(resourceToForm(r));
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      save(resources.map((r) => (r.id === editingId ? formToResource(form, editingId) : r)));
    } else {
      save([...resources, formToResource(form, newId())]);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    save(resources.filter((r) => r.id !== id));
    setDeleteId(null);
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (filterType && r.resource_type !== filterType) return false;
      if (q && !`${r.title} ${r.description} ${r.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, query, filterType]);

  return (
    <div className="admin-res-page">
      <section className="admin-res-hero">
        <div>
          <span>Catalogue admin</span>
          <h1>Ressources privées</h1>
          <p>Gérez les ressources visibles dans l&apos;espace candidat.</p>
        </div>
        <div className="admin-res-count">
          <BookOpen size={20} />
          <strong>{filtered.length}</strong>
          <span>ressource(s)</span>
        </div>
      </section>

      <section className="admin-res-toolbar">
        <label className="admin-res-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className="admin-res-filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PrivateResourceType | "")}
        >
          <option value="">Tous les types</option>
          {(Object.keys(TYPE_LABELS) as PrivateResourceType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <button className="btn btn-primary" onClick={openNew} type="button">
          <Plus size={16} /> Nouvelle ressource
        </button>
      </section>

      <section className="admin-res-table-card">
        {isLoading ? (
          <div className="admin-res-loading">
            {Array.from({ length: 5 }).map((_, i) => <span key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="portal-empty">Aucune ressource trouvée.</div>
        ) : (
          <div className="admin-res-table-wrap">
            <table className="admin-res-table">
              <thead>
                <tr>
                  <th>Ressource</th>
                  <th>Catégorie</th>
                  <th>Type</th>
                  <th>Accès</th>
                  <th>URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const Icon = TYPE_ICONS[r.resource_type];
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.title}</strong>
                        <span>{r.description}</span>
                      </td>
                      <td>{r.category}</td>
                      <td>
                        <span className="admin-res-type-badge">
                          <Icon size={13} aria-hidden />
                          {TYPE_LABELS[r.resource_type]}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-res-access admin-res-access-${r.access_level}`}>
                          {ACCESS_LABELS[r.access_level]}
                        </span>
                      </td>
                      <td>
                        {r.url ? (
                          <a
                            className="admin-res-link"
                            href={r.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Ouvrir
                          </a>
                        ) : (
                          <span className="admin-res-no-link">—</span>
                        )}
                      </td>
                      <td>
                        <div className="crud-actions">
                          <button
                            className="crud-btn edit"
                            onClick={() => openEdit(r)}
                            title="Modifier"
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="crud-btn delete"
                            onClick={() => setDeleteId(r.id)}
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
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>{editingId ? "Modifier la ressource" : "Nouvelle ressource"}</h2>
              <button className="crud-close" onClick={() => setShowModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="crud-modal-body">
              <div className="crud-field">
                <label>Titre *</label>
                <input
                  onChange={(e) => field("title", e.target.value)}
                  placeholder="Ex : Guide complet Campus France"
                  type="text"
                  value={form.title}
                />
              </div>

              <div className="crud-field">
                <label>Description *</label>
                <input
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="Une phrase résumant la ressource"
                  type="text"
                  value={form.description}
                />
              </div>

              <div className="crud-row">
                <div className="crud-field">
                  <label>Catégorie</label>
                  <select
                    onChange={(e) => field("category", e.target.value)}
                    value={form.category}
                  >
                    {RESOURCE_CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="crud-field">
                  <label>Type</label>
                  <select
                    onChange={(e) => field("resource_type", e.target.value as PrivateResourceType)}
                    value={form.resource_type}
                  >
                    {(Object.keys(TYPE_LABELS) as PrivateResourceType[]).map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <div className="crud-field">
                  <label>Accès</label>
                  <select
                    onChange={(e) => field("access_level", e.target.value as PrivateResource["access_level"])}
                    value={form.access_level}
                  >
                    <option value="free">Gratuit</option>
                    <option value="student">Étudiant</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div className="crud-row">
                <div className="crud-field">
                  <label>Label badge</label>
                  <input
                    onChange={(e) => field("badge_label", e.target.value)}
                    placeholder="Ex : Guide PDF"
                    type="text"
                    value={form.badge_label}
                  />
                </div>

                <div className="crud-field">
                  <label>Bouton action</label>
                  <select
                    onChange={(e) => field("action_label", e.target.value)}
                    value={form.action_label}
                  >
                    <option value="Télécharger">Télécharger</option>
                    <option value="Regarder">Regarder</option>
                    <option value="Ouvrir">Ouvrir</option>
                  </select>
                </div>

                <div className="crud-field">
                  <label>Durée (ex : 15 min)</label>
                  <input
                    onChange={(e) => field("duration_label", e.target.value)}
                    placeholder="Optionnel, pour les vidéos"
                    type="text"
                    value={form.duration_label}
                  />
                </div>
              </div>

              <div className="crud-field">
                <label>URL du fichier / lien</label>
                <input
                  onChange={(e) => field("url", e.target.value)}
                  placeholder="https://... (laisser vide si pas encore disponible)"
                  type="url"
                  value={form.url}
                />
              </div>
            </div>

            <div className="crud-modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} type="button">
                Annuler
              </button>
              <button
                className="btn btn-primary"
                disabled={!form.title.trim() || !form.description.trim()}
                onClick={handleSave}
                type="button"
              >
                {editingId ? "Enregistrer" : "Créer la ressource"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="crud-overlay" onClick={() => setDeleteId(null)}>
          <div className="crud-modal crud-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>Supprimer cette ressource ?</h2>
              <button className="crud-close" onClick={() => setDeleteId(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              <p>Cette action est irréversible. La ressource sera retirée de l&apos;espace candidat.</p>
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
