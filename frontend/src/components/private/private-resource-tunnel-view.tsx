"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPrivateResourceDetail,
  type PrivateResourceDetail,
  type PrivateResourceSection,
} from "@/lib/private-resources";

type Props = {
  slug: string;
};

function youtubeEmbedUrl(url?: string | null) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function sectionEyebrow(section: PrivateResourceSection) {
  if (section.section_type === "paywall") return "Accès complet";
  if (section.section_type === "preview") return "Aperçu gratuit";
  if (section.section_type === "checklist") return "Checklist";
  if (section.section_type === "mistakes") return "À éviter";
  if (section.section_type === "sources") return "Sources";
  return `Écran ${section.screen_number}`;
}

function PaywallCard({ resource }: { resource: PrivateResourceDetail }) {
  return (
    <div className="resource-paywall-card">
      <div className="resource-paywall-icon">
        <LockKeyhole size={24} />
      </div>
      <span className="resource-kicker">Contenu privé</span>
      <h2>Débloque le guide complet</h2>
      <p>
        La suite est réservée aux étudiants qui ont débloqué cette ressource. Le paiement sera
        relié au service <strong>{resource.checkout_service_slug}</strong>.
      </p>
      <div className="resource-paywall-grid">
        <span><ShieldCheck size={16} /> Lecture privée</span>
        <span><EyeOff size={16} /> Aucun PDF</span>
        <span><Sparkles size={16} /> Progression guidée</span>
      </div>
      <Link
        className="resource-primary-btn"
        href={`/paiement?service=${encodeURIComponent(resource.checkout_service_slug ?? "resource-guide-campus-france")}&reason=${encodeURIComponent(`Déblocage ${resource.title}`)}`}
      >
        <CreditCard size={18} />
        Débloquer via paiement
      </Link>
      <p className="resource-paywall-note">
        Après validation du paiement, l’accès complet sera activé côté backend via les droits de ressource.
      </p>
    </div>
  );
}

function SectionCard({ section }: { section: PrivateResourceSection }) {
  return (
    <article className={`resource-slide-card resource-slide-${section.section_type}`}>
      <div className="resource-slide-head">
        <span>{sectionEyebrow(section)}</span>
        <strong>{String(section.screen_number).padStart(2, "0")}</strong>
      </div>
      <h1>{section.title}</h1>
      {section.subtitle ? <p className="resource-slide-subtitle">{section.subtitle}</p> : null}
      {section.body ? <p className="resource-slide-body">{section.body}</p> : null}
      {section.video_url ? (
        <div className="resource-video-wrap">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            src={youtubeEmbedUrl(section.video_url) ?? section.video_url}
            title={section.video_title ?? section.title}
          />
          <div className="resource-video-caption">
            <strong>{section.video_title ?? "Vidéo intégrée"}</strong>
            {section.video_source_label ? <span>{section.video_source_label}</span> : null}
          </div>
        </div>
      ) : null}
      {section.items.length ? (
        <div className="resource-slide-items">
          {section.items.map((item) => (
            <div className="resource-slide-item" key={item}>
              <CheckCircle2 size={18} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function PrivateResourceTunnelView({ slug }: Props) {
  const [resource, setResource] = useState<PrivateResourceDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPrivateResourceDetail(slug)
      .then((payload) => {
        if (!active) return;
        setResource(payload);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError("Impossible de charger cette ressource pour le moment.");
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    function blockEvent(event: Event) {
      event.preventDefault();
    }

    function blockKeys(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["c", "p", "s", "u", "a"].includes(key)) {
        event.preventDefault();
      }
    }

    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("keydown", blockKeys);
    return () => {
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  const section = resource?.sections[currentIndex] ?? null;
  const progress = useMemo(() => {
    if (!resource?.sections.length) return 0;
    const currentScreen = resource.sections[currentIndex]?.screen_number ?? currentIndex + 1;
    return Math.min(100, Math.round((currentScreen / resource.total_screens) * 100));
  }, [currentIndex, resource]);

  if (error) {
    return (
      <div className="resource-reader-page">
        <div className="resource-reader-shell">
          <Link className="resource-back-link" href="/espace-etudiant/ressources">
            <ArrowLeft size={16} /> Retour aux ressources
          </Link>
          <div className="portal-empty">{error}</div>
        </div>
      </div>
    );
  }

  if (!resource || !section) {
    return (
      <div className="resource-reader-page">
        <div className="resource-reader-shell">
          <div className="resource-reader-loading" />
        </div>
      </div>
    );
  }

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < resource.sections.length - 1;

  return (
    <div className="resource-reader-page">
      <div aria-hidden className="resource-watermark">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index}>{resource.watermark_label}</span>
        ))}
      </div>

      <div className="resource-reader-shell">
        <header className="resource-reader-topbar">
          <Link className="resource-back-link" href="/espace-etudiant/ressources">
            <ArrowLeft size={16} /> Ressources
          </Link>
          <div className="resource-progress-wrap" aria-label={`Progression ${progress}%`}>
            <span>{progress}%</span>
            <div className="resource-progress-track">
              <div className="resource-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        <main className="resource-reader-main no-copy-zone">
          <aside className="resource-reader-summary">
            <span className="resource-kicker">{resource.category}</span>
            <h2>{resource.title}</h2>
            <p>{resource.description}</p>
            <div className="resource-summary-meta">
              <span>{resource.reading_minutes} min</span>
              <span>{resource.has_access ? "Accès complet" : "Aperçu + paywall"}</span>
            </div>
          </aside>

          {section.section_type === "paywall" ? (
            <PaywallCard resource={resource} />
          ) : (
            <SectionCard section={section} />
          )}
        </main>

        <footer className="resource-reader-actions">
          <button
            className="resource-secondary-btn"
            disabled={!canGoPrevious}
            onClick={() => setCurrentIndex((value) => Math.max(value - 1, 0))}
            type="button"
          >
            <ArrowLeft size={18} />
            Précédent
          </button>
          <button
            className="resource-primary-btn"
            disabled={!canGoNext}
            onClick={() => setCurrentIndex((value) => Math.min(value + 1, resource.sections.length - 1))}
            type="button"
          >
            Suivant
            <ArrowRight size={18} />
          </button>
        </footer>
      </div>
    </div>
  );
}
