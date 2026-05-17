"use client";

import {
  BookOpen,
  CheckSquare,
  Download,
  FileText,
  Lightbulb,
  Play,
  PlayCircle,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPrivateResources,
  type PrivateResource,
  type PrivateResourceType,
  RESOURCE_CATEGORIES,
} from "@/lib/private-resources";

const typeIcons: Record<PrivateResourceType, React.ComponentType<{ size?: number }>> = {
  guide: BookOpen,
  template: FileText,
  video: PlayCircle,
  checklist: CheckSquare,
  example: Lightbulb,
  exercise: Wrench,
  link: FileText,
};

const typeIconColor: Record<PrivateResourceType, string> = {
  guide: "res-icon-blue",
  template: "res-icon-purple",
  video: "res-icon-red",
  checklist: "res-icon-green",
  example: "res-icon-amber",
  exercise: "res-icon-orange",
  link: "res-icon-blue",
};

export function PrivateResourcesView() {
  const [resources, setResources] = useState<PrivateResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPrivateResources().then((data) => {
      if (active) {
        setResources(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const visibleResources = useMemo(() => {
    if (selectedCategory === "Tous") return resources;
    return resources.filter((r) => r.category === selectedCategory);
  }, [resources, selectedCategory]);

  return (
    <div className="res-page">
      <div className="res-page-header">
        <h1>Mes ressources</h1>
        <p>
          Accédez à une bibliothèque complète de guides, modèles, checklists et vidéos pour
          préparer votre procédure.
        </p>
      </div>

      <div className="res-filters" aria-label="Filtrer par catégorie">
        {RESOURCE_CATEGORIES.map((cat) => (
          <button
            className={`res-filter-btn${selectedCategory === cat ? " active" : ""}`}
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="res-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="res-card res-card-loading" key={i} />
          ))}
        </div>
      ) : visibleResources.length === 0 ? (
        <div className="portal-empty">
          Aucune ressource disponible dans cette catégorie pour le moment.
        </div>
      ) : (
        <div className="res-grid">
          {visibleResources.map((resource) => {
            const Icon = typeIcons[resource.resource_type];
            const iconClass = typeIconColor[resource.resource_type];

            return (
              <article className="res-card" key={resource.id}>
                <div className="res-card-top">
                  <span className={`res-icon ${iconClass}`}>
                    <Icon size={20} />
                  </span>
                  <span className="res-badge">{resource.badge_label}</span>
                </div>

                <div className="res-card-body">
                  <h2>{resource.title}</h2>
                  <p>{resource.description}</p>
                  {resource.duration_label ? (
                    <div className="res-duration">
                      <Play size={12} />
                      {resource.duration_label}
                    </div>
                  ) : null}
                </div>

                <div className="res-card-footer">
                  <span className="res-category-tag">{resource.category}</span>
                  {resource.url ? (
                    <a
                      className="res-action-btn"
                      href={resource.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download size={16} />
                      {resource.action_label}
                    </a>
                  ) : (
                    <button className="res-action-btn" disabled type="button">
                      <Download size={16} />
                      {resource.action_label}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="res-free-banner">
        <strong>✓ Ressources gratuites :</strong> Ces ressources sont disponibles pour tous les
        abonnés. Consultez-les régulièrement pour progresser dans votre procédure.
      </div>
    </div>
  );
}
