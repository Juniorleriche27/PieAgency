"use client";

import { BookOpen, CheckSquare, ExternalLink, FileText, LinkIcon, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPrivateResources,
  type PrivateResource,
  type PrivateResourceType,
} from "@/lib/private-resources";

const resourceTypeLabels: Record<PrivateResourceType, string> = {
  guide: "Guide",
  template: "Modele",
  video: "Video",
  checklist: "Checklist",
  link: "Lien",
};

const resourceTypeIcons = {
  guide: BookOpen,
  template: FileText,
  video: PlayCircle,
  checklist: CheckSquare,
  link: LinkIcon,
};

function accessLabel(accessLevel: PrivateResource["access_level"]) {
  if (accessLevel === "premium") {
    return "Premium";
  }
  if (accessLevel === "free") {
    return "Libre";
  }
  return "Etudiant";
}

export function PrivateResourcesView() {
  const [resources, setResources] = useState<PrivateResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResources() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await fetchPrivateResources();
        if (active) {
          setResources(payload);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les ressources privees.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadResources();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(resources.map((item) => item.category)))],
    [resources],
  );

  const visibleResources = useMemo(() => {
    if (selectedCategory === "Toutes") {
      return resources;
    }
    return resources.filter((item) => item.category === selectedCategory);
  }, [resources, selectedCategory]);

  return (
    <div className="private-resource-page">
      <section className="private-resource-hero">
        <div>
          <span>Bibliotheque privee</span>
          <h1>Ressources utiles pour avancer sans perdre le fil</h1>
          <p>
            Guides, checklists et modeles sont regroupes ici pour accompagner les
            prochaines etapes du dossier.
          </p>
        </div>
        <div className="private-resource-count">
          <strong>{resources.length}</strong>
          <span>ressource(s)</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <div className="private-resource-filters" aria-label="Categories ressources">
        {categories.map((category) => (
          <button
            className={selectedCategory === category ? "active" : ""}
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="private-resource-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="private-resource-card loading" key={index}>
              <div />
              <span />
              <strong />
              <p />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && visibleResources.length ? (
        <div className="private-resource-grid">
          {visibleResources.map((resource) => {
            const Icon = resourceTypeIcons[resource.resource_type];

            return (
              <article className="private-resource-card" key={resource.id}>
                <div className="private-resource-card-head">
                  <span className="private-resource-icon">
                    <Icon size={20} />
                  </span>
                  <div className="private-resource-badges">
                    <span>{resourceTypeLabels[resource.resource_type]}</span>
                    <span>{accessLabel(resource.access_level)}</span>
                  </div>
                </div>

                <div>
                  <div className="portal-card-kicker">{resource.category}</div>
                  <h2>{resource.title}</h2>
                  <p>{resource.description}</p>
                </div>

                <div className="private-resource-footer">
                  <span>{resource.format_label}</span>
                  {resource.url ? (
                    <a href={resource.url} rel="noreferrer" target="_blank">
                      Ouvrir
                      <ExternalLink size={16} />
                    </a>
                  ) : (
                    <button disabled type="button">
                      Bientot disponible
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !visibleResources.length ? (
        <div className="portal-empty">
          Aucune ressource n&apos;est disponible dans cette categorie pour le moment.
        </div>
      ) : null}
    </div>
  );
}
