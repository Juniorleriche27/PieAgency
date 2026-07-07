export type SeoLongPage = {
  slug: string;
  parentPath: string;
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  audience: string;
  heroCta: string;
  sections: Array<{ title: string; body: string[] }>;
  checklist: string[];
  mistakes: string[];
  faq: Array<{ question: string; answer: string }>;
  related: Array<{ label: string; href: string; description: string }>;
};

export const seoLongPages: Record<string, SeoLongPage> = {
  "campus-france/dossier-campus-france": {
    slug: "campus-france/dossier-campus-france",
    parentPath: "/campus-france",
    title: "Dossier Campus France : construire un dossier cohérent et convaincant",
    shortTitle: "Dossier Campus France",
    description:
      "Guide PieAgency pour préparer un dossier Campus France cohérent : projet d’études, choix des formations, documents, CV, lettres et entretien.",
    keywords: [
      "dossier Campus France",
      "préparer dossier Campus France",
      "accompagnement Campus France",
      "choix des formations Campus France",
      "lettre de motivation Campus France",
      "CV Campus France",
    ],
    audience: "Étudiants africains et francophones qui préparent une candidature Campus France.",
    heroCta: "Faire vérifier mon dossier",
    sections: [
      {
        title: "Un dossier Campus France doit raconter une trajectoire logique",
        body: [
          "Un bon dossier Campus France ne se limite pas à déposer des documents. Il doit montrer une cohérence entre votre parcours, votre niveau, les formations choisies, votre projet professionnel et vos moyens de financement.",
          "Lorsque le dossier manque de logique, l’étudiant peut avoir de bons documents mais donner une impression confuse. C’est exactement ce que PieAgency cherche à corriger dès le diagnostic.",
        ],
      },
      {
        title: "Les éléments qui doivent être alignés",
        body: [
          "Le choix des formations doit correspondre à votre parcours académique, à vos notes, à vos expériences et à votre objectif professionnel. Une formation trop éloignée du profil doit être justifiée clairement.",
          "Les lettres de motivation doivent être personnalisées. Elles ne doivent pas répéter des phrases générales : elles doivent expliquer pourquoi cette formation, pourquoi cet établissement, pourquoi maintenant et comment cela sert votre projet.",
        ],
      },
      {
        title: "Pourquoi le diagnostic change tout",
        body: [
          "Avant de rédiger ou modifier les documents, il faut savoir ce qui bloque : incohérence du projet, mauvais choix de formations, CV faible, lettres trop générales, calendrier mal maîtrisé ou manque de préparation à l’entretien.",
          "Le diagnostic PieAgency sert à transformer un dossier dispersé en plan d’action : documents à renforcer, formations à ajuster, arguments à clarifier et prochaines étapes à suivre.",
        ],
      },
    ],
    checklist: [
      "Projet d’études clairement formulé",
      "Choix de formations cohérent avec le parcours",
      "CV étudiant lisible et orienté candidature",
      "Lettres de motivation personnalisées",
      "Documents académiques classés",
      "Arguments prêts pour l’entretien Campus France",
    ],
    mistakes: [
      "Choisir des formations sans lien avec le parcours",
      "Utiliser la même lettre pour toutes les candidatures",
      "Sous-estimer l’entretien Campus France",
      "Préparer les documents à la dernière minute",
      "Ne pas expliquer les changements d’orientation",
    ],
    faq: [
      {
        question: "Comment savoir si mon dossier Campus France est solide ?",
        answer:
          "Un dossier solide relie les notes, le parcours, les formations, les lettres, le CV et le projet professionnel. Si une partie contredit l’autre, il faut corriger avant la soumission.",
      },
      {
        question: "PieAgency peut-il choisir les formations avec moi ?",
        answer:
          "PieAgency aide à analyser le profil et à orienter vers des choix plus cohérents, en tenant compte du niveau, du projet, du pays, du budget et des délais.",
      },
      {
        question: "Faut-il préparer l’entretien avant ou après la soumission ?",
        answer:
          "Il faut l’anticiper dès la construction du dossier, car l’entretien vérifie justement la cohérence de ce qui a été soumis.",
      },
    ],
    related: [
      { label: "Préparer l’entretien Campus France", href: "/campus-france/entretien-campus-france", description: "Transformer le dossier en réponses claires." },
      { label: "Préparer le visa étudiant", href: "/visa", description: "Anticiper la suite après admission." },
      { label: "Diagnostic PieAgency", href: "/contact?source=long_page&intent=dossier-campus-france", description: "Faire analyser son dossier." },
    ],
  },
  "campus-france/entretien-campus-france": {
    slug: "campus-france/entretien-campus-france",
    parentPath: "/campus-france",
    title: "Entretien Campus France : préparer des réponses claires et crédibles",
    shortTitle: "Entretien Campus France",
    description:
      "Méthode PieAgency pour préparer l’entretien Campus France : projet, choix des formations, financement, motivation, retour et cohérence du dossier.",
    keywords: [
      "entretien Campus France",
      "préparer entretien Campus France",
      "questions entretien Campus France",
      "simulation entretien Campus France",
      "réussir entretien Campus France",
    ],
    audience: "Étudiants qui ont soumis ou préparent leur dossier Campus France et veulent éviter l’improvisation.",
    heroCta: "Préparer mon entretien",
    sections: [
      {
        title: "L’entretien vérifie la cohérence de votre projet",
        body: [
          "L’entretien Campus France n’est pas une simple formalité. Il permet de vérifier si l’étudiant comprend son projet, ses choix de formations, son budget, ses motivations et la suite logique après les études.",
          "Un étudiant peut avoir de bons documents mais perdre en crédibilité s’il ne sait pas expliquer pourquoi il a choisi une formation, une ville ou un parcours.",
        ],
      },
      {
        title: "Les questions sensibles doivent être préparées",
        body: [
          "Les questions sur le financement, le logement, les résultats scolaires, les changements d’orientation, le projet professionnel et le retour de projet doivent être préparées avec précision.",
          "L’objectif n’est pas d’apprendre un texte par cœur. L’objectif est de comprendre son propre dossier et de répondre avec calme, logique et honnêteté.",
        ],
      },
      {
        title: "La simulation permet de corriger avant le vrai entretien",
        body: [
          "Une simulation aide à repérer les réponses trop vagues, les contradictions, les hésitations et les arguments faibles. Elle permet aussi de reformuler avec des mots simples.",
          "PieAgency relie la préparation de l’entretien au dossier complet : formations, lettres, CV, documents et projet professionnel.",
        ],
      },
    ],
    checklist: [
      "Savoir expliquer son parcours académique",
      "Justifier chaque choix de formation",
      "Présenter un projet professionnel crédible",
      "Expliquer le financement et le logement",
      "Préparer les changements d’orientation",
      "S’entraîner à répondre simplement",
    ],
    mistakes: [
      "Répondre avec des phrases apprises sans comprendre",
      "Ne pas connaître les formations choisies",
      "Donner un projet professionnel trop vague",
      "Éviter les questions sur le budget",
      "Improviser le jour de l’entretien",
    ],
    faq: [
      {
        question: "Quelles questions reviennent souvent à l’entretien Campus France ?",
        answer:
          "Les questions portent souvent sur le parcours, les formations choisies, le projet professionnel, le financement, le logement, les motivations et la cohérence du retour de projet.",
      },
      {
        question: "Faut-il apprendre les réponses par cœur ?",
        answer:
          "Non. Il faut comprendre les réponses et savoir les expliquer naturellement. Une réponse récitée peut sembler fragile si l’agent pose une question de relance.",
      },
      {
        question: "PieAgency fait-il des simulations ?",
        answer:
          "PieAgency aide à préparer les réponses, identifier les points faibles et simuler les questions importantes avant l’entretien.",
      },
    ],
    related: [
      { label: "Construire le dossier Campus France", href: "/campus-france/dossier-campus-france", description: "Revenir à la cohérence de base du dossier." },
      { label: "Visa étudiant", href: "/visa", description: "Préparer les étapes après admission." },
      { label: "Demander une simulation", href: "/contact?source=long_page&intent=entretien-campus-france", description: "Préparer l’entretien avec PieAgency." },
    ],
  },
  "visa/justificatifs-financiers": {
    slug: "visa/justificatifs-financiers",
    parentPath: "/visa",
    title: "Justificatifs financiers visa étudiant : organiser les preuves sans incohérence",
    shortTitle: "Justificatifs financiers visa étudiant",
    description:
      "Guide PieAgency pour préparer les justificatifs financiers d’un visa étudiant : ressources, garant, cohérence, budget, pièces et explications.",
    keywords: [
      "justificatifs financiers visa étudiant",
      "ressources suffisantes visa étudiant",
      "garant visa étudiant France",
      "dossier financier visa France",
      "preuve de ressources étudiant",
    ],
    audience: "Étudiants qui préparent une demande de visa étudiant France et doivent organiser leurs preuves financières.",
    heroCta: "Faire vérifier mes preuves financières",
    sections: [
      {
        title: "Les preuves financières doivent être lisibles et cohérentes",
        body: [
          "Dans un dossier visa étudiant, les justificatifs financiers doivent montrer que le projet est réaliste. Les pièces doivent être cohérentes avec le budget, la durée des études, l’hébergement et la situation du garant.",
          "Un dossier financier confus peut créer un doute même lorsque l’étudiant dispose réellement d’un soutien financier.",
        ],
      },
      {
        title: "Le garant doit être expliqué correctement",
        body: [
          "Lorsque le financement dépend d’un garant, il faut clarifier le lien avec l’étudiant, la capacité du garant, la régularité des revenus et la logique du soutien.",
          "Les documents ne doivent pas être simplement empilés. Ils doivent permettre à la personne qui lit le dossier de comprendre rapidement la situation.",
        ],
      },
      {
        title: "Budget, logement et admission doivent se répondre",
        body: [
          "Le budget présenté doit être compatible avec la ville, le logement, le coût de la formation et le mode de vie prévu. Les preuves financières ne sont pas isolées : elles doivent soutenir tout le projet.",
          "PieAgency aide à repérer les incohérences, les pièces manquantes et les explications nécessaires avant le dépôt.",
        ],
      },
    ],
    checklist: [
      "Preuves de revenus du garant ou de l’étudiant",
      "Lien clair entre garant et étudiant",
      "Budget estimatif cohérent",
      "Preuves bancaires lisibles",
      "Explication des ressources si nécessaire",
      "Cohérence avec logement et admission",
    ],
    mistakes: [
      "Fournir des documents sans explication",
      "Présenter un garant sans lien clair",
      "Oublier la cohérence entre budget et ville",
      "Attendre le dernier moment pour rassembler les pièces",
      "Sous-estimer les justificatifs de logement",
    ],
    faq: [
      {
        question: "Quels justificatifs financiers préparer pour un visa étudiant ?",
        answer:
          "Les justificatifs peuvent inclure preuves de revenus, relevés bancaires, attestation de prise en charge, lien avec le garant et tout document expliquant la capacité financière. La liste exacte dépend du pays et de la situation.",
      },
      {
        question: "Un garant est-il toujours obligatoire ?",
        answer:
          "Cela dépend de la situation financière de l’étudiant et des exigences du dossier. L’important est de présenter des ressources suffisantes et cohérentes avec le projet.",
      },
      {
        question: "PieAgency peut-il relire le dossier financier ?",
        answer:
          "PieAgency peut aider à organiser les pièces, repérer les incohérences et préparer les explications utiles avant le dépôt.",
      },
    ],
    related: [
      { label: "Hébergement visa étudiant", href: "/visa/hebergement-etudiant", description: "Préparer la preuve de logement." },
      { label: "Procédure visa", href: "/visa", description: "Voir l’accompagnement visa complet." },
      { label: "Diagnostic visa", href: "/contact?source=long_page&intent=justificatifs-financiers", description: "Faire vérifier les preuves." },
    ],
  },
  "visa/hebergement-etudiant": {
    slug: "visa/hebergement-etudiant",
    parentPath: "/visa",
    title: "Hébergement visa étudiant : bail, attestation et preuve de logement",
    shortTitle: "Hébergement visa étudiant",
    description:
      "Guide PieAgency pour préparer la preuve d’hébergement d’un visa étudiant : bail, attestation, logement temporaire, cohérence avec la ville et le budget.",
    keywords: [
      "hébergement visa étudiant",
      "attestation hébergement visa étudiant",
      "contrat de bail visa étudiant",
      "preuve logement visa France",
      "logement étudiant France visa",
    ],
    audience: "Étudiants qui doivent prouver leur hébergement pour une demande de visa étudiant France.",
    heroCta: "Vérifier mon hébergement",
    sections: [
      {
        title: "L’hébergement doit être crédible pour le projet d’études",
        body: [
          "La preuve de logement doit correspondre à la ville d’études, au calendrier d’arrivée et au budget présenté. Un logement trop éloigné, mal expliqué ou incomplet peut fragiliser le dossier.",
          "L’objectif est de montrer que l’étudiant a anticipé son installation et que le projet est réaliste dès l’arrivée.",
        ],
      },
      {
        title: "Bail, attestation ou solution temporaire : il faut expliquer",
        body: [
          "Selon la situation, l’étudiant peut présenter un bail, une réservation, une attestation d’hébergement ou une solution temporaire. Ce qui compte, c’est la clarté et la cohérence des pièces.",
          "Si l’hébergement est fourni par un proche, il faut souvent expliquer le lien, l’adresse, la durée prévue et la capacité d’accueil.",
        ],
      },
      {
        title: "Le logement est lié aux justificatifs financiers",
        body: [
          "Le coût du logement influence le budget global. Une preuve d’hébergement doit donc être cohérente avec les ressources financières, la ville et le type d’établissement.",
          "PieAgency aide à vérifier si l’hébergement présenté renforce le dossier ou s’il crée une question supplémentaire à anticiper.",
        ],
      },
    ],
    checklist: [
      "Adresse claire et cohérente avec la ville d’études",
      "Document lisible : bail, attestation ou réservation",
      "Durée d’hébergement indiquée",
      "Lien avec l’hébergeant si nécessaire",
      "Budget logement cohérent",
      "Explication si solution temporaire",
    ],
    mistakes: [
      "Présenter une adresse trop éloignée sans explication",
      "Fournir une attestation incomplète",
      "Oublier le lien avec l’hébergeant",
      "Ne pas relier logement et budget",
      "Changer de solution sans clarifier le dossier",
    ],
    faq: [
      {
        question: "Quelle preuve de logement fournir pour un visa étudiant ?",
        answer:
          "Cela peut être un bail, une réservation, une attestation d’hébergement ou une autre preuve adaptée. Le document doit être clair, crédible et cohérent avec le projet d’études.",
      },
      {
        question: "Une attestation d’hébergement suffit-elle ?",
        answer:
          "Elle peut être utile selon la situation, mais elle doit être complète et cohérente. Il faut souvent expliquer le lien avec l’hébergeant, l’adresse et la durée.",
      },
      {
        question: "Pourquoi le logement influence-t-il le visa ?",
        answer:
          "Le logement montre que l’étudiant a anticipé son arrivée. Il influence aussi le budget et la crédibilité générale du projet.",
      },
    ],
    related: [
      { label: "Justificatifs financiers", href: "/visa/justificatifs-financiers", description: "Relier logement et ressources." },
      { label: "Procédure visa", href: "/visa", description: "Voir toute la préparation visa." },
      { label: "Diagnostic logement", href: "/contact?source=long_page&intent=hebergement-etudiant", description: "Faire vérifier la cohérence." },
    ],
  },
};

export function getSeoLongPage(slug: string) {
  return seoLongPages[slug];
}

export const seoLongPageList = Object.values(seoLongPages);
