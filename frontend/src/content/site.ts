export type ActionVariant =
  | "primary"
  | "gold"
  | "outline"
  | "outlineWhite"
  | "green"
  | "waTogo"
  | "waFrance";

export type TimelineStep = {
  title: string;
  description: string;
};

export type ServicePage = {
  slug: string;
  number: string;
  shortTitle: string;
  heroTitle: string;
  heroDescription: string;
  summary: string;
  badge: string;
  theme: "navy" | "gold";
  timeline?: TimelineStep[];
  infoBlocks?: { title: string; description: string }[];
  alert?: { title: string; description: string };
  primaryCta: { label: string; href: string; variant: ActionVariant };
  secondaryCta: {
    label: string;
    href: string;
    variant: ActionVariant;
    external?: boolean;
  };
};

export const company = {
  name: "PieAgency",
  tagline:
    "Accompagnement étudiant vers la France et la Belgique, avec une approche claire, humaine et structurée.",
  emails: {
    primary: "contact@pieagency.fr",
    secondary: "junior.pieagency@gmail.com",
  },
  contacts: {
    france: {
      label: "France",
      flag: "🇫🇷",
      person: "Ibrahim B.",
      phoneDisplay: "(+33) 6 35 32 04 40",
      phoneHref: "tel:+33635320440",
      whatsappHref: "https://wa.me/33635320440",
    },
    togo: {
      label: "Togo",
      flag: "🇹🇬",
      person: "Junior L.",
      phoneDisplay: "+228 92 09 25 72",
      phoneHref: "tel:+22892092572",
      whatsappHref: "https://wa.me/22892092572",
    },
  },
  communityLinks: [
    {
      label: "Communauté WhatsApp",
      description:
        "Rejoignez notre espace d’échange principal pour suivre les informations utiles, les conseils et les actualités de PieAgency.",
      href: "https://chat.whatsapp.com/DWwuJQP3ym9JW4OZj11H1C",
      cta: "Rejoindre la communauté",
      icon: "💬",
      iconClass: "wa",
      variant: "green" as ActionVariant,
    },
    {
      label: "Groupe Facebook",
      description:
        "Un espace d’échange pour mieux suivre les discussions, les conseils et les opportunités partagées par la communauté.",
      href: "https://web.facebook.com/groups/8418722288154510/",
      cta: "Accéder au groupe",
      icon: "👥",
      iconClass: "fb-group",
      variant: "primary" as ActionVariant,
    },
    {
      label: "Page Facebook officielle",
      description:
        "Retrouvez les informations, les publications et toute l’actualité officielle de PieAgency sur notre page.",
      href: "https://web.facebook.com/profile.php?id=61564375512991",
      cta: "Voir la page",
      icon: "📢",
      iconClass: "fb-page",
      variant: "outline" as ActionVariant,
    },
  ],
};

