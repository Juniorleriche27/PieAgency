import type { Product } from "@/lib/private-products";
import type { PrivateResource } from "@/lib/private-resources";
import type { ProgressivePath, ProgressiveStep, RecommendationAction } from "@/lib/progressive-path";

const STEP_RESOURCE_CATEGORIES: Record<string, string[]> = {
  "understand-profile": ["Campus France"],
  "read-diagnostic": ["Campus France"],
  "define-procedure-strategy": ["Campus France", "Écoles privées", "Belgique"],
  "choose-programs": ["Campus France", "Écoles privées", "Belgique"],
  "prepare-study-project": ["Projet d'études", "Motivation"],
  "prepare-career-project": ["Projet professionnel", "Motivation"],
  "prepare-cv": ["CV"],
  "prepare-motivation-letters": ["Lettres", "Motivation"],
  "prepare-documents": ["Dossier"],
  "verify-before-official-filing": ["Dossier", "Campus France"],
  "mark-official-filing-done": ["Campus France"],
  "prepare-campus-france-interview": ["Entretien", "Campus France"],
  "prepare-visa-file": ["Visa", "Financement"],
  "track-after-official-filing": ["Campus France", "Visa"],
  "prepare-departure": ["Visa"],
};

export type ContextualResource = {
  resource: PrivateResource;
  reason: string;
  expectedOutcome: string;
  blockers: string[];
};

export type ContextualProduct = {
  product: Product;
  reason: string;
  expectedOutcome: string;
  blockers: string[];
};

function normalized(value: string | null | undefined) {
  return String(value ?? "").trim().toLocaleLowerCase("fr");
}

export function currentStepResourceCategories(step: ProgressiveStep | null): string[] {
  if (!step) return [];
  return STEP_RESOURCE_CATEGORIES[step.id] ?? [];
}

export function selectContextualResources(
  resources: PrivateResource[],
  path: ProgressivePath | null,
  limit = 3,
): ContextualResource[] {
  const step = path?.current_step ?? null;
  if (!step) return [];

  const categories = currentStepResourceCategories(step);
  if (!categories.length) return [];

  const categoryOrder = new Map(categories.map((category, index) => [normalized(category), index]));
  return resources
    .filter((resource) => categoryOrder.has(normalized(resource.category)))
    .sort((a, b) => {
      const aIndex = categoryOrder.get(normalized(a.category)) ?? 999;
      const bIndex = categoryOrder.get(normalized(b.category)) ?? 999;
      if (aIndex !== bIndex) return aIndex - bIndex;
      const aPremium = a.access_level === "premium" ? 1 : 0;
      const bPremium = b.access_level === "premium" ? 1 : 0;
      if (aPremium !== bPremium) return aPremium - bPremium;
      return a.title.localeCompare(b.title, "fr");
    })
    .slice(0, limit)
    .map((resource) => ({
      resource,
      reason:
        path?.recommendations.free_action?.reason_now ||
        `Cette ressource est liée à votre étape actuelle : ${step.title}.`,
      expectedOutcome:
        path?.recommendations.free_action?.expected_outcome ||
        step.completion_rule ||
        step.next_action ||
        step.objective,
      blockers: step.blocking_reasons.slice(0, 3),
    }));
}

function productIdFromRecommendation(action: RecommendationAction | null | undefined) {
  const targetPath = action?.target_path ?? "";
  const match = targetPath.match(/\/produits\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function selectContextualProduct(
  products: Product[],
  path: ProgressivePath | null,
): ContextualProduct | null {
  const step = path?.current_step ?? null;
  const recommendation = path?.recommendations.recommended_product ?? null;
  if (!step || !recommendation || step.can_complete) return null;

  const productId = productIdFromRecommendation(recommendation);
  if (!productId) return null;
  const product = products.find(
    (item) => item.id === productId || item.serviceSlug === productId,
  );
  if (!product) return null;

  return {
    product,
    reason:
      recommendation.reason_now ||
      `Ce produit peut vous aider pendant l’étape « ${step.title} ».`,
    expectedOutcome:
      recommendation.expected_outcome ||
      step.completion_rule ||
      step.next_action,
    blockers:
      recommendation.addresses_blockers?.length
        ? recommendation.addresses_blockers
        : step.blocking_reasons.slice(0, 3),
  };
}
