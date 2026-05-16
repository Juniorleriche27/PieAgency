import { authenticatedFetch } from "@/lib/auth";

export type QuestionType = "text" | "select" | "radio";

export type OnboardingQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
};

export type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  questions: OnboardingQuestion[];
};

export type OnboardingData = Record<string, string>;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Situation personnelle",
    description: "Commençons par connaître votre profil actuel",
    questions: [
      { id: "country", label: "Pays de résidence", type: "select", options: ["France", "Belgique", "Suisse", "Canada", "Autre"], required: true },
      { id: "nationality", label: "Nationalité", type: "text", required: true },
      { id: "currentLevel", label: "Niveau actuel", type: "select", options: ["Bac", "Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Autre"], required: true },
      { id: "lastDiploma", label: "Dernier diplôme obtenu", type: "text", required: true },
      { id: "diplomaYear", label: "Année d'obtention", type: "text", required: true },
    ],
  },
  {
    id: 2,
    title: "Projet d'études",
    description: "Définissons votre projet d'études",
    questions: [
      { id: "targetCountry", label: "Pays visé", type: "select", options: ["France", "Belgique", "Suisse", "Canada", "Autre"], required: true },
      { id: "targetProcedure", label: "Procédure visée", type: "select", options: ["Campus France", "École privée", "Parcoursup", "Visa", "Belgique"], required: true },
      { id: "targetLevel", label: "Niveau demandé", type: "select", options: ["L1", "L2", "L3", "M1", "M2", "Bachelor", "MSc", "MBA"], required: true },
      { id: "studyField", label: "Domaine d'études", type: "text", required: true },
      { id: "desiredProgram", label: "Formation souhaitée", type: "text", required: true },
    ],
  },
  {
    id: 3,
    title: "État du dossier",
    description: "Où en êtes-vous dans votre procédure ?",
    questions: [
      {
        id: "dossierStatus",
        label: "État actuel de votre dossier",
        type: "radio",
        options: ["Pas commencé", "Formations choisies", "Dossier en cours", "Admission obtenue", "Visa à préparer", "Refus précédent à expliquer"],
        required: true,
      },
    ],
  },
  {
    id: 4,
    title: "Besoin principal",
    description: "Quel est votre besoin prioritaire ?",
    questions: [
      {
        id: "mainNeed",
        label: "Sélectionnez votre besoin principal",
        type: "radio",
        options: [
          "Choisir mes formations",
          "Rédiger projet d'études",
          "Rédiger projet professionnel",
          "Rédiger lettres de motivation",
          "Préparer entretien Campus France",
          "Préparer dossier visa",
          "Corriger mon dossier",
          "Trouver une école privée",
        ],
        required: true,
      },
    ],
  },
];

export async function submitOnboarding(data: OnboardingData): Promise<void> {
  const response = await authenticatedFetch(
    "/api/private/onboarding",
    {
      body: JSON.stringify({ data }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible d'enregistrer l'onboarding.");
  }
}
