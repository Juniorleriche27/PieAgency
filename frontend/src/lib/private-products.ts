import { authenticatedFetch } from "@/lib/auth";

export type ProductBadge = "recommended" | "popular" | "included";

export type Product = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  targetAudience: string;
  whatYouGet: string[];
  price: number;
  badge?: ProductBadge;
  category: string;
  serviceSlug?: string;
};

type PrivateProductApiItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency?: string;
  target_audience: string;
  what_you_get: string[];
  badge?: ProductBadge | null;
  service_slug: string;
};

type PrivateProductListResponse = {
  products: PrivateProductApiItem[];
};

export const PRODUCT_CATEGORIES = [
  "Tous",
  "Campus France",
  "Visa",
  "Projet d'études",
  "Projet professionnel",
  "Lettres de motivation",
  "Entretien",
  "Écoles privées",
  "Belgique",
  "Correction",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Mock data — replace with API calls below when ready
// ---------------------------------------------------------------------------

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    title: "Kit Campus France complet",
    description: "Guide complet pour réussir votre procédure Campus France",
    longDescription:
      "Ce produit vous aide à structurer votre dossier, préparer vos documents et éviter les erreurs fréquentes. Il ne garantit pas une admission, mais vous donne une méthode claire pour avancer.",
    targetAudience: "Étudiants préparant Campus France",
    whatYouGet: [
      "Guide étape par étape",
      "Modèles de documents",
      "Checklist complète",
      "Exemples commentés",
      "Conseils sur les erreurs à éviter",
    ],
    price: 29.99,
    badge: "recommended",
    category: "Campus France",
  },
  {
    id: "prod-002",
    title: "Kit Visa étudiant",
    description: "Tout ce qu'il faut savoir pour préparer votre dossier visa",
    longDescription:
      "Préparation complète de votre dossier visa avec tous les documents nécessaires et les conseils pratiques.",
    targetAudience: "Étudiants en procédure visa",
    whatYouGet: [
      "Liste complète des documents",
      "Modèles de lettres",
      "Conseils financiers",
      "Préparation entretien consulat",
    ],
    price: 24.99,
    badge: "popular",
    category: "Visa",
  },
  {
    id: "prod-003",
    title: "Générateur projet d'études",
    description: "Outil interactif pour rédiger votre projet d'études",
    longDescription:
      "Générateur guidé pour structurer et rédiger votre projet d'études de manière cohérente.",
    targetAudience: "Tous les candidats",
    whatYouGet: [
      "Questions guidées",
      "Exemples de réponses",
      "Export PDF",
      "Conseils de rédaction",
    ],
    price: 19.99,
    category: "Projet d'études",
  },
  {
    id: "prod-004",
    title: "Générateur projet professionnel",
    description: "Structurez votre projet professionnel efficacement",
    longDescription:
      "Guide et outil pour définir et communiquer votre projet professionnel.",
    targetAudience: "Tous les candidats",
    whatYouGet: [
      "Framework de réflexion",
      "Modèles de réponses",
      "Conseils sectoriels",
      "Export personnalisé",
    ],
    price: 19.99,
    category: "Projet professionnel",
  },
  {
    id: "prod-005",
    title: "Bibliothèque de lettres de motivation",
    description: "50+ modèles de lettres adaptées à différents contextes",
    longDescription:
      "Collection complète de modèles de lettres de motivation pour différentes procédures.",
    targetAudience: "Tous les candidats",
    whatYouGet: [
      "50+ modèles",
      "Adaptables à votre contexte",
      "Conseils de personnalisation",
      "Exemples commentés",
    ],
    price: 14.99,
    category: "Lettres de motivation",
  },
  {
    id: "prod-006",
    title: "Simulateur entretien Campus France",
    description: "Préparez-vous à l'entretien avec des questions réalistes",
    longDescription:
      "Entraînement interactif pour préparer votre entretien Campus France.",
    targetAudience: "Candidats Campus France",
    whatYouGet: [
      "100+ questions réalistes",
      "Conseils de réponse",
      "Enregistrement de vos réponses",
      "Feedback structuré",
    ],
    price: 24.99,
    badge: "popular",
    category: "Entretien",
  },
  {
    id: "prod-007",
    title: "Guide écoles privées",
    description: "Sélectionner et postuler aux meilleures écoles privées",
    longDescription:
      "Guide complet pour identifier, sélectionner et postuler aux écoles privées.",
    targetAudience: "Candidats écoles privées",
    whatYouGet: [
      "Liste des écoles",
      "Critères de sélection",
      "Stratégie de candidature",
      "Conseils de rédaction",
    ],
    price: 19.99,
    category: "Écoles privées",
  },
  {
    id: "prod-008",
    title: "Guide Campus Belgique",
    description: "Procédure d'études en Belgique expliquée",
    longDescription:
      "Guide spécifique pour les procédures d'études en Belgique.",
    targetAudience: "Candidats Belgique",
    whatYouGet: [
      "Procédure belge expliquée",
      "Documents nécessaires",
      "Calendrier",
      "Conseils pratiques",
    ],
    price: 14.99,
    category: "Belgique",
  },
  {
    id: "prod-009",
    title: "Pack correction dossier",
    description: "Correction professionnelle de vos documents",
    longDescription:
      "Service de correction pour améliorer la qualité de votre dossier.",
    targetAudience: "Tous les candidats",
    whatYouGet: [
      "Correction de 3 documents",
      "Commentaires détaillés",
      "Suggestions d'amélioration",
      "Révision finale",
    ],
    price: 49.99,
    category: "Correction",
  },
  {
    id: "prod-010",
    title: "Pack entretien + questions fréquentes",
    description: "Préparation complète aux entretiens",
    longDescription: "Pack complet pour préparer tous types d'entretiens.",
    targetAudience: "Tous les candidats",
    whatYouGet: [
      "Guide entretien complet",
      "200+ questions fréquentes",
      "Conseils de communication",
      "Exercices pratiques",
    ],
    price: 34.99,
    category: "Entretien",
  },
];

// ---------------------------------------------------------------------------
// Data access functions — swap bodies to fetch from API when ready
// ---------------------------------------------------------------------------

function toProduct(item: PrivateProductApiItem): Product {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    longDescription: item.description,
    targetAudience: item.target_audience,
    whatYouGet: item.what_you_get,
    price: item.price,
    badge: item.badge ?? undefined,
    category: item.category,
    serviceSlug: item.service_slug,
  };
}

// TODO(Codex): replace with API call once backend returns the 10 canonical products
export async function getProducts(): Promise<Product[]> {
  return MOCK_PRODUCTS;
}

// TODO(Codex): replace with API call once backend /api/private/products/:id is ready
export async function getProduct(id: string): Promise<Product | null> {
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Synchronous lookup — used only for generateStaticParams. */
export function getAllProductIds(): string[] {
  return MOCK_PRODUCTS.map((p) => p.id);
}