export const navigation = [
  { label: "Accueil", href: "/" },
  { label: "Campus France", href: "/campus-france" },
  { label: "Visa", href: "/visa" },
  { label: "Campus Belgique", href: "/belgique" },
  { label: "Paris-Saclay", href: "/paris-saclay" },
  { label: "Parcoursup", href: "/parcoursup" },
  { label: "Écoles privées", href: "/ecoles" },
  { label: "Communauté", href: "/communaute" },
  { label: "FAQ", href: "/faq" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const homeApproach = [
  {
    icon: "🔎",
    title: "Analyse du profil",
    description:
      "Chaque dossier commence par une lecture attentive du parcours et du projet de l’étudiant.",
  },
  {
    icon: "📄",
    title: "Dossier structuré",
    description:
      "Les documents sont préparés avec soin, dans un ordre logique et cohérent avec la procédure visée.",
  },
  {
    icon: "🤝",
    title: "Accompagnement humain",
    description: "Un suivi direct, clair et accessible, sans intermédiaire inutile.",
  },
  {
    icon: "🌍",
    title: "Suivi Togo / France",
    description:
      "Présence sur deux continents pour rester proche des étudiants avant et après le départ.",
  },
] as const;

export const homeMethodSteps = [
  {
    title: "Diagnostic",
    description:
      "Analyse du profil, du parcours et du projet d’études de l’étudiant.",
  },
  {
    title: "Préparation du dossier",
    description:
      "Rédaction des documents, structuration du dossier selon la procédure.",
  },
  {
    title: "Soumission et orientation",
    description:
      "Accompagnement à la soumission, ajustements si nécessaire.",
  },
  {
    title: "Suivi et accompagnement final",
    description:
      "Préparation à l’entretien, suivi et soutien jusqu’aux étapes décisives.",
  },
] as const;

export const homeStudentSpaceFeatures = [
  "Statut du dossier en temps réel",
  "Checklist des documents à fournir",
  "Étapes à venir clairement indiquées",
  "Corrections et retours du conseiller",
  "Suivi des rendez-vous importants",
  "Historique des échanges",
] as const;

export const servicePages: ServicePage[] = [
  {
    slug: "campus-france",
    number: "01",
    shortTitle: "Accompagnement Campus France",
    heroTitle: "Accompagnement Campus France",
    heroDescription:
      "Une démarche structurée pour construire un dossier cohérent, choisir les bonnes formations et mieux se préparer aux étapes importantes.",
    summary:
      "Analyse du dossier, choix des formations, rédaction de lettres, correction du CV, soumission et préparation à l’entretien.",
    badge: "Campus France",
    theme: "navy",
    timeline: [
      {
        title: "Analyse du dossier complet",
        description:
          "Lecture détaillée des relevés, du parcours et du projet de l’étudiant.",
      },
      {
        title: "Formulation du projet d’études et professionnel",
        description:
          "Définir un projet clair, cohérent et bien articulé pour la procédure.",
      },
      {
        title: "Choix des formations et des universités",
        description:
          "Sélection adaptée au profil, au niveau et au projet de l’étudiant.",
      },
      {
        title: "Rédaction des lettres de motivation",
        description:
          "Des lettres structurées, personnalisées et adaptées aux formations visées.",
      },
      {
        title: "Correction du CV de l’étudiant",
        description:
          "Mise en forme professionnelle et cohérente avec les candidatures.",
      },
      {
        title: "Soumission du dossier en ligne",
        description:
          "Accompagnement dans la démarche de soumission sur la plateforme Campus France.",
      },
      {
        title: "Préparation à l’entretien Campus France",
        description:
          "Simulation d’entretien, conseils et préparation pour l’étape décisive.",
      },
    ],
    primaryCta: {
      label: "Demander un accompagnement",
      href: "/contact",
      variant: "primary",
    },
    secondaryCta: {
      label: "📱 Commencer sur WhatsApp",
      href: company.contacts.togo.whatsappHref,
      variant: "green",
      external: true,
    },
  },
  {
    slug: "visa",
    number: "02",
    shortTitle: "Procédure Visa",
    heroTitle: "Procédure Visa",
    heroDescription:
      "Un accompagnement utile pour mieux préparer votre demande de visa avec méthode et clarté.",
    summary:
      "Rédaction des lettres, aide à la justification d’hébergement et de financement, analyse du dossier visa et accompagnement préparatoire.",
    badge: "Procédure Visa",
    theme: "navy",
    timeline: [
      {
        title: "Rédaction de la lettre de motivation pour le visa",
        description: "Un document adapté aux exigences consulaires.",
      },
      {
        title: "Rédaction de lettre explicative si nécessaire",
        description:
          "Pour clarifier certains éléments du dossier si besoin.",
      },
      {
        title: "Guide pour justifier l’hébergement",
        description:
          "Aide à la constitution des justificatifs d’hébergement ou du contrat de bail.",
      },
      {
        title: "Guide pour justifier les ressources suffisantes",
        description:
          "Structurer les preuves financières de manière convaincante.",
      },
      {
        title: "Analyse générale du dossier visa",
        description:
          "Lecture globale pour identifier les points à renforcer.",
      },
      {
        title: "Dépôt des dossiers par l’étudiant",
        description:
          "L’étudiant effectue lui-même le dépôt final du dossier.",
      },
      {
        title: "Guide de stabilisation financière et recherche d’emploi",
        description:
          "Conseils pratiques pour mieux s’organiser à l’arrivée en France.",
      },
    ],
    alert: {
      title: "À noter",
      description:
        "Le dépôt final du dossier reste effectué par l’étudiant. L’accompagnement proposé vise à mieux préparer les éléments du dossier et non à se substituer aux démarches administratives officielles.",
    },
    primaryCta: {
      label: "Préparer mon dossier",
      href: "/contact",
      variant: "primary",
    },
    secondaryCta: {
      label: "💬 Parler à un conseiller",
      href: company.contacts.togo.whatsappHref,
      variant: "green",
      external: true,
    },
  },
  {
    slug: "belgique",
    number: "03",
    shortTitle: "Campus Belgique",
    heroTitle: "Accompagnement Campus Belgique 🇧🇪",
    heroDescription:
      "Un appui structuré pour mieux préparer votre projet et avancer vers les études en Belgique.",
    summary:
      "Accompagnement dans la préparation du projet et du dossier pour les démarches d’études en Belgique.",
    badge: "🇧🇪 Belgique",
    theme: "gold",
    infoBlocks: [
      {
        title: "Pour qui ?",
        description:
          "Cet accompagnement s’adresse aux étudiants qui souhaitent construire un projet cohérent vers la Belgique, comprendre les démarches et préparer un dossier structuré.",
      },
      {
        title: "Ce que nous faisons",
        description:
          "Nous aidons à structurer le projet, mieux présenter le profil et mieux préparer les éléments utiles au dossier pour les démarches académiques en Belgique.",
      },
      {
        title: "Comment démarrer ?",
        description:
          "Un premier échange permet de comprendre la situation de l’étudiant et d’identifier l’accompagnement le plus adapté à son projet.",
      },
    ],
    primaryCta: {
      label: "Envoyer une demande",
      href: "/contact",
      variant: "primary",
    },
    secondaryCta: {
      label: "📱 Démarrer sur WhatsApp",
      href: company.contacts.togo.whatsappHref,
      variant: "waTogo",
      external: true,
    },
  },
  {
    slug: "paris-saclay",
    number: "04",
    shortTitle: "Paris-Saclay",
    heroTitle: "Accompagnement Paris-Saclay 🎓",
    heroDescription:
      "Un accompagnement ciblé pour les étudiants qui souhaitent mieux préparer leur candidature vers Paris-Saclay.",
    summary:
      "Appui ciblé pour les candidatures vers Paris-Saclay, avec une attention portée au dossier, au projet et aux attentes de la formation.",
    badge: "🎓 Paris-Saclay",
    theme: "navy",
    infoBlocks: [
      {
        title: "Comprendre les attentes",
        description:
          "Chaque candidature demande une lecture attentive des exigences et du niveau attendu par la formation visée. C’est la première étape pour bien se positionner.",
      },
      {
        title: "Valoriser le profil",
        description:
          "L’objectif est d’aider l’étudiant à mieux présenter son parcours, son projet et la cohérence de sa demande de manière claire et convaincante.",
      },
      {
        title: "Construire une candidature cohérente",
        description:
          "PieAgency aide à mieux organiser le dossier et à avancer avec une logique plus claire, adaptée aux attentes spécifiques de Paris-Saclay.",
      },
    ],
    primaryCta: {
      label: "Demander un accompagnement",
      href: "/contact",
      variant: "primary",
    },
    secondaryCta: {
      label: "📱 Démarrer sur WhatsApp",
      href: company.contacts.togo.whatsappHref,
      variant: "green",
      external: true,
    },
  },
  {
    slug: "parcoursup",
    number: "05",
    shortTitle: "Parcoursup",
    heroTitle: "Accompagnement Parcoursup 📋",
    heroDescription:
      "Une aide utile pour mieux choisir ses formations et mieux préparer son dossier.",
    summary:
      "Aide au choix des formations, compréhension de la procédure et préparation du dossier.",
    badge: "📋 Parcoursup",
    theme: "navy",
    infoBlocks: [
      {
        title: "Orientation",
        description:
          "Le premier enjeu est de mieux comprendre les choix possibles selon le profil et le projet de l’étudiant, pour éviter les erreurs d’orientation.",
      },
      {
        title: "Choix des formations",
        description:
          "L’accompagnement vise à aider l’étudiant à faire des choix plus cohérents, en accord avec son niveau, ses ambitions et les réalités du marché.",
      },
      {
        title: "Aide au dossier",
        description:
          "PieAgency accompagne la préparation des éléments demandés dans le cadre de la procédure Parcoursup, notamment la lettre de motivation.",
      },
    ],
    primaryCta: {
      label: "Envoyer une demande",
      href: "/contact",
      variant: "primary",
    },
    secondaryCta: {
      label: "📱 Démarrer sur WhatsApp",
      href: company.contacts.togo.whatsappHref,
      variant: "waTogo",
      external: true,
    },
  },
  {
    slug: "ecoles",
    number: "06",
    shortTitle: "Écoles privées France",
    heroTitle: "Accompagnement Écoles privées France 🏫",
    heroDescription:
      "Une option d’accompagnement pour identifier des écoles adaptées au profil et préparer une candidature cohérente.",
    summary:
      "Accompagnement pour identifier des écoles adaptées au profil de l’étudiant et préparer une candidature cohérente.",
    badge: "🏫 Écoles privées",
    theme: "gold",
    infoBlocks: [
      {
        title: "Pourquoi cette voie ?",
        description:
          "Les écoles privées peuvent représenter une option utile selon le projet, le parcours et les contraintes de l’étudiant. Cette voie offre parfois plus de souplesse et de réactivité.",
      },
      {
        title: "Ce que nous faisons",
        description:
          "PieAgency aide à identifier des options plus adaptées et à mieux préparer la candidature en tenant compte du profil, du budget et du projet professionnel.",
      },
      {
        title: "Comment avancer ?",
        description:
          "Un échange permet de comprendre le profil, les attentes et les possibilités à envisager pour construire une stratégie de candidature cohérente.",
      },
    ],
    primaryCta: {
      label: "Demander un accompagnement",
      href: "/contact",
      variant: "primary",
    },
    secondaryCta: {
      label: "📱 Démarrer sur WhatsApp",
      href: company.contacts.togo.whatsappHref,
      variant: "green",
      external: true,
    },
  },
];

export const serviceCards = servicePages.map((page) => ({
  slug: page.slug,
  number: page.number,
  shortTitle: page.shortTitle,
  summary: page.summary,
}));

export const faqItems = [
  {
    question: "Quels types d’accompagnement propose PieAgency ?",
    answer:
      "PieAgency accompagne les étudiants sur les démarches Campus France, la procédure visa, Campus Belgique, Paris-Saclay, Parcoursup et les écoles privées en France.",
  },
  {
    question: "Est-ce que l’accompagnement est personnalisé ?",
    answer:
      "Oui. Chaque accompagnement tient compte du profil de l’étudiant, de son niveau, de son projet et de la procédure concernée.",
  },
  {
    question: "Peut-on échanger directement sur WhatsApp ?",
    answer:
      "Oui. PieAgency met à disposition un contact WhatsApp Togo et un contact WhatsApp France pour faciliter les échanges.",
  },
  {
    question: "Aidez-vous pour la préparation à l’entretien Campus France ?",
    answer:
      "Oui. La préparation à l’entretien Campus France fait partie intégrante de l’accompagnement proposé, avec des simulations et des conseils adaptés.",
  },
  {
    question: "Aidez-vous aussi pour la procédure visa ?",
    answer:
      "Oui. PieAgency accompagne les étudiants dans la préparation des éléments utiles au dossier visa, notamment les lettres, l’hébergement, les ressources et l’analyse générale du dossier.",
  },
  {
    question: "PieAgency est-il présent au Togo et en France ?",
    answer:
      "Oui. PieAgency dispose d’un point de contact au Togo (Junior L., +228 92 09 25 72) et d’un point de contact en France (Ibrahim B., +33 6 35 32 04 40) pour rester plus proche des étudiants.",
  },
  {
    question: "Comment démarrer un accompagnement ?",
    answer:
      "Il suffit de contacter l’équipe sur WhatsApp ou via le formulaire de contact du site. Un premier échange permet d’analyser le profil et d’identifier l’accompagnement adapté.",
  },
] as const;

export const aboutValues = [
  {
    title: "Notre vision",
    description:
      "Nous voulons rendre l’accompagnement étudiant plus clair, plus structuré et plus humain. Chaque étudiant mérite un appui sérieux, accessible et adapté à sa situation, quelle que soit son origine ou son niveau.",
  },
  {
    title: "Notre approche",
    description:
      "Chaque étudiant est accompagné avec une logique de progression, de cohérence et de clarté. Nous ne promettons pas l’impossible. Nous aidons à construire un dossier solide, à choisir les bonnes formations et à avancer avec méthode.",
  },
] as const;

export const studyLevels = [
  "Baccalauréat",
  "Licence / Bachelor",
  "Master",
  "Doctorat",
  "Autre",
] as const;

export const projectOptions = [
  "Campus France",
  "Procédure Visa",
  "Campus Belgique",
  "Paris-Saclay",
  "Parcoursup",
  "Écoles privées France",
  "Autre",
] as const;

export function getServicePage(slug: string) {
  return servicePages.find((page) => page.slug === slug);
}
