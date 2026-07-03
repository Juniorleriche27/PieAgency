import { authenticatedFetch } from "@/lib/auth";

export type ProductBadge = "recommended" | "popular" | "included";

export type ProductIncludedResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  href?: string;
  status: "ready" | "coming";
};

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
  includedResourceIds?: string[];
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
  included_resource_ids?: string[];
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

export const RESOURCE_LIBRARY: Record<string, ProductIncludedResource> = {
  "res-001": {
    id: "res-001",
    title: "Guide complet Campus France",
    description: "Tunnel privé pour comprendre la procédure Études en France.",
    category: "Campus France",
    href: "/espace-etudiant/ressources/guide-complet-campus-france",
    status: "ready",
  },
  "res-002": {
    id: "res-002",
    title: "Modèle projet d'études",
    description: "Parcours guidé pour construire un projet cohérent et défendable.",
    category: "Projet d'études",
    href: "/espace-etudiant/ressources/modele-projet-etudes",
    status: "ready",
  },
  "res-003": {
    id: "res-003",
    title: "Checklist dossier complet",
    description: "Contrôle guidé des pièces avant soumission.",
    category: "Dossier",
    href: "/espace-etudiant/ressources/checklist-dossier-complet",
    status: "ready",
  },
  "res-004": {
    id: "res-004",
    title: "Préparer l'entretien Campus France",
    description: "Questions, méthode de réponse et préparation orale.",
    category: "Entretien",
    href: "/espace-etudiant/ressources/preparer-entretien-campus-france",
    status: "ready",
  },
  "res-005": {
    id: "res-005",
    title: "Exemple projet d'études commenté",
    description: "Exemple expliqué phrase par phrase.",
    category: "Projet d'études",
    href: "/espace-etudiant/ressources/exemple-projet-etudes-commente",
    status: "ready",
  },
  "res-006": {
    id: "res-006",
    title: "Structurer votre motivation",
    description: "Exercice guidé pour clarifier les arguments.",
    category: "Motivation",
    status: "coming",
  },
  "res-007": {
    id: "res-007",
    title: "Guide visa étudiant",
    description: "Parcours privé pour préparer la phase visa.",
    category: "Visa",
    status: "coming",
  },
  "res-008": {
    id: "res-008",
    title: "Modèle lettre de motivation",
    description: "Trame guidée pour rédiger une lettre personnalisée.",
    category: "Lettres",
    status: "coming",
  },
  "res-009": {
    id: "res-009",
    title: "Checklist documents visa",
    description: "Contrôle guidé des pièces visa.",
    category: "Visa",
    status: "coming",
  },
  "res-010": {
    id: "res-010",
    title: "Questions fréquentes Campus France",
    description: "Réponses aux blocages les plus courants.",
    category: "Campus France",
    status: "coming",
  },
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    title: "Kit Campus France complet",
    description: "Pack privé pour comprendre la procédure Campus France et avancer avec méthode.",
    longDescription:
      "Ce produit débloque un ensemble de ressources privées pour structurer la procédure Campus France : guide principal, dossier, entretien, projet d'études et questions fréquentes. Il ne garantit pas une admission, mais donne une méthode claire et protégée pour avancer.",
    targetAudience: "Étudiants préparant une procédure Campus France",
    whatYouGet: ["Guide Campus France interactif", "Checklist dossier complet", "Préparation entretien", "Exemple de projet d'études commenté", "FAQ Campus France privée"],
    price: 29.99,
    badge: "recommended",
    category: "Campus France",
    serviceSlug: "prod-001",
    includedResourceIds: ["res-001", "res-003", "res-004", "res-005", "res-010"],
  },
  {
    id: "prod-002",
    title: "Kit Visa étudiant",
    description: "Pack privé pour préparer la demande de visa étudiant avec méthode.",
    longDescription:
      "Ce produit débloque les ressources privées utiles pour préparer la phase visa : guide visa, checklist documents, organisation des justificatifs et points de vigilance.",
    targetAudience: "Étudiants qui préparent la phase visa après admission",
    whatYouGet: ["Guide visa étudiant interactif", "Checklist documents visa", "Conseils financiers", "Préparation des justificatifs"],
    price: 24.99,
    badge: "popular",
    category: "Visa",
    serviceSlug: "prod-002",
    includedResourceIds: ["res-007", "res-009"],
  },
  {
    id: "prod-003",
    title: "Générateur projet d'études",
    description: "Parcours guidé pour construire un projet d'études clair et défendable.",
    longDescription:
      "Ce produit débloque les ressources qui aident à clarifier le parcours, structurer le projet d'études et préparer des arguments solides pour le dossier et l'entretien.",
    targetAudience: "Candidats qui doivent structurer leur projet d'études",
    whatYouGet: ["Modèle projet d'études interactif", "Exemple commenté", "Exercice de structuration", "Questions guidées"],
    price: 19.99,
    category: "Projet d'études",
    serviceSlug: "prod-003",
    includedResourceIds: ["res-002", "res-005", "res-006"],
  },
  {
    id: "prod-004",
    title: "Générateur projet professionnel",
    description: "Parcours guidé pour clarifier l'objectif professionnel derrière le choix d'études.",
    longDescription:
      "Ce produit aide à transformer un objectif flou en argumentaire clair : parcours, motivation, objectif professionnel et cohérence avec les formations choisies.",
    targetAudience: "Candidats dont le projet professionnel est encore flou",
    whatYouGet: ["Exercice de motivation", "Clarification du parcours", "Structure d'argumentation", "Préparation entretien"],
    price: 19.99,
    category: "Projet professionnel",
    serviceSlug: "prod-004",
    includedResourceIds: ["res-006", "res-004"],
  },
  {
    id: "prod-005",
    title: "Bibliothèque de lettres de motivation",
    description: "Ressources privées pour rédiger des lettres cohérentes et personnalisées.",
    longDescription:
      "Ce produit débloque une méthode pour rédiger des lettres personnalisées, éviter les formulations génériques et relier chaque lettre au projet d'études.",
    targetAudience: "Candidats qui doivent adapter leurs lettres aux formations",
    whatYouGet: ["Modèle lettre de motivation interactif", "Méthode de personnalisation", "Exercice de motivation", "Erreurs de rédaction à éviter"],
    price: 14.99,
    category: "Lettres de motivation",
    serviceSlug: "prod-005",
    includedResourceIds: ["res-008", "res-006"],
  },
  {
    id: "prod-006",
    title: "Simulateur entretien Campus France",
    description: "Parcours privé pour préparer les questions et réponses de l'entretien.",
    longDescription:
      "Ce produit débloque les ressources d'entraînement oral : questions fréquentes, méthode de réponse, erreurs à éviter et préparation de la cohérence du projet.",
    targetAudience: "Candidats Campus France avant entretien",
    whatYouGet: ["Préparation entretien guidée", "Questions fréquentes Campus France", "Méthode de réponse", "Erreurs à éviter à l'oral"],
    price: 24.99,
    badge: "popular",
    category: "Entretien",
    serviceSlug: "prod-006",
    includedResourceIds: ["res-004", "res-010"],
  },
  {
    id: "prod-007",
    title: "Guide écoles privées",
    description: "Parcours privé pour sélectionner et défendre ses candidatures en écoles privées.",
    longDescription:
      "Ce produit aide à sélectionner des écoles privées avec cohérence, préparer ses arguments et relier les choix au projet d'études.",
    targetAudience: "Candidats visant des écoles privées en France",
    whatYouGet: ["Méthode de sélection", "Critères de cohérence", "Préparation du projet", "Conseils de candidature"],
    price: 19.99,
    category: "Écoles privées",
    serviceSlug: "prod-007",
    includedResourceIds: ["res-002", "res-006"],
  },
  {
    id: "prod-008",
    title: "Guide Campus Belgique",
    description: "Parcours privé pour comprendre et préparer une candidature Belgique.",
    longDescription:
      "Ce produit aide à préparer une candidature Belgique avec une méthode claire : projet, documents, cohérence et organisation.",
    targetAudience: "Candidats Belgique",
    whatYouGet: ["Méthode de préparation", "Documents à anticiper", "Cohérence du projet", "Conseils pratiques"],
    price: 14.99,
    category: "Belgique",
    serviceSlug: "prod-008",
    includedResourceIds: ["res-002", "res-003"],
  },
  {
    id: "prod-009",
    title: "Pack correction dossier",
    description: "Service de correction pour renforcer la cohérence du dossier.",
    longDescription:
      "Ce produit combine une correction de dossier avec les ressources privées nécessaires pour comprendre les améliorations et reprendre les points faibles.",
    targetAudience: "Candidats qui veulent faire relire leur dossier",
    whatYouGet: ["Analyse des documents clés", "Commentaires détaillés", "Suggestions d'amélioration", "Révision finale guidée"],
    price: 49.99,
    category: "Correction",
    serviceSlug: "prod-009",
    includedResourceIds: ["res-002", "res-003", "res-006"],
  },
  {
    id: "prod-010",
    title: "Pack entretien + questions fréquentes",
    description: "Pack privé pour préparer l'entretien et les questions Campus France.",
    longDescription:
      "Ce produit débloque les ressources nécessaires pour préparer l'entretien Campus France et travailler les réponses fréquentes sans réciter un texte artificiel.",
    targetAudience: "Candidats qui veulent sécuriser leur préparation orale",
    whatYouGet: ["Préparation entretien complète", "Questions fréquentes Campus France", "Méthode de réponse", "Checklist avant rendez-vous"],
    price: 34.99,
    category: "Entretien",
    serviceSlug: "prod-010",
    includedResourceIds: ["res-004", "res-010", "res-001"],
  },
];

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
    includedResourceIds: item.included_resource_ids ?? [],
  };
}

function live(): Product[] {
  if (typeof window === "undefined") return MOCK_PRODUCTS;
  try {
    const raw = localStorage.getItem("pie_admin_products");
    return raw ? (JSON.parse(raw) as Product[]) : MOCK_PRODUCTS;
  } catch {
    return MOCK_PRODUCTS;
  }
}

export async function getProducts(): Promise<Product[]> {
  return live();
}

export async function getProduct(id: string): Promise<Product | null> {
  return live().find((p) => p.id === id) ?? null;
}

export function getIncludedResources(product: Product): ProductIncludedResource[] {
  return (product.includedResourceIds ?? [])
    .map((id) => RESOURCE_LIBRARY[id])
    .filter((resource): resource is ProductIncludedResource => Boolean(resource));
}

/** Synchronous lookup — used only for generateStaticParams. */
export function getAllProductIds(): string[] {
  return MOCK_PRODUCTS.map((p) => p.id);
}
