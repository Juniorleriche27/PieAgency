import { authenticatedFetch } from "@/lib/auth";

export type PrivateResourceType =
  | "guide"
  | "template"
  | "video"
  | "checklist"
  | "example"
  | "exercise"
  | "link";

export type PrivateResourceAccessLevel = "free" | "student" | "premium";

export type PrivateResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: PrivateResourceType;
  badge_label: string;
  action_label: string;
  duration_label?: string | null;
  access_level: PrivateResourceAccessLevel;
  url?: string | null;
  slug?: string | null;
};

export type PrivateResourceSectionType =
  | "preview"
  | "paywall"
  | "chapter"
  | "timeline"
  | "checklist"
  | "mistakes"
  | "video"
  | "sources";

export type PrivateResourceSection = {
  id: string;
  screen_number: number;
  section_type: PrivateResourceSectionType;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  items: string[];
  is_preview: boolean;
  is_locked: boolean;
};

export type PrivateResourceDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  resource_type: "tunnel_guide";
  access_mode: "preview_free_then_paid";
  badge_label: string;
  action_label: string;
  reading_minutes: number;
  current_screen: number;
  total_screens: number;
  has_access: boolean;
  requires_payment: boolean;
  checkout_service_slug?: string | null;
  watermark_label: string;
  sections: PrivateResourceSection[];
};

type PrivateResourceListResponse = {
  resources: PrivateResource[];
};

// ---------------------------------------------------------------------------
// Mock data — replace with API calls below when ready
// ---------------------------------------------------------------------------

const MOCK_RESOURCES: PrivateResource[] = [
  {
    id: "res-001",
    title: "Guide complet Campus France",
    description: "Tunnel privé pour comprendre la procédure Études en France et éviter les erreurs qui affaiblissent le dossier.",
    category: "Campus France",
    resource_type: "guide",
    badge_label: "Guide interactif",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/guide-complet-campus-france",
    slug: "guide-complet-campus-france",
  },
  {
    id: "res-002",
    title: "Modèle projet d'études",
    description: "Modèle structuré pour rédiger votre projet d'études",
    category: "Projet d'études",
    resource_type: "template",
    badge_label: "Modèle",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-003",
    title: "Checklist dossier complet",
    description: "Vérifiez que vous n'oubliez rien",
    category: "Dossier",
    resource_type: "checklist",
    badge_label: "Checklist",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-004",
    title: "Vidéo : Préparer votre entretien",
    description: "Conseils vidéo pour réussir votre entretien",
    category: "Entretien",
    resource_type: "video",
    badge_label: "Vidéo",
    action_label: "Regarder",
    duration_label: "15 min",
    access_level: "free",
    url: null,
  },
  {
    id: "res-005",
    title: "Exemple projet d'études commenté",
    description: "Exemple réel avec explications",
    category: "Projet d'études",
    resource_type: "example",
    badge_label: "Exemple commenté",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-006",
    title: "Exercice : Structurer votre motivation",
    description: "Exercice pratique pour clarifier vos motivations",
    category: "Motivation",
    resource_type: "exercise",
    badge_label: "Exercice",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-007",
    title: "Guide visa étudiant",
    description: "Procédure visa étape par étape",
    category: "Visa",
    resource_type: "guide",
    badge_label: "Guide PDF",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-008",
    title: "Modèle lettre de motivation",
    description: "Modèle adaptable pour vos candidatures",
    category: "Lettres",
    resource_type: "template",
    badge_label: "Modèle",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-009",
    title: "Checklist documents visa",
    description: "Tous les documents nécessaires pour le visa",
    category: "Visa",
    resource_type: "checklist",
    badge_label: "Checklist",
    action_label: "Télécharger",
    access_level: "free",
    url: null,
  },
  {
    id: "res-010",
    title: "Vidéo : Questions fréquentes Campus France",
    description: "Réponses aux questions les plus posées",
    category: "Campus France",
    resource_type: "video",
    badge_label: "Vidéo",
    action_label: "Regarder",
    duration_label: "20 min",
    access_level: "free",
    url: null,
  },
];

export const RESOURCE_CATEGORIES = [
  "Tous",
  "Campus France",
  "Visa",
  "Lettres",
  "Projet d'études",
  "Projet professionnel",
  "Entretien",
  "Écoles privées",
  "Belgique",
  "CV",
  "Financement",
  "Motivation",
  "Dossier",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export async function fetchPrivateResources(): Promise<PrivateResource[]> {
  if (typeof window === "undefined") return MOCK_RESOURCES;
  try {
    const response = await authenticatedFetch("/api/private/resources", undefined, { requireAuth: true });
    if (response.ok) {
      const payload = (await response.json()) as PrivateResourceListResponse;
      return payload.resources;
    }
  } catch {
    // keep the private area readable if the API is temporarily unavailable
  }

  try {
    const raw = localStorage.getItem("pie_admin_resources");
    return raw ? (JSON.parse(raw) as PrivateResource[]) : MOCK_RESOURCES;
  } catch {
    return MOCK_RESOURCES;
  }
}

export async function fetchPrivateResourceDetail(slug: string): Promise<PrivateResourceDetail> {
  const response = await authenticatedFetch(`/api/private/resources/${slug}`, undefined, { requireAuth: true });
  if (!response.ok) {
    throw new Error(response.status === 404 ? "RESOURCE_NOT_FOUND" : "RESOURCE_UNAVAILABLE");
  }
  return (await response.json()) as PrivateResourceDetail;
}
