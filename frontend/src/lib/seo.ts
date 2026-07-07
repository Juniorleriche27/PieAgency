export const SITE_URL = "https://pieagency.fr";

export const siteKeywords = [
  "accompagnement Campus France",
  "dossier Campus France",
  "entretien Campus France",
  "visa étudiant France",
  "accompagnement visa étudiant",
  "étudier en Belgique",
  "Campus Belgique",
  "lettre de motivation Campus France",
  "CV étudiant France",
  "logement étudiant visa",
  "justificatifs financiers visa étudiant",
  "bourse étudiant étranger",
  "accompagnement étudiant Afrique France",
  "PieAgency",
];

export const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/campus-france", priority: 0.95, changeFrequency: "weekly" as const },
  { path: "/campus-france/entretien-campus-france", priority: 0.86, changeFrequency: "weekly" as const },
  { path: "/campus-france/dossier-campus-france", priority: 0.88, changeFrequency: "weekly" as const },
  { path: "/visa", priority: 0.92, changeFrequency: "weekly" as const },
  { path: "/visa/hebergement-etudiant", priority: 0.84, changeFrequency: "weekly" as const },
  { path: "/visa/justificatifs-financiers", priority: 0.86, changeFrequency: "weekly" as const },
  { path: "/belgique", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/paris-saclay", priority: 0.72, changeFrequency: "monthly" as const },
  { path: "/parcoursup", priority: 0.72, changeFrequency: "monthly" as const },
  { path: "/ecoles", priority: 0.72, changeFrequency: "monthly" as const },
  { path: "/communaute", priority: 0.78, changeFrequency: "weekly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/paiement", priority: 0.45, changeFrequency: "monthly" as const },
  { path: "/partenariat", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
];

type ServiceSeoProfile = {
  keywords: string[];
  intents: string[];
  relatedLinks: Array<{ label: string; href: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const serviceSeoProfiles: Record<string, ServiceSeoProfile> = {
  "campus-france": {
    keywords: [
      "accompagnement Campus France",
      "dossier Campus France",
      "choix des formations Campus France",
      "lettre de motivation Campus France",
      "entretien Campus France",
    ],
    intents: [
      "Comprendre si son projet d’études est cohérent avant de soumettre le dossier.",
      "Choisir des formations réalistes selon le niveau, le budget et le projet professionnel.",
      "Préparer l’entretien Campus France avec des réponses claires et défendables.",
    ],
    relatedLinks: [
      { label: "Préparer le visa étudiant", href: "/visa", description: "Anticiper les justificatifs après l’admission." },
      { label: "Créer son espace étudiant", href: "/connexion?mode=sign-up&next=/espace-etudiant/diagnostic", description: "Suivre diagnostic, documents et prochaines étapes." },
      { label: "Poser une question PieHUB", href: "/communaute", description: "Échanger avec la communauté et le Guide PieHUB." },
    ],
    faq: [
      {
        question: "Comment savoir si mon dossier Campus France est cohérent ?",
        answer: "Un dossier cohérent relie le parcours passé, le choix des formations, le projet professionnel, le niveau académique et les documents fournis. PieAgency commence par un diagnostic pour identifier les faiblesses avant la soumission.",
      },
      {
        question: "Pourquoi préparer l’entretien Campus France à l’avance ?",
        answer: "L’entretien vérifie la cohérence du projet. Une préparation permet de clarifier les motivations, les choix de formations, le financement et le retour de projet sans improviser.",
      },
    ],
  },
  visa: {
    keywords: [
      "visa étudiant France",
      "dossier visa étudiant",
      "justificatifs financiers visa",
      "hébergement visa étudiant",
      "lettre explicative visa étudiant",
    ],
    intents: [
      "Vérifier les pièces sensibles avant le dépôt visa.",
      "Organiser les preuves financières et l’hébergement de manière lisible.",
      "Expliquer clairement le projet et réduire les contradictions du dossier.",
    ],
    relatedLinks: [
      { label: "Campus France", href: "/campus-france", description: "Relier admission, projet et dossier visa." },
      { label: "Diagnostic visa", href: "/contact?source=seo_service&intent=visa", description: "Faire relire les points faibles avant dépôt." },
      { label: "Espace documents", href: "/connexion?mode=sign-up&next=/espace-etudiant/documents", description: "Préparer les pièces dans un espace suivi." },
    ],
    faq: [
      {
        question: "Quels documents sont sensibles dans un dossier visa étudiant ?",
        answer: "Les preuves financières, l’hébergement, l’admission, le projet d’études et les lettres explicatives sont particulièrement sensibles car ils doivent être cohérents entre eux.",
      },
      {
        question: "PieAgency dépose-t-il le visa à la place de l’étudiant ?",
        answer: "Non. L’étudiant reste responsable du dépôt. PieAgency aide à préparer, relire et structurer les éléments du dossier avant le dépôt.",
      },
    ],
  },
  belgique: {
    keywords: [
      "étudier en Belgique",
      "Campus Belgique",
      "visa étudiant Belgique",
      "universités belges étudiants africains",
      "hautes écoles Belgique",
    ],
    intents: [
      "Comprendre les options belges selon son profil et son budget.",
      "Identifier les écoles, documents et délais à traiter en priorité.",
      "Comparer Belgique et France avant de lancer une procédure.",
    ],
    relatedLinks: [
      { label: "Comparer avec Campus France", href: "/campus-france", description: "Choisir la stratégie la plus cohérente." },
      { label: "Demander un diagnostic Belgique", href: "/contact?source=seo_service&intent=belgique", description: "Obtenir une orientation de départ." },
      { label: "Voir les questions fréquentes", href: "/faq", description: "Comprendre les démarches générales." },
    ],
    faq: [
      {
        question: "La Belgique est-elle une bonne alternative à la France ?",
        answer: "Oui pour certains profils, mais le choix dépend du niveau, du budget, du calendrier, du type d’école et du projet professionnel. Un diagnostic permet de choisir sans partir au hasard.",
      },
      {
        question: "Quels éléments préparer pour étudier en Belgique ?",
        answer: "Il faut clarifier le projet, les écoles ciblées, les documents académiques, les preuves de financement et les étapes de visa ou de séjour selon la situation.",
      },
    ],
  },
};

export function getServiceSeoProfile(slug: string): ServiceSeoProfile {
  return serviceSeoProfiles[slug] ?? {
    keywords: siteKeywords,
    intents: [
      "Clarifier le profil avant de choisir une procédure.",
      "Préparer des documents cohérents et lisibles.",
      "Transformer une intention d’étude en plan d’action suivi.",
    ],
    relatedLinks: [
      { label: "Diagnostic PieAgency", href: "/contact?source=seo_service&intent=diagnostic", description: "Commencer par une analyse du profil." },
      { label: "Campus France", href: "/campus-france", description: "Préparer un dossier vers la France." },
      { label: "Visa étudiant", href: "/visa", description: "Anticiper le dossier visa." },
    ],
    faq: [
      {
        question: "Comment choisir le bon accompagnement étudiant ?",
        answer: "Le bon accompagnement dépend du pays visé, du niveau d’études, des documents disponibles, du budget et des délais. PieAgency commence par un diagnostic pour orienter la demande.",
      },
    ],
  };
}
