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
  | "example"
  | "exercise"
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
    description: "Tunnel privé pour construire un projet d'études clair, cohérent et défendable devant Campus France.",
    category: "Projet d'études",
    resource_type: "template",
    badge_label: "Modèle interactif",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/modele-projet-etudes",
    slug: "modele-projet-etudes",
  },
  {
    id: "res-003",
    title: "Checklist dossier complet",
    description: "Checklist privée pour contrôler les pièces du dossier avant soumission.",
    category: "Dossier",
    resource_type: "checklist",
    badge_label: "Checklist interactive",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/checklist-dossier-complet",
    slug: "checklist-dossier-complet",
  },
  {
    id: "res-004",
    title: "Préparer votre entretien Campus France",
    description: "Parcours privé pour préparer les questions et réponses de l'entretien.",
    category: "Entretien",
    resource_type: "video",
    badge_label: "Parcours entretien",
    action_label: "Ouvrir",
    duration_label: "35 min",
    access_level: "student",
    url: "/espace-etudiant/ressources/preparer-entretien-campus-france",
    slug: "preparer-entretien-campus-france",
  },
  {
    id: "res-005",
    title: "Exemple projet d'études commenté",
    description: "Exemple privé expliqué phrase par phrase pour comprendre la logique attendue.",
    category: "Projet d'études",
    resource_type: "example",
    badge_label: "Exemple commenté",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/exemple-projet-etudes-commente",
    slug: "exemple-projet-etudes-commente",
  },
  {
    id: "res-006",
    title: "Exercice : Structurer votre motivation",
    description: "Exercice privé pour clarifier vos motivations et construire vos arguments.",
    category: "Motivation",
    resource_type: "exercise",
    badge_label: "Exercice interactif",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/structurer-motivation",
    slug: "structurer-motivation",
  },
  {
    id: "res-007",
    title: "Guide visa étudiant",
    description: "Parcours privé pour préparer la procédure visa étudiant étape par étape.",
    category: "Visa",
    resource_type: "guide",
    badge_label: "Guide interactif",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/guide-visa-etudiant",
    slug: "guide-visa-etudiant",
  },
  {
    id: "res-008",
    title: "Modèle lettre de motivation",
    description: "Modèle privé pour rédiger une lettre claire, personnalisée et cohérente.",
    category: "Lettres",
    resource_type: "template",
    badge_label: "Modèle interactif",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/modele-lettre-motivation",
    slug: "modele-lettre-motivation",
  },
  {
    id: "res-009",
    title: "Checklist documents visa",
    description: "Checklist privée pour contrôler les documents essentiels de la phase visa.",
    category: "Visa",
    resource_type: "checklist",
    badge_label: "Checklist interactive",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/espace-etudiant/ressources/checklist-documents-visa",
    slug: "checklist-documents-visa",
  },
  {
    id: "res-010",
    title: "Questions fréquentes Campus France",
    description: "FAQ privée pour répondre aux blocages les plus courants de la procédure.",
    category: "Campus France",
    resource_type: "video",
    badge_label: "FAQ interactive",
    action_label: "Ouvrir",
    duration_label: "35 min",
    access_level: "student",
    url: "/espace-etudiant/ressources/questions-frequentes-campus-france",
    slug: "questions-frequentes-campus-france",
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
