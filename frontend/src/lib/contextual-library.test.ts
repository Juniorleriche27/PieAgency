import { describe, expect, it } from "vitest";

import {
  currentStepResourceCategories,
  selectContextualProduct,
  selectContextualResources,
} from "@/lib/contextual-library";
import type { Product } from "@/lib/private-products";
import type { PrivateResource } from "@/lib/private-resources";
import type { ProgressivePath, ProgressiveStep } from "@/lib/progressive-path";

function step(overrides: Partial<ProgressiveStep> = {}): ProgressiveStep {
  return {
    id: "prepare-study-project",
    title: "Préparer mon projet d'études",
    order: 5,
    status: "in_progress",
    short_description: "Structurer le projet",
    is_current: true,
    is_locked: false,
    target_module: "ressources",
    target_path: "/espace-etudiant/ressources",
    objective: "Construire un projet cohérent",
    prerequisites: [],
    requirements: [],
    evidence: [],
    blocking_reasons: ["Projet d'études prêt"],
    completion_rule: "Le projet doit être confirmé prêt.",
    next_action: "Finaliser le projet d'études.",
    can_complete: false,
    ...overrides,
  };
}

function path(currentStep = step()): ProgressivePath {
  return {
    candidate_id: "candidate-test",
    current_step: currentStep,
    progress_percent: 33,
    steps: [currentStep],
    official_deposit: {
      has_declared: false,
      platform_type: null,
      platform_name: null,
      official_deposit_date: null,
      official_reference: null,
      status: null,
      comment: null,
    },
    recommendations: {
      current_step_id: currentStep.id,
      free_action: {
        title: "Lire un guide",
        description: "Guide utile",
        target_module: "ressources",
        target_path: "/espace-etudiant/ressources",
        reason_now: "Pertinent pour votre étape actuelle.",
        expected_outcome: "Projet prêt.",
        addresses_blockers: ["Projet d'études prêt"],
      },
      recommended_product: {
        title: "Générateur projet d'études",
        description: "Outil facultatif",
        target_module: "produits_digitaux",
        target_path: "/espace-etudiant/produits/prod-003",
        reason_now: "Option facultative pour cette étape.",
        expected_outcome: "Projet prêt.",
        addresses_blockers: ["Projet d'études prêt"],
        requires_purchase: true,
      },
      assistant_action: null,
      document_action: null,
    },
  };
}

const resources: PrivateResource[] = [
  {
    id: "res-project",
    title: "Projet d'études",
    description: "Guide projet",
    category: "Projet d'études",
    resource_type: "guide",
    badge_label: "Guide",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/project",
  },
  {
    id: "res-motivation",
    title: "Motivation",
    description: "Exercice motivation",
    category: "Motivation",
    resource_type: "exercise",
    badge_label: "Exercice",
    action_label: "Ouvrir",
    access_level: "free",
    url: "/motivation",
  },
  {
    id: "res-visa",
    title: "Visa",
    description: "Guide visa",
    category: "Visa",
    resource_type: "guide",
    badge_label: "Guide",
    action_label: "Ouvrir",
    access_level: "student",
    url: "/visa",
  },
];

const products: Product[] = [
  {
    id: "prod-003",
    title: "Générateur projet d'études",
    description: "Aide au projet",
    longDescription: "Aide au projet",
    targetAudience: "Candidats",
    whatYouGet: ["Guide"],
    price: 19.99,
    category: "Projet d'études",
    serviceSlug: "prod-003",
    includedResourceIds: [],
  },
  {
    id: "prod-002",
    title: "Kit Visa",
    description: "Visa",
    longDescription: "Visa",
    targetAudience: "Candidats",
    whatYouGet: ["Visa"],
    price: 24.99,
    category: "Visa",
    serviceSlug: "prod-002",
    includedResourceIds: [],
  },
];

describe("contextual library", () => {
  it("maps the current step to relevant resource categories", () => {
    expect(currentStepResourceCategories(step())).toEqual(["Projet d'études", "Motivation"]);
  });

  it("selects only resources relevant to the current step", () => {
    const selected = selectContextualResources(resources, path(), 3);
    expect(selected.map((item) => item.resource.id)).toEqual([
      "res-project",
      "res-motivation",
    ]);
    expect(selected.every((item) => item.reason.length > 0)).toBe(true);
  });

  it("selects the exact product recommended by the path engine", () => {
    const selected = selectContextualProduct(products, path());
    expect(selected?.product.id).toBe("prod-003");
    expect(selected?.reason).toContain("facultative");
    expect(selected?.blockers).toEqual(["Projet d'études prêt"]);
  });

  it("does not promote a paid product when the step is already ready", () => {
    const ready = path(step({ can_complete: true, blocking_reasons: [] }));
    expect(selectContextualProduct(products, ready)).toBeNull();
  });
});
