"use client";

import { BookOpen, CheckSquare, ExternalLink, FileText, Lightbulb, LinkIcon, PlayCircle, Search, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPrivateResources,
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

export function AdminResourcesView() {
  const [resources, setResources] = useState<PrivateResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<PrivateResourceType | "">("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const data = await fetchPrivateResources();
        if (active) setResources(data);
      } catch (err) {
        if (active)
          setErrorMessage(
            err instanceof Error ? err.message : "Impossible de charger les ressources.",
          );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(resources.map((r) => r.category))).sort(),
    [resources],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (filterType && r.resource_type !== filterType) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (q && !`${r.title} ${r.description} ${r.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, query, filterType, filterCategory]);

  return (
    <div className="admin-res-page">
      <section className="admin-res-hero">
        <div>
          <span>Catalogue admin</span>
          <h1>Ressources privées</h1>
          <p>
            Vue interne des ressources exposées dans l&apos;espace candidat. Les actions
            d&apos;édition seront activées quand le CRUD backend sera disponible.
          </p>
        </div>
        <div className="admin-res-count">
          <BookOpen size={20} />
          <strong>{filtered.length}</strong>
          <span>ressource(s)</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-res-toolbar">
        <label className="admin-res-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Rechercher par titre, description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className="admin-res-filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PrivateResourceType | "")}
          aria-label="Filtrer par type"
        >
          <option value="">Tous les types</option>
          {(Object.keys(TYPE_LABELS) as PrivateResourceType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          className="admin-res-filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="Filtrer par catégorie"
          disabled={categories.length === 0}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button className="btn btn-outline" type="button" disabled>
          Nouvelle ressource
        </button>
      </section>

      <section className="admin-res-table-card">
        {isLoading ? (
          <div className="admin-res-loading">
            {Array.from({ length: 5 }).map((_, i) => <span key={i} />)}
          </div>
        ) : null}

        {!isLoading && filtered.length > 0 ? (
          <div className="admin-res-table-wrap">
            <table className="admin-res-table">
              <thead>
                <tr>
                  <th>Ressource</th>
                  <th>Catégorie</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Accès</th>
                  <th>Lien</th>
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
                      <td>{r.badge_label}</td>
                      <td>
                        <span className={`admin-res-access admin-res-access-${r.access_level}`}>
                          {ACCESS_LABELS[r.access_level]}
                        </span>
                      </td>
                      <td>
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-res-link"
                            aria-label={`Ouvrir ${r.title}`}
                          >
                            <ExternalLink size={15} aria-hidden />
                          </a>
                        ) : (
                          <span className="admin-res-no-link">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && filtered.length === 0 ? (
          <div className="portal-empty">
            Aucune ressource ne correspond à cette recherche.
          </div>
        ) : null}
      </section>
    </div>
  );
}
