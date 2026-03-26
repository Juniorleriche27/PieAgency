"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ActionLink } from "@/components/action-link";
import { getApiBaseUrl } from "@/lib/auth";

type InsightPayload = {
  title: string;
  summary: string;
  bullets: string[];
  cta_label: string;
  cta_href: string;
  source: "cohere" | "fallback";
};

const defaultInsight: InsightPayload = {
  title: "Assistant PieAgency",
  summary:
    "Un assistant contextuel pour orienter rapidement les visiteurs vers le bon accompagnement et le bon canal de prise de contact.",
  bullets: [
    "Clarifie le service adapte au projet de l'etudiant.",
    "Reformule les etapes essentielles selon la page visitee.",
    "Redirige vers le formulaire ou le chat quand il faut passer a l'action.",
  ],
  cta_label: "Parler a un conseiller",
  cta_href: "/contact",
  source: "fallback",
};

export function SiteAssistantSpotlight() {
  const pathname = usePathname();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [insight, setInsight] = useState<InsightPayload>(defaultInsight);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadInsight() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/ai/page-insight?path=${encodeURIComponent(pathname)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          throw new Error("Unable to fetch page insight.");
        }
        const payload = (await response.json()) as InsightPayload;
        if (active) {
          setInsight(payload);
        }
      } catch {
        if (active) {
          setInsight(defaultInsight);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadInsight();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, pathname]);

  const isExternal = insight.cta_href.startsWith("http");

  return (
    <section className="assistant-spotlight-wrap">
      <div className="container">
        <div className="assistant-spotlight">
          <div className="assistant-spotlight-copy">
            <div className="assistant-kicker">
              Assistant IA {insight.source === "cohere" ? "Cohere" : "PieAgency"}
            </div>
            <h2>{insight.title}</h2>
            <p>{isLoading ? "Chargement du conseil contextuel..." : insight.summary}</p>
          </div>

          <div className="assistant-spotlight-panel">
            <div className="assistant-panel-label">
              Ce que l&apos;assistant peut faire ici
            </div>
            <ul className="assistant-bullets">
              {insight.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <div className="assistant-actions">
              <ActionLink
                external={isExternal}
                href={insight.cta_href}
                variant="primary"
              >
                {insight.cta_label}
              </ActionLink>
              <button
                className="btn btn-outline"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("pieagency-chat-open"))
                }
                type="button"
              >
                Ouvrir le chatbot
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
