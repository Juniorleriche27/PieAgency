"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckSquare,
  FileText,
  Lightbulb,
  Play,
  PlayCircle,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AssistantGenieTrigger } from "@/components/private/assistant-genie-trigger";
import { CopilotBanner } from "@/components/private/copilot-banner";
import {
  selectContextualResources,
  type ContextualResource,
} from "@/lib/contextual-library";
import {
  fetchPrivateResources,
  type PrivateResource,
  type PrivateResourceType,
  RESOURCE_CATEGORIES,
} from "@/lib/private-resources";
import { fetchProgressivePath, type ProgressivePath } from "@/lib/progressive-path";

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

function ResourceCard({ resource }: { resource: PrivateResource }) {
  const Icon = typeIcons[resource.resource_type];
  const iconClass = typeIconColor[resource.resource_type];
  return (
    <article className="res-card">
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
            <Play size={12} /> {resource.duration_label}
          </div>
        ) : null}
      </div>
      <div className="res-card-footer">
        <span className="res-category-tag">{resource.category}</span>
        {resource.url ? (
          <Link className="res-action-btn" href={resource.url}>
            <BookOpen size={16} /> {resource.action_label || "Ouvrir"}
          </Link>
        ) : (
          <button className="res-action-btn" disabled type="button">
            <BookOpen size={16} /> {resource.action_label || "Ouvrir"}
          </button>
        )}
      </div>
    </article>
  );
}

function ContextualResourceCard({ item }: { item: ContextualResource }) {
  const { resource } = item;
  const Icon = typeIcons[resource.resource_type];
  return (
    <article className="contextual-library-card">
      <div className="contextual-library-card-head">
        <span className="contextual-library-icon"><Icon size={18} /></span>
        <div>
          <span>Utile maintenant</span>
          <strong>{resource.title}</strong>
        </div>
      </div>
      <p>{resource.description}</p>
      <div className="contextual-library-explain">
        <small>Pourquoi maintenant</small>
        <p>{item.reason}</p>
      </div>
      <div className="contextual-library-explain">
        <small>Résultat attendu</small>
        <p>{item.expectedOutcome}</p>
      </div>
      <div className="contextual-library-actions">
        {resource.url ? (
          <Link className="btn btn-primary" href={resource.url}>Ouvrir cette ressource</Link>
        ) : null}
        <AssistantGenieTrigger
          className="btn btn-outline"
          message={`Explique-moi comment utiliser la ressource « ${resource.title} » pour avancer sur mon étape actuelle, en tenant compte de mes blocages.`}
          requestedAction="explain_contextual_resource"
        >
          Demander à Assistant.genie
        </AssistantGenieTrigger>
      </div>
    </article>
  );
}

export function PrivateResourcesView() {
  const [resources, setResources] = useState<PrivateResource[]>([]);
  const [path, setPath] = useState<ProgressivePath | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchPrivateResources(), fetchProgressivePath()])
      .then(([resourceData, pathData]) => {
        if (!active) return;
        setResources(resourceData);
        setPath(pathData);
        setLoadError("");
      })
      .catch(() => {
        if (active) setLoadError("Impossible de charger les ressources contextualisées.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const contextual = useMemo(
    () => selectContextualResources(resources, path, 3),
    [resources, path],
  );
  const contextualIds = useMemo(
    () => new Set(contextual.map((item) => item.resource.id)),
    [contextual],
  );

  const visibleResources = useMemo(() => {
    const filtered = selectedCategory === "Tous"
      ? resources
      : resources.filter((resource) => resource.category === selectedCategory);
    return filtered.filter((resource) => !contextualIds.has(resource.id));
  }, [resources, selectedCategory, contextualIds]);

  return (
    <div className="res-page">
      <CopilotBanner />
      <div className="res-page-header">
        <h1>Ressources utiles à votre parcours</h1>
        <p>
          PieAgency met d’abord en avant ce qui peut réellement vous aider sur l’étape actuelle.
          La bibliothèque complète reste disponible ensuite si vous souhaitez explorer.
        </p>
      </div>

      {loadError ? <div className="portal-warning" role="alert">{loadError}</div> : null}

      {!isLoading && path?.current_step ? (
        <section className="contextual-library-panel" aria-labelledby="resources-now-title">
          <div className="contextual-library-heading">
            <div>
              <span><Sparkles size={15} /> Recommandé pour votre étape actuelle</span>
              <h2 id="resources-now-title">{path.current_step.title}</h2>
              <p>{path.current_step.next_action || path.current_step.objective}</p>
            </div>
            <span className="contextual-library-count">{contextual.length} ressource{contextual.length > 1 ? "s" : ""}</span>
          </div>

          {contextual.length ? (
            <div className="contextual-library-grid">
              {contextual.map((item) => (
                <ContextualResourceCard item={item} key={item.resource.id} />
              ))}
            </div>
          ) : (
            <div className="portal-empty">
              Aucune ressource spécifique n’est nécessaire pour cette étape. Suivez d’abord l’action principale du parcours.
            </div>
          )}
        </section>
      ) : null}

      <section className="contextual-library-explore" aria-labelledby="resource-library-title">
        <div className="contextual-library-section-head">
          <div>
            <span>Secondaire</span>
            <h2 id="resource-library-title">Explorer la bibliothèque</h2>
            <p>Ces contenus restent accessibles, mais ils ne remplacent pas votre prochaine action du parcours.</p>
          </div>
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
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="res-card res-card-loading" key={index} />
            ))}
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="portal-empty">Aucune autre ressource dans cette sélection.</div>
        ) : (
          <div className="res-grid">
            {visibleResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>

      <div className="res-free-banner">
        <strong>Ressources privées :</strong> les aperçus sont visibles, puis l’accès complet se
        débloque selon vos achats, abonnements ou droits actifs.
      </div>
    </div>
  );
}
