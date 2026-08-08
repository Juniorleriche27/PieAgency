"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { company } from "@/content/site";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  CommunityStatus,
  CommunityToastRegion,
  type CommunityLoadState,
  type CommunityToast,
} from "@/components/community/community-feedback";
import {
  CommunityMobileNavigation,
  type CommunityMainTab,
} from "@/components/community/community-mobile-navigation";
import { getApiBaseUrl, onAuthSessionChange } from "@/lib/auth";
import {
  createCommunityComment,
  createCommunityStory,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  deleteCommunityStory,
  fetchCommunityAssistantThread,
  fetchCommunityBootstrap,
  fetchCommunityDirectThread,
  fetchCommunityDirectThreads,
  fetchCommunityEventsCalendar,
  fetchCommunityGroups,
  fetchCommunityGroupMembers,
  updateCommunityGroupMemberRole,
  removeCommunityGroupMember,
  fetchCommunityNotifications,
  markCommunityNotificationRead,
  markAllCommunityNotificationsRead,
  toggleCommunityUserBlock,
  fetchCommunityUserBlocks,
  createCommunityGroup,
  createCommunityEvent,
  toggleCommunityGroupMembership,
  toggleCommunityEventAttendance,
  sendCommunityAssistantMessage,
  sendCommunityDirectMessage,
  toggleCommunityReaction,
  toggleCommunityProfileFollow,
  voteCommunityPoll,
  fetchCommunityAds,
  createCommunityAd,
  rewriteWithAI,
  reportCommunityContent,
  registerCommunityPostShare,
  toggleCommunityCommentReaction,
  updateCommunityComment,
  updateCommunityPost,
  uploadCommunityAsset,
  fetchGroupPosts,
  type CommunityGroupItem as ApiGroupItem,
  type CommunityGroupMemberItem,
  type CommunityEventCalendarItem as ApiEventItem,
  type CommunityDirectThreadItem,
  type CommunityNotificationItem,
  type CommunityAdItem,
  type CommunityStoryItem,
} from "@/lib/community";

type MainTab = CommunityMainTab;
type ExplorerTab = "posts" | "membres" | "hashtags";
type GroupDetailTab = "posts" | "membres" | "ressources" | "evenements";
type FeedFilter = "all" | "open" | "answered" | "official" | "popular";
type ComposeMode = "question" | "text" | "doc" | "poll" | "event" | "story";
type TagKey = "campus" | "visa" | "vie" | "logement" | "temoignage";

type UserProfile = {
  id: string;
  name: string;
  tag: string;
  country: string;
  city: string;
  bio: string;
  avatar: string;
  color: string;
  followers: number;
  following: number;
  posts: number;
  tags: string[];
  viewerIsFollowing?: boolean;
  stageLabel?: string;
  activityLabel?: string;
  lastActiveLabel?: string | null;
  isOfficial?: boolean;
  isAi?: boolean;
};

type SocialComment = {
  id?: number;
  userId: string;
  text: string;
  time: string;
  likes: number;
  isPending?: boolean;
  isOfficial?: boolean;
  isAiGenerated?: boolean;
  isPinned?: boolean;
  trustLabel?: string | null;
  viewerHasLiked?: boolean;
  viewerCanEdit?: boolean;
};

type PostBase = {
  id: number;
  userId: string;
  tag: TagKey;
  time: string;
  likes: number;
  comments: SocialComment[];
  shares: number;
  isQuestion?: boolean;
  questionStatus?: "open" | "answered" | "official_answered" | null;
  answerCount?: number;
  hasOfficialAnswer?: boolean;
  officialAnswerCount?: number;
  resolvedByOfficial?: boolean;
  trustLabel?: string | null;
  pinnedOfficialComment?: SocialComment | null;
  viewerHasLiked?: boolean;
  viewerHasSaved?: boolean;
  viewerPollVote?: number | null;
  groupId?: string | null;
  viewerCanEdit?: boolean;
  mediaUrls?: string[];
};

type TextPost = PostBase & {
  type: "text";
  content: string;
};

type ResourcePost = PostBase & {
  type: "resource";
  content: string;
  resourceName: string;
  resourceType: "pdf" | "doc";
  resourceSize: string;
  resourceUrl?: string | null;
  resourceMimeType?: string | null;
};

type PollPost = PostBase & {
  type: "poll";
  question: string;
  options: { text: string; votes: number }[];
};

type SocialPost = TextPost | ResourcePost | PollPost;

type StoryItem = {
  id?: string;
  userId: string;
  content: string;
  add?: boolean;
  createdAt?: number;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  viewerCanDelete?: boolean;
};

type GroupItem = {
  icon: string;
  name: string;
  desc: string;
  members: number;
  joined: boolean;
  color: string;
};

type EventItem = {
  day: string;
  month: string;
  name: string;
  desc: string;
  time: string;
  attendees: number;
  joined: boolean;
};

type ResourceItem = {
  icon: string;
  name: string;
  type: string;
  size: string;
  author: string;
  downloads: number;
};

type MessageItem = {
  from: "me" | "them";
  text: string;
  time: string;
  readAt?: string | null;
};

type ReportTarget = {
  targetType: "post" | "comment" | "ad" | "profile";
  targetId: string;
  label: string;
};

type EditTarget = {
  kind: "post" | "comment";
  id: number;
  postId: number;
  tag?: TagKey;
  isPoll?: boolean;
};

const VISITOR_PROFILE: UserProfile = {
  id: "visitor",
  name: "Visiteur PieHUB",
  tag: "Découverte",
  country: "Communauté publique",
  city: "",
  bio: "Connectez-vous pour publier et personnaliser votre réseau.",
  avatar: "PIE",
  color: "#0d1b38",
  followers: 0,
  following: 0,
  posts: 0,
  tags: [],
  activityLabel: "Visiteur",
};

const USERS: UserProfile[] = [
  {
    id: "moi",
    name: "Moi — Etudiant",
    tag: "@moi_piehub",
    country: "Togo 🇹🇬",
    city: "Lome",
    bio: "Etudiant en recherche d'accompagnement. Membre actif de la communaute PieAgency.",
    avatar: "MO",
    color: "#C8952A",
    followers: 847,
    following: 312,
    posts: 128,
    tags: ["Campus France", "Togo", "Projet d'etudes"],
  },
  {
    id: "piehub",
    name: "Guide PieHUB",
    tag: "@piehub_guide",
    country: "Equipe PieAgency",
    city: "En ligne",
    bio: "Profil officiel du hub communautaire PieAgency. Je reponds, j'oriente et je vous dirige vers le bon canal pour avancer.",
    avatar: "PH",
    color: "#0D1B38",
    followers: 5400,
    following: 12,
    posts: 320,
    tags: ["PieHUB", "Orientation", "PieAgency"],
  },
  {
    id: "ibrahim",
    name: "Ibrahim B.",
    tag: "@ibrahim_france",
    country: "France 🇫🇷",
    city: "Paris",
    bio: "Conseiller PieAgency France. Je reponds aux questions sur les procedures et la vie en France.",
    avatar: "IB",
    color: "#C8952A",
    followers: 3200,
    following: 180,
    posts: 260,
    tags: ["Conseiller", "Paris", "PieAgency"],
  },
  {
    id: "junior",
    name: "Junior L.",
    tag: "@junior_togo",
    country: "Togo 🇹🇬",
    city: "Lome",
    bio: "Conseiller PieAgency Togo. Accompagnement Campus France, Visa et Belgique.",
    avatar: "JL",
    color: "#1E7A5F",
    followers: 2800,
    following: 210,
    posts: 195,
    tags: ["Conseiller", "Lome", "PieAgency"],
  },
  {
    id: "amara",
    name: "Amara S.",
    tag: "@amara_dakar",
    country: "Senegal 🇸🇳",
    city: "Dakar",
    bio: "Campus France 2025 — Licence de droit a Lyon. Je partage mon experience pour aider les futurs candidats.",
    avatar: "AS",
    color: "#7C3AED",
    followers: 980,
    following: 312,
    posts: 134,
    tags: ["Campus France", "Droit", "Lyon"],
  },
  {
    id: "kofi",
    name: "Kofi A.",
    tag: "@kofi_accra",
    country: "Ghana 🇬🇭",
    city: "Accra",
    bio: "Etudiant en Master Informatique a Paris-Saclay. Passionne par l'IA et l'entrepreneuriat africain.",
    avatar: "KA",
    color: "#2563EB",
    followers: 1240,
    following: 430,
    posts: 87,
    tags: ["Paris-Saclay", "IA", "Entrepreneuriat"],
  },
  {
    id: "fatou",
    name: "Fatou D.",
    tag: "@fatou_bamako",
    country: "Mali 🇲🇱",
    city: "Bamako",
    bio: "Candidature Campus France en cours. Je documente mon parcours ici pour aider les autres.",
    avatar: "FD",
    color: "#EA580C",
    followers: 620,
    following: 280,
    posts: 48,
    tags: ["Campus France", "BTS", "Lyon"],
  },
  {
    id: "moussa",
    name: "Moussa K.",
    tag: "@moussa_cotonou",
    country: "Benin 🇧🇯",
    city: "Cotonou",
    bio: "Etudiant en Licence Economie a Bruxelles. Experience Campus Belgique partagee ici.",
    avatar: "MK",
    color: "#0D1B38",
    followers: 445,
    following: 198,
    posts: 62,
    tags: ["Belgique", "Economie", "Bruxelles"],
  },
];

export const INITIAL_POSTS: SocialPost[] = [
  {
    id: 1,
    userId: "ibrahim",
    type: "text",
    tag: "campus",
    content:
      "🎯 Rappel important : la procedure Campus France 2025 est ouverte. Si vous n'avez pas encore commence votre dossier, c'est le moment. Analyse du profil, choix de formations, redaction des lettres : chaque etape compte. #CampusFrance #PieAgency",
    time: "Il y a 2h",
    likes: 84,
    comments: [
      {
        userId: "fatou",
        text: "Merci pour le rappel. Je commence cette semaine 🙏",
        time: "Il y a 1h",
        likes: 12,
      },
      {
        userId: "kofi",
        text: "Est-ce que la procedure change selon les pays ? Je suis du Ghana.",
        time: "Il y a 45min",
        likes: 7,
      },
    ],
    shares: 32,
  },
  {
    id: 2,
    userId: "amara",
    type: "text",
    tag: "temoignage",
    content:
      "Voila un an que je suis a Lyon. Mon conseil : commencez tot, soyez organises, et gardez votre energie jusqu'au visa et au logement. Vous pouvez le faire 💪 #Temoignage #Lyon #EtudierEnFrance",
    time: "Il y a 5h",
    likes: 142,
    comments: [
      {
        userId: "fatou",
        text: "Trop inspirant. Tu as eu combien de temps pour preparer ton visa ?",
        time: "Il y a 3h",
        likes: 18,
      },
    ],
    shares: 67,
  },
  {
    id: 3,
    userId: "kofi",
    type: "poll",
    tag: "vie",
    question: "Quelle est votre plus grande difficulte dans les demarches ?",
    options: [
      { text: "Rediger les lettres de motivation", votes: 48 },
      { text: "Trouver un logement", votes: 61 },
      { text: "Les justificatifs financiers", votes: 39 },
      { text: "La preparation a l'entretien", votes: 27 },
    ],
    time: "Il y a 8h",
    likes: 56,
    comments: [
      {
        userId: "moussa",
        text: "Le logement pour moi, sans hesitation.",
        time: "Il y a 6h",
        likes: 23,
      },
    ],
    shares: 28,
  },
  {
    id: 4,
    userId: "junior",
    type: "resource",
    tag: "visa",
    resourceName: "Modele de lettre de motivation — Visa etudiant.pdf",
    resourceType: "pdf",
    resourceSize: "245 Ko",
    content:
      "Voici un modele de lettre de motivation pour la demande de visa etudiant en France, adapte a partir d'un dossier accepte. 📄 #Visa #Ressource",
    time: "Il y a 12h",
    likes: 203,
    comments: [
      {
        userId: "fatou",
        text: "Merci infiniment pour ce partage 🙏🙏",
        time: "Il y a 8h",
        likes: 14,
      },
    ],
    shares: 89,
  },
];

export const EXTRA_POSTS: SocialPost[] = [
  {
    id: 5,
    userId: "moussa",
    type: "text",
    tag: "logement",
    content:
      "🏠 Tip logement Belgique : j'ai trouve mon studio a Bruxelles via une residence universitaire. Pensez aussi aux groupes Facebook et aux aides locales. #Belgique #Logement #Bruxelles",
    time: "Il y a 1j",
    likes: 119,
    comments: [],
    shares: 44,
  },
];

// Pas de statuts par defaut — seul le bouton "Ajouter" est toujours present
export const STORIES: StoryItem[] = [
  { userId: "moi", content: "Ajouter un statut", add: true },
];

const TRENDING = [
  { tag: "#CampusFrance2025", count: "2,4K posts" },
  { tag: "#EntretienCampusFrance", count: "1,1K posts" },
  { tag: "#VisaEtudiant", count: "890 posts" },
  { tag: "#EtudierEnFrance", count: "1,8K posts" },
  { tag: "#ParisSaclay", count: "380 posts" },
];

const GROUPS: GroupItem[] = [
  {
    icon: "🇫🇷",
    name: "Campus France — Entraide",
    desc: "Partagez vos experiences Campus France",
    members: 1240,
    joined: true,
    color: "rgba(37,99,235,.08)",
  },
  {
    icon: "📋",
    name: "Visa Etudiant — Conseils",
    desc: "Tout sur la procedure visa",
    members: 876,
    joined: true,
    color: "rgba(124,58,237,.08)",
  },
  {
    icon: "🇧🇪",
    name: "Etudes en Belgique",
    desc: "Communaute des etudiants en Belgique",
    members: 432,
    joined: false,
    color: "rgba(30,122,95,.08)",
  },
  {
    icon: "🏠",
    name: "Logement Etudiant France",
    desc: "Trouver un logement et partager des bons plans",
    members: 1650,
    joined: false,
    color: "rgba(234,88,12,.08)",
  },
];

const EVENTS: EventItem[] = [
  {
    day: "28",
    month: "Mar",
    name: "Webinaire : Reussir son entretien Campus France",
    desc: "Session live avec l'equipe PieAgency. Questions-reponses et simulation.",
    time: "18h00 — GMT+1",
    attendees: 87,
    joined: false,
  },
  {
    day: "02",
    month: "Avr",
    name: "Atelier Visa : Preparer son dossier complet",
    desc: "Comment structurer les justificatifs et les lettres.",
    time: "17h30 — GMT+1",
    attendees: 54,
    joined: false,
  },
  {
    day: "10",
    month: "Avr",
    name: "Live : Temoignages d'etudiants en France",
    desc: "Quatre etudiants partagent leur parcours de A a Z.",
    time: "19h00 — GMT+1",
    attendees: 213,
    joined: true,
  },
];

export const RESOURCES: ResourceItem[] = [
  {
    icon: "📄",
    name: "Modele lettre de motivation Campus France",
    type: "PDF",
    size: "189 Ko",
    author: "Junior L.",
    downloads: 342,
  },
  {
    icon: "📊",
    name: "Guide complet procedure Visa etudiant 2025",
    type: "PDF",
    size: "1,2 Mo",
    author: "Ibrahim B.",
    downloads: 891,
  },
  {
    icon: "📋",
    name: "Checklist documents — Campus France",
    type: "DOC",
    size: "45 Ko",
    author: "Amara S.",
    downloads: 267,
  },
  {
    icon: "📝",
    name: "Modele lettre hebergement (visa)",
    type: "PDF",
    size: "132 Ko",
    author: "Junior L.",
    downloads: 445,
  },
];

const TAG_META: Record<TagKey, { label: string; className: string }> = {
  campus: { label: "Campus France", className: "social-tag-campus" },
  visa: { label: "Visa", className: "social-tag-visa" },
  vie: { label: "Vie etudiante", className: "social-tag-vie" },
  logement: { label: "Logement", className: "social-tag-logement" },
  temoignage: { label: "Temoignage", className: "social-tag-temoignage" },
};





const GUIDE_TOPIC_META: Record<TagKey, { label: string; nextStep: string; contactReason: string }> = {
  campus: {
    label: "Campus France",
    nextStep: "Vérifiez le calendrier local, le projet d’études et les pièces avant de répondre.",
    contactReason: "Accompagnement Campus France",
  },
  visa: {
    label: "Visa étudiant",
    nextStep: "Contrôlez les justificatifs, l’hébergement, les finances et la cohérence du dossier.",
    contactReason: "Contrôle dossier visa",
  },
  logement: {
    label: "Logement étudiant",
    nextStep: "Comparez les pistes fiables et gardez des preuves écrites avant tout paiement.",
    contactReason: "Orientation logement",
  },
  vie: {
    label: "Vie étudiante",
    nextStep: "Demandez un retour d’expérience concret et vérifiez les sources avant d’agir.",
    contactReason: "Conseil parcours étudiant",
  },
  temoignage: {
    label: "Témoignage",
    nextStep: "Repérez les étapes utiles du retour d’expérience et adaptez-les à votre situation.",
    contactReason: "Analyse de parcours",
  },
};

const REPORT_REASONS = [
  { value: "fausse_information", label: "Fausse information" },
  { value: "arnaque", label: "Arnaque ou promesse douteuse" },
  { value: "harcelement", label: "Harcèlement / attaque" },
  { value: "spam", label: "Spam ou publicité abusive" },
  { value: "contenu_inapproprie", label: "Contenu inapproprié" },
];

const FEED_FILTERS: Array<{ key: FeedFilter; label: string }> = [
  { key: "all", label: "Tout" },
  { key: "open", label: "Sans réponse" },
  { key: "answered", label: "Répondu" },
  { key: "official", label: "Officiel" },
  { key: "popular", label: "Populaire" },
];

const STOPWORDS = new Set([
  "avec", "dans", "pour", "quoi", "comment", "question", "bonjour", "salut", "merci",
  "campus", "france", "visa", "etudiant", "étudiant", "dossier", "faire", "avoir",
  "suis", "mon", "mes", "une", "des", "les", "sur", "est", "que", "qui", "plus",
]);

const QUESTION_CATEGORIES: Array<{ label: string; tag: TagKey; prompt: string }> = [
  { label: "Campus France", tag: "campus", prompt: "J'ai une question Campus France : " },
  { label: "Visa", tag: "visa", prompt: "J'ai une question visa : " },
  { label: "Logement", tag: "logement", prompt: "J'ai une question logement : " },
  { label: "Belgique", tag: "campus", prompt: "J'ai une question Belgique : " },
  { label: "Entretien", tag: "campus", prompt: "J'ai une question entretien Campus France : " },
  { label: "Documents", tag: "visa", prompt: "J'ai une question documents : " },
];

const COMPOSE_HINTS: Record<ComposeMode, string> = {
  question: "Posez votre question clairement : pays, étape, blocage, délai...",
  text: "Partagez votre experience, posez une question ou donnez un conseil...",
  doc: "Presentez rapidement la ressource ou le guide que vous partagez...",
  poll: "Posez votre question de sondage et expliquez le contexte...",
  event: "Annoncez votre evenement, son objectif et les informations utiles...",
  story: "Partagez votre story avec la communaute...",
};


const GROUP_TAG_MAP: Record<string, TagKey> = {
  "Campus France — Entraide": "campus",
  "Visa Etudiant — Conseils": "visa",
  "Etudes en Belgique": "campus",
  "Logement Etudiant France": "logement",
};

function inferTagFromText(text: string, fallback: TagKey = "vie") {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.includes("visa") ||
    normalized.includes("consulaire") ||
    normalized.includes("hebergement")
  ) {
    return "visa";
  }

  if (
    normalized.includes("logement") ||
    normalized.includes("studio") ||
    normalized.includes("crous") ||
    normalized.includes("residence")
  ) {
    return "logement";
  }

  if (
    normalized.includes("campus france") ||
    normalized.includes("parcoursup") ||
    normalized.includes("belgique") ||
    normalized.includes("paris-saclay") ||
    normalized.includes("ecole") ||
    normalized.includes("universite") ||
    normalized.includes("formation")
  ) {
    return "campus";
  }

  if (
    normalized.includes("temoignage") ||
    normalized.includes("experience") ||
    normalized.includes("retour")
  ) {
    return "temoignage";
  }

  return fallback;
}

function findUser(userId: string) {
  return USERS.find((user) => user.id === userId) ?? USERS[0];
}

function findUserInList(users: UserProfile[], userId: string) {
  return users.find((user) => user.id === userId) ?? findUser(userId);
}

function renderRichText(text: string) {
  const tokenPattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)|(@[\w-]+)|(#[\w-]+)|(\n)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const [fullMatch, markdownLabel, markdownUrl, rawUrl, mention, hashtag, lineBreak] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(
        <span key={`text-${matchIndex}-${start}`}>{text.slice(lastIndex, start)}</span>,
      );
    }

    if (lineBreak) {
      nodes.push(<br key={`br-${matchIndex}`} />);
    } else if (markdownLabel && markdownUrl) {
      nodes.push(
        <a
          className="social-post-link"
          href={markdownUrl}
          key={`md-${matchIndex}`}
          rel="noreferrer"
          target="_blank"
        >
          {markdownLabel}
        </a>,
      );
    } else if (rawUrl) {
      nodes.push(
        <a
          className="social-post-link"
          href={rawUrl}
          key={`url-${matchIndex}`}
          rel="noreferrer"
          target="_blank"
        >
          {rawUrl}
        </a>,
      );
    } else if (hashtag) {
      nodes.push(
        <span className="social-post-hashtag" key={`tag-${matchIndex}`}>
          {hashtag}
        </span>,
      );
    } else if (mention) {
      nodes.push(
        <span className="social-post-mention" key={`mention-${matchIndex}`}>
          {mention}
        </span>,
      );
    }

    lastIndex = start + fullMatch.length;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text-tail-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
}

function isTrustedProfile(user: UserProfile) {
  return Boolean(user.isOfficial || user.isAi || user.id === "piehub" || user.id === "junior" || user.id === "ibrahim");
}

function getTrustedProfileBadge(user: UserProfile) {
  if (user.id === "piehub" || user.isAi) return "Guide PieHUB";
  if (isTrustedProfile(user)) return "Officiel PieAgency";
  return null;
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function getPostPlainText(post: SocialPost) {
  if (post.type === "poll") {
    return `${post.question} ${post.options.map((option) => option.text).join(" ")}`;
  }
  if (post.type === "resource") {
    return `${post.resourceName} ${post.content}`;
  }
  return post.content;
}

function extractKeywords(value: string) {
  return normalizeForSearch(value)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
    .slice(0, 8);
}


function summarizeThread(post: SocialPost) {
  const official = post.comments.find((comment) => comment.isOfficial || comment.userId === "piehub");
  if (official) return "Une réponse fiable est disponible : commencez par la réponse officielle épinglée.";
  if (post.comments.length >= 3) return `Fil actif : ${post.comments.length} réponses. Guide PieHUB recommande de lire les avis puis de vérifier la source officielle.`;
  if (post.isQuestion && post.questionStatus === "open") return "Question encore ouverte : Guide PieHUB surveille le sujet et peut orienter vers une ressource ou PieAgency.";
  return "Fil court : ajoutez du contexte pour obtenir une réponse plus précise.";
}

function resourceMatchesPost(resource: { name: string; description: string; tag?: TagKey }, post: SocialPost) {
  const text = normalizeForSearch(`${getPostPlainText(post)} ${TAG_META[post.tag].label}`);
  return post.tag === resource.tag || extractKeywords(`${resource.name} ${resource.description}`).some((keyword) => text.includes(keyword));
}

function getProfileStageLabel(user: UserProfile) {
  return user.stageLabel || user.tags[0] || "Membre PieHUB";
}

function getProfileActivityLabel(user: UserProfile) {
  return user.activityLabel || (user.posts > 0 ? "Actif" : "Nouveau membre");
}

function getProfileLastActivityLabel(user: UserProfile) {
  return user.lastActiveLabel ? `Dernière activité ${user.lastActiveLabel.toLowerCase()}` : "Aucune activité publique";
}

function createConversationStarter(userId: string, users: UserProfile[] = USERS): MessageItem[] {
  const user = findUserInList(users, userId);

  if (userId === "piehub") {
    return [
      {
        from: "them",
        text: "Bonjour, je suis Guide PieHUB. Posez votre question sur Campus France, le visa, la Belgique ou votre dossier, et je vous oriente vers la bonne suite.",
        time: "A l'instant",
      },
    ];
  }

  return [
    {
      from: "them",
      text: `Bonjour, je suis ${user.name}. Comment puis-je vous aider ?`,
      time: "A l'instant",
    },
  ];
}

export function CommunityNetwork() {
  const toastIdRef = useRef(1);
  const postIdRef = useRef(100);
  const mainFeedRef = useRef<HTMLElement | null>(null);
  const commentInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [activeTab, setActiveTab] = useState<MainTab>("feed");
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("posts");
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([VISITOR_PROFILE]);
  const [currentProfileId, setCurrentProfileId] = useState(VISITOR_PROFILE.id);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [communityLoadState, setCommunityLoadState] = useState<CommunityLoadState>("loading");
  const [feedFromApi, setFeedFromApi] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({});
  const [localStories, setLocalStories] = useState<StoryItem[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [groupState] = useState<Record<string, boolean>>(Object.fromEntries(GROUPS.map((group) => [group.name, false])));
  const [eventState] = useState<Record<string, boolean>>(Object.fromEntries(EVENTS.map((event) => [event.name, false])));
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTargetId, setMessageTargetId] = useState("piehub");
  const [messages, setMessages] = useState<MessageItem[]>(() => createConversationStarter("piehub"));
  const [communityConversationId, setCommunityConversationId] = useState<string | null>(null);
  const [directThreads, setDirectThreads] = useState<CommunityDirectThreadItem[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("text");
  const [composeText, setComposeText] = useState("");
  const [composeTag, setComposeTag] = useState<TagKey>("campus");
  const [composeResourceName, setComposeResourceName] = useState("");
  const [composeResourceType, setComposeResourceType] = useState<"pdf" | "doc">("pdf");
  const [composeResourceSize, setComposeResourceSize] = useState("");
  const [composePollQuestion, setComposePollQuestion] = useState("");
  const [composePollOptions, setComposePollOptions] = useState(["", "", "", ""]);
  const [composeFile, setComposeFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [selectedApiGroupId, setSelectedApiGroupId] = useState<string | null>(null);
  const [groupDetailPosts, setGroupDetailPosts] = useState<SocialPost[]>([]);
  const [groupDetailMembers, setGroupDetailMembers] = useState<CommunityGroupMemberItem[]>([]);
  const [groupDetailTab, setGroupDetailTab] = useState<GroupDetailTab>("posts");
  const [isLoadingGroupPosts, setIsLoadingGroupPosts] = useState(false);
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = useState(false);
  const [blockedProfileIds, setBlockedProfileIds] = useState<string[]>([]);
  const [composeGroupId, setComposeGroupId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [selectedApiEventId, setSelectedApiEventId] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<"tous" | "PDF" | "DOC">("tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<CommunityToast[]>([]);
  const [aiReplyingPostIds, setAiReplyingPostIds] = useState<number[]>([]);
  const [isAssistantMessageLoading, setIsAssistantMessageLoading] = useState(false);
  const [apiGroups, setApiGroups] = useState<ApiGroupItem[]>([]);
  const [apiEvents, setApiEvents] = useState<ApiEventItem[]>([]);
  const [notifications, setNotifications] = useState<CommunityNotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", icon: "👥", category: "campus" });
  const [eventForm, setEventForm] = useState({ name: "", description: "", event_date: "", event_time: "", location_type: "online", location_detail: "" });
  const [groupFormError, setGroupFormError] = useState("");
  const [eventFormError, setEventFormError] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [ads, setAds] = useState<CommunityAdItem[]>([]);
  const [createAdOpen, setCreateAdOpen] = useState(false);
  const [adStep, setAdStep] = useState(0);
  const [adForm, setAdForm] = useState({
    title: "",
    body: "",
    image_url: "",
    cta_label: "En savoir plus",
    cta_url: "",
    category: "general",
  });
  const [adFormError, setAdFormError] = useState("");
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [isRewriting, setIsRewriting] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState("fausse_information");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const apiBaseUrl = getApiBaseUrl();
  const { session, isReady: authReady } = useAuthSession(apiBaseUrl);
  const isPieAgencyConnected = Boolean(session);

  const currentUser = findUserInList(communityUsers, currentProfileId);
  const messageTarget = findUserInList(communityUsers, messageTargetId);
  const likedSet = new Set(likedPostIds);
  const savedSet = new Set(savedPostIds);
  const followingSet = new Set(followingIds);
  const joinedGroupCount = apiGroups.filter((group) => group.isMember).length;
  const joinedEventCount = apiEvents.filter((event) => event.isAttending).length;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  function findCommunityUser(userId: string) {
    return findUserInList(communityUsers, userId);
  }

  const resourceLibrary = [
    ...posts
      .filter((post): post is ResourcePost => post.type === "resource")
      .map((post) => ({
        icon: post.resourceType === "pdf" ? "PDF" : "DOC",
        name: post.resourceName,
        type: post.resourceType.toUpperCase(),
        size: post.resourceSize,
        author: findCommunityUser(post.userId).name,
        downloads: Math.max(post.likes + post.comments.length, 1),
        source: "post" as const,
        tag: post.tag,
        description: `${post.resourceName} ${post.content} ${findCommunityUser(post.userId).name}`,
        url: post.resourceUrl,
      })),
  ];

  const explorerPosts = [...posts].reverse();
  const normalizedSearchIndex = normalizeForSearch(searchTerm.trim());
  const filteredPosts = normalizedSearchIndex
    ? explorerPosts.filter((post) => {
        const author = findCommunityUser(post.userId);
        const tagMeta = TAG_META[post.tag];
        const searchableText = `${author.name} ${author.country} ${tagMeta.label} ${getPostPlainText(post)} ${post.isQuestion ? "question" : ""} ${post.questionStatus || ""}`;
        return normalizeForSearch(searchableText).includes(normalizedSearchIndex);
      })
    : explorerPosts.slice(0, 6);

  const filteredUsers = normalizedSearchIndex
    ? communityUsers.filter((user) =>
        normalizeForSearch(`${user.name} ${user.country} ${user.city} ${user.bio} ${user.tags.join(" ")} ${user.stageLabel || ""}`)
          .includes(normalizedSearchIndex),
      )
    : communityUsers.filter((user) => user.id !== currentProfileId);

  const filteredResources = normalizedSearchIndex
    ? resourceLibrary.filter((resource) =>
        normalizeForSearch(`${resource.name} ${resource.author} ${resource.description}`)
          .includes(normalizedSearchIndex),
      )
    : resourceLibrary;

  async function hydrateCommunityFeed() {
    setCommunityLoadState("loading");
    try {
      const payload = await fetchCommunityBootstrap();
      payload.users.forEach((user) => {
        const existingIndex = USERS.findIndex((item) => item.id === user.id);
        if (existingIndex >= 0) {
          USERS[existingIndex] = user;
          return;
        }
        USERS.push(user);
      });
      const nextUsers = payload.currentProfileId
        ? payload.users
        : [VISITOR_PROFILE, ...payload.users.filter((user) => user.id !== VISITOR_PROFILE.id)];
      setCommunityUsers(nextUsers);
      setFollowingIds(nextUsers.filter((user) => user.viewerIsFollowing).map((user) => user.id));
      setPosts(payload.posts);
      setLikedPostIds(
        payload.posts.filter((post) => post.viewerHasLiked).map((post) => post.id),
      );
      setSavedPostIds(
        payload.posts.filter((post) => post.viewerHasSaved).map((post) => post.id),
      );
      setPollVotes(
        Object.fromEntries(
          payload.posts
            .filter(
              (post) =>
                typeof post.viewerPollVote === "number" && post.type === "poll",
            )
            .map((post) => [post.id, post.viewerPollVote as number]),
        ),
      );
      setCurrentProfileId(payload.currentProfileId ?? VISITOR_PROFILE.id);
      setFeedFromApi(payload.posts.length > 0);
      setCommunityLoadState(payload.posts.length ? "ready" : "empty");
      setLocalStories((payload.stories || []).map((story: CommunityStoryItem) => ({
        id: story.id,
        userId: story.userId,
        content: story.content,
        createdAt: Date.parse(story.createdAt),
        mediaUrl: story.mediaUrl,
        mediaMimeType: story.mediaMimeType,
        viewerCanDelete: story.viewerCanDelete,
      })));
      const highestPostId = payload.posts.reduce(
        (max, post) => (post.id > max ? post.id : max),
        0,
      );
      postIdRef.current = Math.max(highestPostId + 1, 100);
      // Load groups, events, notifications in parallel
      const [groups, events] = await Promise.all([
        fetchCommunityGroups().catch(() => []),
        fetchCommunityEventsCalendar().catch(() => []),
      ]);
      setApiGroups(groups);
      setApiEvents(events);
      fetchCommunityAds().then((data) => setAds(data.ads)).catch(() => {});
      // Load notifications if user is logged in
      if (payload.currentProfileId) {
        Promise.all([fetchCommunityNotifications(), fetchCommunityUserBlocks()]).then(([data, blocks]) => {
          setNotifications(data.notifications);
          setUnreadNotifCount(data.unreadCount);
          setBlockedProfileIds(blocks);
        }).catch(() => {});
        fetchCommunityDirectThreads().then(setDirectThreads).catch(() => setDirectThreads([]));
      }
    } catch {
      setCommunityUsers([VISITOR_PROFILE]);
      setCurrentProfileId(VISITOR_PROFILE.id);
      setPosts([]);
      setLikedPostIds([]);
      setSavedPostIds([]);
      setPollVotes({});
      setFeedFromApi(false);
      setCommunityLoadState("error");
    }
  }

  async function loadPiehubThread() {
    try {
      const payload = await fetchCommunityAssistantThread();
      setCommunityConversationId(payload.conversationId);
      setMessages(
        payload.messages.length
          ? payload.messages.map((item) => ({
              from: item.from,
              text: item.text,
              time: item.time,
            }))
          : createConversationStarter("piehub", communityUsers),
      );
    } catch (error) {
      setCommunityConversationId(null);
      setMessages(createConversationStarter("piehub", communityUsers));
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        return;
      }
    }
  }


  async function loadDirectThread(targetProfileId: string) {
    setIsAssistantMessageLoading(true);
    try {
      const payload = await fetchCommunityDirectThread(targetProfileId);
      setMessages(payload.messages.length ? payload.messages : []);
      setDirectThreads((current) => [
        payload.thread,
        ...current.filter((thread) => thread.id !== payload.thread.id),
      ]);
    } catch {
      setMessages([]);
      pushToast("Ce profil ne peut pas encore recevoir de messages privés.");
    } finally {
      setIsAssistantMessageLoading(false);
    }
  }

  useEffect(() => {
    void hydrateCommunityFeed();
    const unsubscribe = onAuthSessionChange(() => {
      void hydrateCommunityFeed();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const hasOpenLayer = Boolean(
      composeOpen || reportTarget || createGroupOpen || createEventOpen || createAdOpen ||
      notifPanelOpen || messageOpen || profileId || storyIndex !== null || editTarget,
    );
    if (!hasOpenLayer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (createAdOpen) { setCreateAdOpen(false); setAdStep(0); }
      else if (editTarget) { setEditTarget(null); setEditDraft(""); }
      else if (createEventOpen) setCreateEventOpen(false);
      else if (createGroupOpen) setCreateGroupOpen(false);
      else if (reportTarget) closeReportModal();
      else if (composeOpen) closeCompose();
      else if (notifPanelOpen) setNotifPanelOpen(false);
      else if (messageOpen) setMessageOpen(false);
      else if (profileId) setProfileId(null);
      else if (storyIndex !== null) setStoryIndex(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [composeOpen, reportTarget, createGroupOpen, createEventOpen, createAdOpen, notifPanelOpen, messageOpen, profileId, storyIndex, editTarget]);


  function authProblemMessage(action: string) {
    return isPieAgencyConnected
      ? `Session PieAgency détectée, mais le backend PieHUB n'a pas encore validé l'action ${action}. Déploiement backend nécessaire.`
      : `Connectez-vous à PieAgency pour ${action}.`;
  }

  function pushToast(text: string) {
    const id = toastIdRef.current;
    toastIdRef.current += 1;
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2200);
  }

  function focusMainContent() {
    window.requestAnimationFrame(() => {
      mainFeedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function focusCommentInput(postId: number) {
    const input = commentInputRefs.current[postId];
    if (!input) {
      return;
    }

    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function switchTab(nextTab: MainTab) {
    if (nextTab !== "explorer") {
      setHashtagFilter(null);
    }
    if (nextTab !== "groupes") {
      setSelectedGroupName(null);
      setSelectedApiGroupId(null);
      setGroupDetailPosts([]);
      setComposeGroupId(null);
    }
    if (nextTab !== "evenements") {
      setSelectedEventName(null);
      setSelectedApiEventId(null);
    }
    if (nextTab !== "evenements") {
      setSelectedEventName(null);
    }
    setActiveTab(nextTab);
    focusMainContent();
  }

  async function submitCreateGroup() {
    if (groupForm.name.trim().length < 3) {
      setGroupFormError("Le nom doit contenir au moins 3 caractères.");
      return;
    }
    if (groupForm.description.trim().length < 4) {
      setGroupFormError("Ajoutez une description.");
      return;
    }
    setIsCreatingGroup(true);
    setGroupFormError("");
    try {
      const result = await createCommunityGroup(groupForm);
      setApiGroups((current) => [result.group, ...current]);
      setCreateGroupOpen(false);
      setGroupForm({ name: "", description: "", icon: "👥", category: "campus" });
      pushToast(`✅ Groupe "${result.group.name}" créé avec succès.`);
    } catch {
      setGroupFormError("Erreur lors de la création. Connectez-vous d'abord.");
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function submitCreateEvent() {
    if (eventForm.name.trim().length < 4) {
      setEventFormError("Le nom doit contenir au moins 4 caractères.");
      return;
    }
    if (eventForm.description.trim().length < 4) {
      setEventFormError("Ajoutez une description.");
      return;
    }
    if (!eventForm.event_date) {
      setEventFormError("Choisissez une date.");
      return;
    }
    setIsCreatingEvent(true);
    setEventFormError("");
    try {
      const result = await createCommunityEvent(eventForm);
      setApiEvents((current) => [result.event, ...current]);
      setCreateEventOpen(false);
      setEventForm({ name: "", description: "", event_date: "", event_time: "", location_type: "online", location_detail: "" });
      pushToast(`✅ Événement "${result.event.name}" créé.`);
    } catch {
      setEventFormError("Erreur lors de la création. Connectez-vous d'abord.");
    } finally {
      setIsCreatingEvent(false);
    }
  }

  async function handleApiGroupMembership(groupId: number, groupName: string) {
    const previousGroups = apiGroups;
    const currentGroup = apiGroups.find((group) => group.id === groupId);
    const optimisticIsMember = !currentGroup?.isMember;
    setApiGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              isMember: optimisticIsMember,
              memberCount: Math.max(group.memberCount + (optimisticIsMember ? 1 : -1), 0),
            }
          : group,
      ),
    );

    try {
      const result = await toggleCommunityGroupMembership(groupId);
      setApiGroups((current) =>
        current.map((g) => (g.id === groupId ? result.group : g)),
      );
      pushToast(result.isMember ? `✅ Rejoint : ${groupName}` : `Groupe quitté : ${groupName}`);
    } catch {
      setApiGroups(previousGroups);
      pushToast(authProblemMessage("rejoindre un groupe"));
    }
  }

  async function openGroupDetail(group: ApiGroupItem) {
    setSelectedApiGroupId(String(group.id));
    setSelectedGroupName(null);
    setGroupDetailTab("posts");
    setComposeGroupId(String(group.id));
    setIsLoadingGroupPosts(true);
    setGroupDetailMembers([]);
    setIsLoadingGroupMembers(group.isMember);
    try {
      const [gposts, members] = await Promise.all([
        fetchGroupPosts(String(group.id)),
        group.isMember ? fetchCommunityGroupMembers(group.id) : Promise.resolve([]),
      ]);
      setGroupDetailPosts(gposts);
      setGroupDetailMembers(members);
    } catch {
      setGroupDetailPosts([]);
    } finally {
      setIsLoadingGroupPosts(false);
      setIsLoadingGroupMembers(false);
    }
  }

  async function handleApiEventAttendance(eventId: number, eventName: string) {
    try {
      const result = await toggleCommunityEventAttendance(eventId);
      setApiEvents((current) =>
        current.map((e) => (e.id === eventId ? result.event : e)),
      );
      pushToast(result.isAttending ? `✅ Inscrit : ${eventName}` : `Inscription annulée : ${eventName}`);
    } catch {
      pushToast(authProblemMessage("vous inscrire à un événement"));
    }
  }


  function openReportModal(target: ReportTarget) {
    setReportTarget(target);
    setReportReason("fausse_information");
    setReportDetails("");
  }

  function closeReportModal() {
    setReportTarget(null);
    setReportReason("fausse_information");
    setReportDetails("");
    setIsReporting(false);
  }

  async function submitReport() {
    if (!reportTarget || isReporting) return;
    setIsReporting(true);
    try {
      await reportCommunityContent({
        targetType: reportTarget.targetType,
        targetId: reportTarget.targetId,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });
      closeReportModal();
      pushToast("Signalement transmis à la modération PieAgency.");
    } catch {
      setIsReporting(false);
      pushToast(authProblemMessage("signaler ce contenu"));
    }
  }

  async function handleAIRewrite(field: "body" | "composeText" | "adBody", context = "publication") {
    const textMap: Record<string, string> = {
      adBody: adForm.body,
      composeText: composeText,
      body: composeText,
    };
    const text = textMap[field] || "";
    if (text.trim().length < 8) {
      pushToast("Écrivez d'abord un texte avant de le reformuler.");
      return;
    }
    setIsRewriting(field);
    try {
      const rewritten = await rewriteWithAI(text, context);
      if (field === "adBody") {
        setAdForm((f) => ({ ...f, body: rewritten }));
      } else {
        setComposeText(rewritten);
      }
      pushToast("✅ Texte reformulé par l'IA.");
    } catch {
      pushToast("L'IA n'est pas disponible pour le moment.");
    } finally {
      setIsRewriting(null);
    }
  }

  async function submitCreateAd() {
    if (adForm.title.trim().length < 4) { setAdFormError("Titre trop court."); return; }
    if (adForm.body.trim().length < 8) { setAdFormError("Description trop courte."); return; }
    setIsCreatingAd(true);
    setAdFormError("");
    try {
      const ad = await createCommunityAd({
        ...adForm,
        image_url: adForm.image_url || null,
      });
      setAds((current) => [ad, ...current]);
      setCreateAdOpen(false);
      setAdStep(0);
      setAdForm({ title: "", body: "", image_url: "", cta_label: "En savoir plus", cta_url: "", category: "general" });
      pushToast("✅ Publicité soumise — en attente de validation par l'équipe PieAgency.");
    } catch {
      setAdFormError("Erreur lors de la soumission. Connectez-vous d'abord.");
    } finally {
      setIsCreatingAd(false);
    }
  }

  async function handleMarkNotifRead(notifId: string) {
    try {
      const data = await markCommunityNotificationRead(notifId);
      setNotifications(data.notifications);
      setUnreadNotifCount(data.unreadCount);
    } catch {
      // ignore
    }
  }

  async function handleMarkAllNotificationsRead() {
    const unread = notifications.filter((notif) => !notif.isRead);
    if (!unread.length) return;
    try {
      const data = await markAllCommunityNotificationsRead();
      setNotifications(data.notifications);
      setUnreadNotifCount(data.unreadCount);
    } catch { pushToast("Impossible de marquer les notifications comme lues."); }
  }

  function getNotificationIcon(type: string) {
    if (type.includes("message")) return "💬";
    if (type.includes("comment")) return "↩";
    if (type.includes("like")) return "♥";
    if (type.includes("follow")) return "👤";
    if (type.includes("group")) return "👥";
    return "🔔";
  }

  function syncPostViewState(post: SocialPost) {
    const nextLiked = "viewerHasLiked" in post && post.viewerHasLiked;
    const nextSaved = "viewerHasSaved" in post && post.viewerHasSaved;
    const nextVote =
      "viewerPollVote" in post && typeof post.viewerPollVote === "number"
        ? post.viewerPollVote
        : undefined;

    setLikedPostIds((current) =>
      nextLiked
        ? Array.from(new Set([...current, post.id]))
        : current.filter((item) => item !== post.id),
    );
    setSavedPostIds((current) =>
      nextSaved
        ? Array.from(new Set([...current, post.id]))
        : current.filter((item) => item !== post.id),
    );
    setPollVotes((current) => {
      if (typeof nextVote === "number") {
        return { ...current, [post.id]: nextVote };
      }

      const next = { ...current };
      delete next[post.id];
      return next;
    });
  }

  function handleSearchSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setExplorerTab("posts");
    switchTab("explorer");
  }

  function downloadResource(resource: {
    name: string;
    type: string;
    size: string;
    author: string;
    description: string;
    url?: string | null;
  }) {
    if (!resource.url) {
      pushToast("Ce fichier n’est pas encore disponible au téléchargement.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = resource.url;
    anchor.download = resource.name;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    pushToast(`Téléchargement lancé : ${resource.name}`);
  }

  function openCompose(mode: ComposeMode) {
    if (communityLoadState === "loading" || communityLoadState === "error") {
      pushToast("Reconnectez PieHUB avant de créer un contenu.");
      return;
    }
    setComposeMode(mode);
    setComposeTag(
      mode === "doc"
        ? "visa"
        : mode === "poll"
          ? "vie"
          : mode === "event"
            ? "campus"
            : "campus",
    );
    setComposeOpen(true);
  }

  function openQuestionComposer(tag: TagKey = "campus", prompt = "") {
    if (communityLoadState === "loading" || communityLoadState === "error") {
      pushToast("Reconnectez PieHUB avant de poser une question.");
      return;
    }
    setComposeMode("question");
    setComposeTag(tag);
    setComposeText(prompt);
    setComposeOpen(true);
  }

  function closeCompose() {
    setComposeOpen(false);
    setComposeMode("text");
    setComposeText("");
    setComposeTag("campus");
    setComposeResourceName("");
    setComposeResourceType("pdf");
    setComposeResourceSize("");
    setComposePollQuestion("");
    setComposePollOptions(["", "", "", ""]);
    setComposeFile(null);
    setComposeGroupId(null);
  }

  function resolveComposeTag(rawText: string) {
    if (composeMode === "doc") {
      return "visa";
    }

    if (composeMode === "poll") {
      return "vie";
    }

    if (composeMode === "question") {
      return inferTagFromText(rawText, composeTag);
    }

    return inferTagFromText(rawText, composeTag);
  }

  async function publishPost() {
    const trimmedText = composeText.trim();

    if (composeMode === "story") {
      if (trimmedText.length < 4 && !composeFile) {
        pushToast("Ajoutez un texte ou une image à votre story.");
        return;
      }
      setIsPublishing(true);
      try {
        const asset = composeFile ? await uploadCommunityAsset(composeFile) : null;
        const story = await createCommunityStory({
          content: trimmedText,
          mediaStoragePath: asset?.storagePath,
          mediaUrl: asset?.publicUrl,
          mediaMimeType: asset?.mimeType,
        });
        setLocalStories((current) => [{
          id: story.id,
          userId: story.userId,
          content: story.content,
          createdAt: Date.parse(story.createdAt),
          mediaUrl: story.mediaUrl,
          mediaMimeType: story.mediaMimeType,
          viewerCanDelete: story.viewerCanDelete,
        }, ...current.filter((item) => item.id !== story.id)]);
        closeCompose();
        pushToast("Story publiée. Elle disparaîtra automatiquement après 24 h.");
      } catch {
        pushToast(authProblemMessage("publier une story"));
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    const inferredPollLines =
      composeMode === "poll"
        ? trimmedText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : [];
    const inferredQuestion = composePollQuestion.trim() || inferredPollLines[0] || "";
    const normalizedOptions =
      composePollOptions.map((option) => option.trim()).filter(Boolean).length > 0
        ? composePollOptions.map((option) => option.trim()).filter(Boolean)
        : inferredPollLines.slice(1);
    if (composeMode === "poll") {
      if (inferredQuestion.length < 8) {
        pushToast("Ajoutez une vraie question pour le sondage.");
        return;
      }
      if (normalizedOptions.length < 2) {
        pushToast("Ajoutez au moins deux options au sondage, une par ligne.");
        return;
      }
    } else if (composeMode === "question" && trimmedText.length < 8) {
      pushToast("Posez une question claire avant de publier.");
      return;
    } else if (trimmedText.length < 12) {
      pushToast("Ajoutez un peu plus de contexte avant de publier.");
      return;
    }
    if (composeMode === "doc" && !composeFile) {
      pushToast("Sélectionnez le véritable document à partager.");
      return;
    }
    try {
      setIsPublishing(true);
      const asset = composeFile ? await uploadCommunityAsset(composeFile) : null;
      const resolvedTag = resolveComposeTag(
        composeMode === "poll" ? inferredQuestion || trimmedText : trimmedText,
      );
      const mutation = await createCommunityPost({
        tag: resolvedTag,
        content: composeMode === "poll" ? trimmedText || inferredQuestion : trimmedText,
        postType:
          composeMode === "doc" ? "resource" : composeMode === "poll" ? "poll" : "text",
        resourceName:
          composeMode === "doc"
            ? composeResourceName.trim() || composeFile?.name || "Ressource PieHUB"
            : undefined,
        resourceType: composeMode === "doc" ? composeResourceType : undefined,
        resourceSize:
          composeMode === "doc"
            ? composeResourceSize.trim() || (asset ? `${Math.max(asset.size / 1024, 1).toFixed(0)} Ko` : "Document")
            : undefined,
        question: composeMode === "poll" ? inferredQuestion : undefined,
        options: composeMode === "poll" ? normalizedOptions : undefined,
        groupId: composeGroupId,
        isQuestion: composeMode === "question",
        resourceStoragePath: composeMode === "doc" ? asset?.storagePath : undefined,
        resourceUrl: composeMode === "doc" ? asset?.publicUrl : undefined,
        resourceMimeType: composeMode === "doc" ? asset?.mimeType : undefined,
        mediaUrls: composeMode !== "doc" && asset ? [asset.publicUrl] : [],
      });
      setPosts((current) => [
        mutation.post,
        ...current.filter((post) => post.id !== mutation.post.id),
      ]);
      syncPostViewState(mutation.post);
      closeCompose();
      if (selectedApiGroupId) {
        // Reload group posts after posting in a group
        setIsLoadingGroupPosts(true);
        fetchGroupPosts(selectedApiGroupId)
          .then((gposts) => setGroupDetailPosts(gposts))
          .catch(() => {})
          .finally(() => setIsLoadingGroupPosts(false));
        pushToast("Publication partagee dans ce groupe.");
      } else {
        switchTab("feed");
        pushToast(composeMode === "question" ? "Question publiée dans PieHUB." : "Publication partagee avec la communaute.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast(authProblemMessage("publier dans PieHUB"));
        return;
      }
      pushToast("Publication impossible pour le moment.");
    } finally {
      setIsPublishing(false);
    }
  }
  async function toggleLike(postId: number) {
    const wasLiked = likedSet.has(postId);
    setLikedPostIds((current) =>
      wasLiked ? current.filter((item) => item !== postId) : Array.from(new Set([...current, postId])),
    );
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: Math.max((post.likes || 0) + (wasLiked ? -1 : 1), 0),
              viewerHasLiked: !wasLiked,
            }
          : post,
      ),
    );

    try {
      const mutation = await toggleCommunityReaction(postId, "like");
      setPosts((current) =>
        current.map((post) => (post.id === postId ? mutation.post : post)),
      );
      syncPostViewState(mutation.post);
    } catch (error) {
      setLikedPostIds((current) =>
        wasLiked ? Array.from(new Set([...current, postId])) : current.filter((item) => item !== postId),
      );
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: Math.max((post.likes || 0) + (wasLiked ? 1 : -1), 0),
                viewerHasLiked: wasLiked,
              }
            : post,
        ),
      );
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast(authProblemMessage("aimer une publication"));
        return;
      }
      pushToast("Impossible de mettre a jour ce like.");
    }
  }
  async function toggleSave(postId: number) {
    const wasSaved = savedSet.has(postId);
    try {
      const mutation = await toggleCommunityReaction(postId, "save");
      setPosts((current) =>
        current.map((post) => (post.id === postId ? mutation.post : post)),
      );
      syncPostViewState(mutation.post);
      pushToast(wasSaved ? "Publication retiree des sauvegardes." : "Publication sauvegardee.");
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast(authProblemMessage("sauvegarder une publication"));
        return;
      }
      pushToast("Impossible de mettre a jour cette sauvegarde.");
    }
  }
  async function sharePost(postId: number) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/communaute#post-${postId}`);
      const mutation = await registerCommunityPostShare(postId);
      setPosts((current) => current.map((post) => post.id === postId ? mutation.post : post));
      pushToast("🔗 Lien copié et partage enregistré.");
    } catch {
      pushToast(authProblemMessage("partager cette publication"));
    }
  }

  async function votePoll(postId: number, optionIndex: number) {
    try {
      const mutation = await voteCommunityPoll(postId, optionIndex);
      setPosts((current) =>
        current.map((post) => (post.id === postId ? mutation.post : post)),
      );
      syncPostViewState(mutation.post);
      pushToast("Vote enregistre.");
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast(authProblemMessage("voter à ce sondage"));
        return;
      }
      pushToast("Impossible d'enregistrer ce vote.");
    }
  }
  async function addComment(postId: number) {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) {
      return;
    }
    setAiReplyingPostIds((current) => (current.includes(postId) ? current : [...current, postId]));
    try {
      const mutation = await createCommunityComment(postId, draft);
      setPosts((current) => current.map((post) => (post.id === postId ? mutation.post : post)));
      syncPostViewState(mutation.post);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      pushToast(
        mutation.assistantReplied
          ? "Commentaire publie. Guide PieHUB est intervenu."
          : "Commentaire publie.",
      );
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast(authProblemMessage("commenter dans PieHUB"));
      } else {
        pushToast("Commentaire impossible pour le moment.");
      }
    } finally {
      setAiReplyingPostIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function toggleCommentLike(commentId: number, postId: number) {
    try {
      const mutation = await toggleCommunityCommentReaction(commentId);
      setPosts((current) => current.map((post) => post.id === postId ? mutation.post : post));
      syncPostViewState(mutation.post);
    } catch {
      pushToast(authProblemMessage("aimer ce commentaire"));
    }
  }

  function editPost(post: SocialPost) {
    const currentText = post.type === "poll" ? post.question : post.content;
    setEditTarget({ kind: "post", id: post.id, postId: post.id, tag: post.tag, isPoll: post.type === "poll" });
    setEditDraft(currentText);
  }

  async function removePost(postId: number) {
    if (!window.confirm("Supprimer cette publication ? Cette action la retirera du fil.")) return;
    try {
      await deleteCommunityPost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      pushToast("Publication supprimée.");
    } catch {
      pushToast("Impossible de supprimer cette publication.");
    }
  }

  function editComment(comment: SocialComment, postId: number) {
    if (!comment.id) return;
    setEditTarget({ kind: "comment", id: comment.id, postId });
    setEditDraft(comment.text);
  }

  async function saveEdit() {
    if (!editTarget || editDraft.trim().length < 2) return;
    setIsSavingEdit(true);
    try {
      const mutation = editTarget.kind === "post"
        ? await updateCommunityPost(
            editTarget.id,
            editTarget.isPoll
              ? { question: editDraft.trim(), tag: editTarget.tag }
              : { content: editDraft.trim(), tag: editTarget.tag },
          )
        : await updateCommunityComment(editTarget.id, editDraft.trim());
      setPosts((current) => current.map((post) => post.id === editTarget.postId ? mutation.post : post));
      setEditTarget(null);
      setEditDraft("");
      pushToast(editTarget.kind === "post" ? "Publication modifiée." : "Commentaire modifié.");
    } catch {
      pushToast("Impossible d’enregistrer cette modification.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function removeComment(comment: SocialComment, postId: number) {
    if (!comment.id || !window.confirm("Supprimer ce commentaire ?")) return;
    try {
      const mutation = await deleteCommunityComment(comment.id);
      setPosts((current) => current.map((post) => post.id === postId ? mutation.post : post));
      pushToast("Commentaire supprimé.");
    } catch {
      pushToast("Impossible de supprimer ce commentaire.");
    }
  }

  async function removeStory(story: StoryItem) {
    if (!story.id || !story.viewerCanDelete || !window.confirm("Supprimer cette story ?")) return;
    try {
      await deleteCommunityStory(story.id);
      setLocalStories((current) => current.filter((item) => item.id !== story.id));
      setStoryIndex(null);
      pushToast("Story supprimée.");
    } catch {
      pushToast("Impossible de supprimer cette story.");
    }
  }
  async function toggleFollow(userId: string) {
    const user = findCommunityUser(userId);
    try {
      const result = await toggleCommunityProfileFollow(userId);
      setCommunityUsers((current) =>
        current.map((entry) => {
          if (entry.id === result.profile.id) return result.profile;
          if (result.currentProfile && entry.id === result.currentProfile.id) return result.currentProfile;
          return entry;
        }),
      );
      setFollowingIds((current) =>
        result.isFollowing
          ? Array.from(new Set([...current, userId]))
          : current.filter((id) => id !== userId),
      );
      pushToast(
        result.isFollowing
          ? `✅ Vous suivez maintenant ${result.profile.name}.`
          : `Abonnement annulé pour ${result.profile.name}.`,
      );
    } catch {
      pushToast(authProblemMessage(`suivre ${user.name}`));
    }
  }

  function toggleGroup(name: string) {
    pushToast(`Connectez-vous puis rejoignez le groupe officiel ${name}.`);
  }

  function toggleEvent(name: string) {
    pushToast(`Connectez-vous puis inscrivez-vous à l'événement officiel ${name}.`);
  }

  function openTrend(tag: string) {
    setHashtagFilter(tag);
    setExplorerTab("hashtags");
    switchTab("explorer");
  }

  function openMessagesWith(userId: string) {
    if (userId === currentProfileId) {
      pushToast("C'est votre propre profil PieHUB. Utilisez Guide PieHUB pour l'assistance.");
      return;
    }
    setActiveTab("messages");
    setMessageTargetId(userId);
    setMessages(userId === "piehub" ? createConversationStarter(userId, communityUsers) : []);
    setCommunityConversationId(null);
    setIsAssistantMessageLoading(false);
    setMessageOpen(true);
    focusMainContent();
    if (userId === "piehub") {
      void loadPiehubThread();
    } else {
      void loadDirectThread(userId);
    }
  }

  async function sendMessage() {
    const text = messageDraft.trim();
    if (!text || isAssistantMessageLoading) {
      return;
    }

    if (messageTargetId === "piehub") {
      setIsAssistantMessageLoading(true);

      try {
        const payload = await sendCommunityAssistantMessage(text, communityConversationId);
        setCommunityConversationId(payload.conversationId);
        setMessages(
          payload.messages.length
            ? payload.messages.map((item) => ({
                from: item.from,
                text: item.text,
                time: item.time,
              }))
            : createConversationStarter("piehub", communityUsers),
        );
        setMessageDraft("");
      } catch {
        pushToast(authProblemMessage("discuter avec Guide PieHUB"));
      } finally {
        setIsAssistantMessageLoading(false);
      }
      return;
    }

    setIsAssistantMessageLoading(true);
    try {
      const payload = await sendCommunityDirectMessage(messageTargetId, text);
      setMessages(payload.messages);
      setDirectThreads((current) => [
        payload.thread,
        ...current.filter((thread) => thread.id !== payload.thread.id),
      ]);
      setMessageDraft("");
      pushToast(`Message envoyé à ${messageTarget.name}.`);
    } catch {
      pushToast("Message impossible : ce membre n'a pas encore de compte de réception PieHUB.");
    } finally {
      setIsAssistantMessageLoading(false);
    }
  }

  function loadMore() {
    pushToast(
      feedFromApi
        ? "Toutes les publications disponibles sont affichées."
        : "Le fil doit être reconnecté avant de charger d’autres publications.",
    );
    pushToast("✅ Nouvelles publications chargees.");
  }

  function renderPost(post: SocialPost) {
    const author = findCommunityUser(post.userId);
    const tagMeta = TAG_META[post.tag];
    const isLiked = likedSet.has(post.id);
    const isSaved = savedSet.has(post.id);
    const vote = pollVotes[post.id];
    const reactionCount = post.likes;
    const isAssistantReplying = aiReplyingPostIds.includes(post.id);
    const trustedBadge = getTrustedProfileBadge(author);
    const pinnedOfficialComment = post.pinnedOfficialComment;
    const guideTopic = GUIDE_TOPIC_META[post.tag];
    const guideResources = resourceLibrary.filter((resource) => resourceMatchesPost(resource, post)).slice(0, 2);
    const threadSummary = summarizeThread(post);
    const visibleComments = post.comments.filter(
      (comment) => !pinnedOfficialComment || comment.id !== pinnedOfficialComment.id,
    );

    return (
      <article className="social-post-card" id={`post-${post.id}`} key={post.id}>
        <div className="social-post-header">
          <button className="social-avatar-button" onClick={() => setProfileId(author.id)} type="button">
            <span className="social-avatar" style={{ backgroundColor: author.color }}>
              {author.avatar}
            </span>
          </button>

          <div className="social-post-author">
            <button className="social-post-author-name" onClick={() => setProfileId(author.id)} type="button">
              {author.name}
              {trustedBadge ? <span className="social-official-author-badge">{trustedBadge}</span> : null}
            </button>
            <div className="social-post-meta">
              <span>{author.country}</span>
              <span className="social-dot" />
              <span>{post.time}</span>
              <span className="social-dot" />
              <span className={`social-post-tag ${tagMeta.className}`}>{tagMeta.label}</span>
              {post.isQuestion ? (
                <span className={`social-question-status is-${post.questionStatus || "open"}`}>
                  {post.questionStatus === "official_answered"
                    ? "Réponse officielle"
                    : post.questionStatus === "answered"
                      ? "Répondu"
                      : "Question ouverte"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="social-post-owner-actions">
            {post.viewerCanEdit ? (
              <>
                <button onClick={() => void editPost(post)} type="button">Modifier</button>
                <button className="is-danger" onClick={() => void removePost(post.id)} type="button">Supprimer</button>
              </>
            ) : null}
            <button
              aria-label="Signaler cette publication"
              className="social-icon-button"
              onClick={() => openReportModal({ targetType: "post", targetId: String(post.id), label: `Publication #${post.id}` })}
              type="button"
            >
              ⚑
            </button>
          </div>
        </div>

        <div className="social-post-body">
          {post.isQuestion ? (
            <div className={`social-question-card ${post.resolvedByOfficial ? "is-resolved" : ""}`}>
              <span>{post.resolvedByOfficial ? "Résolu par PieAgency" : "Question communautaire"}</span>
              <strong>{post.officialAnswerCount ? `${post.officialAnswerCount} officielle${post.officialAnswerCount > 1 ? "s" : ""}` : `${post.answerCount || 0} réponse${(post.answerCount || 0) > 1 ? "s" : ""}`}</strong>
            </div>
          ) : null}
          {post.isQuestion ? (
            <div className="social-guide-insight-card">
              <div className="social-guide-insight-head">
                <span>Guide PieHUB</span>
                <strong>Sujet détecté : {guideTopic.label}</strong>
              </div>
              <p>{threadSummary}</p>
              <div className="social-guide-next-step">{guideTopic.nextStep}</div>
              {guideResources.length > 0 ? (
                <div className="social-guide-resources">
                  {guideResources.map((resource) => (
                    <button key={`${post.id}-${resource.name}`} onClick={() => downloadResource(resource)} type="button">
                      📚 {resource.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <Link className="social-guide-contact-link" href={`/contact?motif=${encodeURIComponent(guideTopic.contactReason)}`}>
                Demander l&apos;aide PieAgency
              </Link>
            </div>
          ) : null}
          {post.type === "poll" ? null : <p>{renderRichText(post.content)}</p>}
          {post.mediaUrls?.length ? (
            <div className="social-post-media-grid">
              {post.mediaUrls.map((url) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img alt="Média partagé dans la publication" key={url} loading="lazy" src={url} />
              ))}
            </div>
          ) : null}

          {post.type === "resource" ? (
            <button
              className="social-resource-box"
              disabled={!post.resourceUrl}
              onClick={() => downloadResource({
                name: post.resourceName,
                type: post.resourceType.toUpperCase(),
                size: post.resourceSize,
                author: author.name,
                description: post.content,
                url: post.resourceUrl,
              })}
              type="button"
            >
              <div className={`social-resource-icon social-resource-icon-${post.resourceType}`}>
                {post.resourceType === "pdf" ? "📄" : "📝"}
              </div>
              <div className="social-resource-copy">
                <div className="social-resource-name">{post.resourceName}</div>
                <div className="social-resource-meta">
                  Fichier {post.resourceType.toUpperCase()} · {post.resourceSize} · Cliquez pour telecharger
                </div>
              </div>
              <span className="social-resource-arrow">↓</span>
            </button>
          ) : null}

          {post.type === "poll" ? (
            <div className="social-poll-box">
              <div className="social-poll-question">{post.question}</div>
              {post.options.map((option, index) => {
                const totalVotes = post.options.reduce((sum, item) => sum + item.votes, 0);
                const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                const hasVoted = vote !== undefined;
                return (
                  <button
                    className={`social-poll-option ${vote === index ? "is-voted" : ""}`}
                    key={`${post.id}-${option.text}`}
                    onClick={() => votePoll(post.id, index)}
                    type="button"
                  >
                    <span className="social-poll-bar" style={{ width: hasVoted ? `${percent}%` : "0%" }} />
                    <span className="social-poll-option-text">{option.text}</span>
                    {hasVoted ? <span className="social-poll-percent">{percent}%</span> : null}
                  </button>
                );
              })}
              <div className="social-poll-meta">
                {post.options.reduce((sum, option) => sum + option.votes, 0)} votes ·{" "}
                {vote !== undefined ? "Vote enregistre" : "Cliquez pour voter"}
              </div>
            </div>
          ) : null}
        </div>

        <div className="social-post-reactions">
          <div className="social-reaction-faces">
            <span>❤️</span>
            <span>👏</span>
            <span>🙏</span>
            <span>💡</span>
          </div>
          <span>{reactionCount.toLocaleString()} reactions</span>
          <span className="social-post-reaction-meta">
            {post.comments.length} commentaires · {post.shares} partages
          </span>
        </div>

        <div className="social-post-actions">
          <button className={`social-post-action ${isLiked ? "is-liked" : ""}`} onClick={() => toggleLike(post.id)} type="button">
            ❤️ J&apos;aime
          </button>
          <button
            className="social-post-action is-comment"
            onClick={() => focusCommentInput(post.id)}
            type="button"
          >
            {post.isQuestion ? "💬 Répondre" : "💬 Commenter"}
          </button>
          <button className="social-post-action is-share" onClick={() => sharePost(post.id)} type="button">
            ↗ Partager
          </button>
          <button className={`social-post-action ${isSaved ? "is-saved" : ""}`} onClick={() => toggleSave(post.id)} type="button">
            🔖 Sauvegarder
          </button>
        </div>

        <div className="social-comments">
          {pinnedOfficialComment ? (() => {
            const user = findCommunityUser(pinnedOfficialComment.userId);
            return (
              <div className="social-pinned-official-answer">
                <div className="social-pinned-label">Réponse officielle épinglée</div>
                <div className="social-comment is-official is-pinned">
                  <button className="social-avatar-button" onClick={() => setProfileId(user.id)} type="button">
                    <span className="social-avatar social-avatar-sm" style={{ backgroundColor: user.color }}>
                      {user.avatar}
                    </span>
                  </button>
                  <div className="social-comment-body">
                    <div className="social-comment-head">
                      <strong>{user.name}</strong>
                      <span className="social-comment-trust-badge">{pinnedOfficialComment.trustLabel || getTrustedProfileBadge(user) || "Officiel PieAgency"}</span>
                      <span>{pinnedOfficialComment.time}</span>
                    </div>
                    <div className="social-comment-text">
                      {renderRichText(pinnedOfficialComment.text)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : null}

          {visibleComments.map((comment, index) => {
            const user = findCommunityUser(comment.userId);
            return (
              <div className={`social-comment ${comment.isPending ? "is-pending" : ""} ${comment.isOfficial || user.id === "piehub" ? "is-official" : ""}`} key={`${post.id}-${user.id}-${index}`}>
                <button className="social-avatar-button" onClick={() => setProfileId(user.id)} type="button">
                  <span className="social-avatar social-avatar-sm" style={{ backgroundColor: user.color }}>
                    {user.avatar}
                  </span>
                </button>
                <div className="social-comment-body">
                  <div className="social-comment-head">
                    <strong>{user.name}</strong>
                    {comment.isOfficial || user.id === "piehub" ? (
                      <span className="social-comment-trust-badge">{comment.trustLabel || getTrustedProfileBadge(user) || "Officiel"}</span>
                    ) : null}
                    <span>{comment.time}</span>
                  </div>
                  <div className={`social-comment-text ${comment.isPending ? "is-pending" : ""}`}>
                    {renderRichText(comment.text)}
                  </div>
                  <div className="social-comment-actions">
                    <button
                      aria-pressed={Boolean(comment.viewerHasLiked)}
                      className={comment.viewerHasLiked ? "is-liked" : ""}
                      disabled={!comment.id}
                      onClick={() => comment.id ? void toggleCommentLike(comment.id, post.id) : undefined}
                      type="button"
                    >❤️ {comment.likes}</button>
                    <button
                      onClick={() => {
                        setCommentDrafts((current) => ({ ...current, [post.id]: `@${user.name} ` }));
                        window.requestAnimationFrame(() => focusCommentInput(post.id));
                      }}
                      type="button"
                    >
                      Répondre
                    </button>
                    <button
                      onClick={() => openReportModal({ targetType: "comment", targetId: String(comment.id || `${post.id}-${index}`), label: `Commentaire sur le sujet #${post.id}` })}
                      type="button"
                    >
                      Signaler
                    </button>
                    {comment.viewerCanEdit ? (
                      <>
                        <button onClick={() => void editComment(comment, post.id)} type="button">Modifier</button>
                        <button className="is-danger" onClick={() => void removeComment(comment, post.id)} type="button">Supprimer</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {isAssistantReplying ? (
            <div className="social-comment is-pending">
              <button className="social-avatar-button" onClick={() => setProfileId("piehub")} type="button">
                <span className="social-avatar social-avatar-sm" style={{ backgroundColor: findCommunityUser("piehub").color }}>
                  {findCommunityUser("piehub").avatar}
                </span>
              </button>
              <div className="social-comment-body">
                <div className="social-comment-head">
                  <strong>{findCommunityUser("piehub").name}</strong>
                  <span>A l&apos;instant</span>
                </div>
                <div className="social-comment-text is-pending">{messageTargetId === "piehub" ? "Guide PieHUB prepare une reponse..." : "Envoi du message..."}</div>
              </div>
            </div>
          ) : null}

          <div className="social-comment-form">
            <span className="social-avatar social-avatar-sm" style={{ backgroundColor: currentUser.color }}>
              {currentUser.avatar}
            </span>
            <input
              className="social-comment-input"
              ref={(node) => {
                commentInputRefs.current[post.id] = node;
              }}
              onChange={(event) =>
                setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addComment(post.id);
                }
              }}
              placeholder={post.isQuestion ? "Répondre à cette question..." : "Ajouter un commentaire..."}
              type="text"
              value={commentDrafts[post.id] ?? ""}
            />
            <button className="social-send-button" onClick={() => addComment(post.id)} type="button">
              ➤
            </button>
          </div>
        </div>
      </article>
    );
  }

  const activeLocalStories = localStories.filter((s) => (s.createdAt ?? 0) > Date.now() - 24 * 60 * 60 * 1000);
  const selectedStoryUser =
    storyIndex !== null && activeLocalStories[storyIndex]
      ? findCommunityUser(activeLocalStories[storyIndex].userId)
      : currentUser;
  const selectedProfile = profileId ? findCommunityUser(profileId) : currentUser;
  const selectedProfilePosts = profileId ? posts.filter((post) => post.userId === profileId) : [];
  const selectedProfileRecentPosts = selectedProfilePosts.slice(0, 3);
  const selectedProfileAnsweredCount = selectedProfilePosts.filter((post) => post.questionStatus && post.questionStatus !== "open").length;
  const selectedProfileHelpScore = Math.min(100, Math.round((selectedProfile.posts * 8) + (selectedProfile.followers / 12) + (selectedProfileAnsweredCount * 14)));
  const selectedProfileTrustLabel = selectedProfile.isOfficial
    ? "Profil officiel"
    : selectedProfileHelpScore >= 70
      ? "Membre fiable"
      : selectedProfileHelpScore >= 35
        ? "Contributeur actif"
        : "Nouveau membre";
  const selectedProfileGroups = profileId
    ? apiGroups.filter((group) =>
        group.createdByProfileId === profileId ||
        selectedProfilePosts.some((post) => post.groupId && String(post.groupId) === String(group.id)),
      ).slice(0, 4)
    : [];
  const openQuestionPosts = posts.filter(
    (post) => post.isQuestion && post.questionStatus === "open",
  );

  const hashtagPosts = hashtagFilter
    ? posts.filter((post) => {
        const tagMeta = TAG_META[post.tag];
        return normalizeForSearch(`${tagMeta.label} ${getPostPlainText(post)}`).includes(
          normalizeForSearch(hashtagFilter.replace("#", "")),
        );
      })
    : posts;

  const dynamicTrends = (() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      const base = TAG_META[post.tag].label.replace(/\s+/g, "");
      counts.set(`#${base}`, (counts.get(`#${base}`) || 0) + 1);
      extractKeywords(getPostPlainText(post)).slice(0, 3).forEach((keyword) => {
        const label = `#${keyword.charAt(0).toUpperCase()}${keyword.slice(1)}`;
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    });
    const items = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count: `${count} post${count > 1 ? "s" : ""}` }));
    return items.length ? items : TRENDING;
  })();

  const filteredFeedPosts = posts.filter((post) => {
    if (feedFilter === "open") return post.isQuestion && post.questionStatus === "open";
    if (feedFilter === "answered") return post.isQuestion && post.questionStatus !== "open";
    if (feedFilter === "official") return post.questionStatus === "official_answered" || post.comments.some((comment) => comment.userId === "piehub");
    if (feedFilter === "popular") return post.likes + post.comments.length + post.shares >= 20;
    return true;
  });

  const joinedApiGroupIds = new Set(apiGroups.filter((group) => group.isMember).map((group) => String(group.id)));
  const getSmartFeedScore = (post: SocialPost) => {
    const isOpenQuestion = post.isQuestion && post.questionStatus === "open";
    const hasOfficialSignal = post.hasOfficialAnswer || post.comments.some((comment) => comment.isOfficial || comment.userId === "piehub");
    const isFromFollowedMember = followingSet.has(post.userId);
    const isFromJoinedGroup = post.groupId ? joinedApiGroupIds.has(String(post.groupId)) : false;
    const engagementScore = Math.min(post.likes + post.comments.length * 3 + post.shares * 2, 40);
    const recencyScore = Math.max(0, 30 - Math.min(Math.abs(post.id - postIdRef.current), 30));

    return (
      recencyScore +
      engagementScore +
      (isOpenQuestion ? 55 : 0) +
      (hasOfficialSignal ? 28 : 0) +
      (isFromJoinedGroup ? 24 : 0) +
      (isFromFollowedMember ? 16 : 0)
    );
  };
  const smartFeedPosts = [...filteredFeedPosts].sort((a, b) => getSmartFeedScore(b) - getSmartFeedScore(a));
  const recommendedFeedPosts = smartFeedPosts
    .filter((post) => post.isQuestion || post.groupId || followingSet.has(post.userId) || post.comments.length > 0)
    .slice(0, 3);
  const recentFeedPosts = [...posts].sort((a, b) => b.id - a.id).slice(0, 3);
  const officialInterventionPosts = posts.filter((post) => post.hasOfficialAnswer || post.comments.some((comment) => comment.isOfficial || comment.userId === "piehub"));
  const hasAskedQuestion = posts.some((post) => post.userId === currentProfileId && post.isQuestion);
  const socialOnboardingSteps = [
    {
      key: "profile",
      label: "Profil clair",
      detail: "Ajoutez votre étape, pays et centres d'intérêt pour être mieux aidé.",
      done: Boolean(currentUser.bio && currentUser.tags.length >= 2 && currentUser.stageLabel),
      action: "Voir mon profil",
    },
    {
      key: "group",
      label: "Premier groupe",
      detail: "Rejoignez un espace Campus France, Visa ou logement pour recevoir les bons sujets.",
      done: joinedGroupCount > 0,
      action: "Rejoindre",
    },
    {
      key: "question",
      label: "Première question",
      detail: "Posez une question précise et laissez la communauté vous orienter.",
      done: hasAskedQuestion,
      action: "Question",
    },
    {
      key: "follow",
      label: "Réseau utile",
      detail: "Suivez au moins 3 membres ou conseillers pour personnaliser votre fil.",
      done: followingSet.size >= 3,
      action: "Explorer",
    },
  ];
  const onboardingDoneCount = socialOnboardingSteps.filter((step) => step.done).length;
  const onboardingProgress = Math.round((onboardingDoneCount / socialOnboardingSteps.length) * 100);
  const communityMomentumScore = Math.min(
    100,
    Math.round(
      onboardingProgress * 0.35 +
      Math.min(openQuestionPosts.length * 8, 28) +
      Math.min(followingSet.size * 5, 18) +
      Math.min(joinedGroupCount * 12, 24),
    ),
  );
  const nextBestAction = unreadNotifCount > 0
    ? "Traiter vos notifications"
    : openQuestionPosts.length > 0
      ? "Répondre à une question"
      : joinedGroupCount === 0
        ? "Rejoindre un groupe"
        : "Publier une mise à jour";

  const similarQuestionPosts = composeMode === "question"
    ? posts
        .filter((post) => post.isQuestion)
        .map((post) => {
          const draftKeywords = new Set(extractKeywords(composeText));
          const postKeywords = extractKeywords(getPostPlainText(post));
          const score = postKeywords.filter((keyword) => draftKeywords.has(keyword)).length;
          return { post, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  return (
    <div className="social-page-shell">
      <div className="social-topbar">
        <div className="social-topbar-left">
          <Link className="social-topbar-brand" href="/communaute">
            <Image
              alt="PieAgency"
              className="social-topbar-logo"
              height={40}
              priority
              src="/pieagency-logo.jpg"
              width={40}
            />
            <span className="social-topbar-brand-text">PieHUB</span>
          </Link>
          <Link className="social-topbar-site-link" href="/">
            PieAgency
          </Link>
        </div>

        <form className="social-topbar-search" onSubmit={handleSearchSubmit}>
          <span>⌕</span>
          <input
            aria-label="Rechercher dans PieHUB"
            className="social-topbar-search-input"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher des etudiants, posts, ressources..."
            type="search"
            value={searchTerm}
          />
          <button className="social-topbar-search-button" type="submit">
            Chercher
          </button>
        </form>

        <div className="social-topbar-actions">
          <span className={`social-auth-status ${isPieAgencyConnected ? "is-connected" : "is-disconnected"}`} title={isPieAgencyConnected ? "Session PieAgency active" : "Session PieAgency absente"}>
            <span /> {authReady ? (isPieAgencyConnected ? "Connecté" : "Non connecté") : "Vérification"}
          </span>
          <button aria-label="Ouvrir les messages" className="social-icon-button" onClick={() => openMessagesWith("piehub")} type="button">
            💬
          </button>
          <button aria-expanded={notifPanelOpen} aria-label="Ouvrir les notifications" className="social-icon-button social-notif-button" onClick={() => setNotifPanelOpen(!notifPanelOpen)} type="button">
            🔔
            {unreadNotifCount > 0 ? (
              <span className="social-notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
            ) : null}
          </button>
          <button aria-label="Ouvrir mon profil" className="social-profile-trigger" onClick={() => setProfileId(currentProfileId)} type="button">
            {currentUser.avatar}
          </button>
        </div>
      </div>

      <CommunityMobileNavigation
        activeTab={activeTab}
        onSelect={(tab) => tab === "messages" ? openMessagesWith("piehub") : switchTab(tab)}
      />

      <div className="social-app-shell">
        <aside className="social-sidebar-left">
          <div className="social-profile-card">
            <span className="social-avatar social-avatar-lg" style={{ backgroundColor: currentUser.color }}>
              {currentUser.avatar}
            </span>
            <div className="social-profile-name">{currentUser.name}</div>
            <div className="social-profile-tagline">
              {currentUser.tag} · {currentUser.country}
            </div>
            <div className="social-profile-badges">
              <span>{getProfileStageLabel(currentUser)}</span>
              <span>{getProfileActivityLabel(currentUser)}</span>
            </div>
            <div className="social-profile-activity-note">
              {getProfileLastActivityLabel(currentUser)}
            </div>
            <div className="social-profile-stats">
              <div>
                <strong>{currentUser.posts}</strong>
                <span>Posts</span>
              </div>
              <div>
                <strong>{currentUser.followers}</strong>
                <span>Abonnes</span>
              </div>
              <div>
                <strong>{currentUser.following}</strong>
                <span>Abonnements</span>
              </div>
            </div>
          </div>

          <div className="social-nav-group">
            <div className="social-nav-label">Navigation</div>
            <button className={`social-nav-item ${activeTab === "feed" ? "is-active" : ""}`} onClick={() => switchTab("feed")} type="button"><span className="social-nav-symbol">▦</span><span>Fil d&apos;actualite</span></button>
            <button className={`social-nav-item ${activeTab === "explorer" ? "is-active" : ""}`} onClick={() => switchTab("explorer")} type="button"><span className="social-nav-symbol">⌕</span><span>Explorer</span></button>
            <button className={`social-nav-item ${activeTab === "groupes" ? "is-active" : ""}`} onClick={() => switchTab("groupes")} type="button"><span className="social-nav-symbol">👥</span><span>Groupes</span><span className="social-nav-badge">{joinedGroupCount}</span></button>
            <button className={`social-nav-item ${activeTab === "evenements" ? "is-active" : ""}`} onClick={() => switchTab("evenements")} type="button"><span className="social-nav-symbol">🗓</span><span>Evenements</span><span className="social-nav-badge">{joinedEventCount}</span></button>
            <button className={`social-nav-item ${activeTab === "ressources" ? "is-active" : ""}`} onClick={() => switchTab("ressources")} type="button"><span className="social-nav-symbol">📚</span><span>Ressources</span></button>
            <button className={`social-nav-item ${activeTab === "messages" ? "is-active" : ""}`} onClick={() => openMessagesWith("piehub")} type="button"><span className="social-nav-symbol">💬</span><span>Messages</span><span className="social-nav-badge">{messages.length}</span></button>
            <button className={`social-nav-item ${activeTab === "publicite" ? "is-active" : ""}`} onClick={() => switchTab("publicite")} type="button"><span className="social-nav-symbol">📢</span><span>Publicités</span></button>
          </div>

          <div className="social-nav-group">
            <div className="social-nav-label">Rejoindre</div>
            <Link className="social-nav-item" href="/contact"><span className="social-nav-symbol">💬</span><span>Formulaire PieAgency</span></Link>
            <a className="social-nav-item" href={company.communityLinks[1].href} rel="noreferrer" target="_blank"><span className="social-nav-symbol">👥</span><span>Groupe Facebook</span></a>
          </div>
        </aside>

        <main className="social-main-feed" ref={mainFeedRef}>
          <CommunityStatus state={communityLoadState} onRetry={() => void hydrateCommunityFeed()} />
          {activeTab === "feed" ? (
            <>
              {(() => {
                const cutoff = Date.now() - 24 * 60 * 60 * 1000;
                const activeStories = localStories.filter((s) => (s.createdAt ?? 0) > cutoff);
                const myStory = activeStories.find((s) => s.userId === currentProfileId);
                return (
                  <div className="social-stories-row">
                    {/* Bouton ajouter statut */}
                    <button className="social-story-item" onClick={() => openCompose("story")} type="button">
                      <span className={`social-story-ring ${myStory ? "is-active" : "is-seen"}`}>
                        <span className="social-story-inner social-story-add">+</span>
                      </span>
                      <span className="social-story-label">{myStory ? "Mon statut" : "Statut"}</span>
                    </button>
                    {/* Statuts actifs des membres */}
                    {activeStories.map((story, index) => {
                      const user = findCommunityUser(story.userId);
                      return (
                        <button className="social-story-item" key={`story-${story.userId}-${story.createdAt ?? index}`} onClick={() => setStoryIndex(index)} type="button">
                          <span className="social-story-ring">
                            <span className="social-story-inner">
                              <span className="social-avatar social-avatar-story" style={{ backgroundColor: user.color }}>
                                {user.avatar}
                              </span>
                            </span>
                          </span>
                          <span className="social-story-label">{user.name.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="social-create-card social-create-card-premium">
                <div className="social-create-top">
                  <span className="social-avatar" style={{ backgroundColor: currentUser.color }}>
                    {currentUser.avatar}
                  </span>
                  <button className="social-create-input is-question-first" onClick={() => openQuestionComposer()} type="button">
                    Posez votre question à la communauté PieHUB...
                  </button>
                </div>
                <div className="social-question-categories">
                  {QUESTION_CATEGORIES.map((category) => (
                    <button
                      key={category.label}
                      onClick={() => openQuestionComposer(category.tag, category.prompt)}
                      type="button"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <div className="social-create-actions">
                  <button className="social-create-action is-comment" onClick={() => openQuestionComposer()} type="button">Question</button>
                  <button className="social-create-action is-doc" onClick={() => openCompose("doc")} type="button">Document</button>
                  <button className="social-create-action is-poll" onClick={() => openCompose("poll")} type="button">Sondage</button>
                  <button className="social-create-action is-event" onClick={() => openCompose("event")} type="button">Evenement</button>
                  <button className="social-create-action is-photo" onClick={() => openCompose("story")} type="button">Story</button>
                </div>
              </div>

              <div className="social-momentum-panel">
                <div className="social-momentum-main">
                  <span>Mission du jour</span>
                  <strong>{nextBestAction}</strong>
                  <p>PieHUB devient utile quand chaque visite produit une action : aider, demander, rejoindre ou répondre.</p>
                </div>
                <div className="social-momentum-score">
                  <b>{communityMomentumScore}%</b>
                  <small>activité</small>
                </div>
                <div className="social-momentum-actions">
                  <button onClick={() => openQuestionPosts[0] ? focusCommentInput(openQuestionPosts[0].id) : openQuestionComposer()} type="button">
                    {openQuestionPosts.length ? "Aider maintenant" : "Poser une question"}
                  </button>
                  <button onClick={() => openMessagesWith("piehub")} type="button">Messages</button>
                  <button onClick={() => joinedGroupCount ? switchTab("groupes") : switchTab("groupes")} type="button">Groupes</button>
                </div>
              </div>

              <div className="social-onboarding-panel">
                <div className="social-onboarding-head">
                  <div>
                    <span>Parcours PieHUB</span>
                    <strong>Devenez visible et utile dans la communauté</strong>
                  </div>
                  <b>{onboardingProgress}%</b>
                </div>
                <div className="social-onboarding-progress"><span style={{ width: `${onboardingProgress}%` }} /></div>
                <div className="social-onboarding-steps">
                  {socialOnboardingSteps.map((step) => (
                    <button
                      className={`social-onboarding-step ${step.done ? "is-done" : ""}`}
                      key={step.key}
                      onClick={() => {
                        if (step.key === "profile") setProfileId(currentProfileId);
                        if (step.key === "group") switchTab("groupes");
                        if (step.key === "question") openQuestionComposer();
                        if (step.key === "follow") { setExplorerTab("membres"); switchTab("explorer"); }
                      }}
                      type="button"
                    >
                      <span>{step.done ? "✓" : "•"}</span>
                      <strong>{step.label}</strong>
                      <small>{step.done ? "Validé" : step.detail}</small>
                      <em>{step.done ? "OK" : step.action}</em>
                    </button>
                  ))}
                </div>
              </div>

              {recommendedFeedPosts.length > 0 ? (
                <div className="social-smart-feed-panel">
                  <div className="social-smart-feed-head">
                    <div>
                      <span>Fil intelligent</span>
                      <strong>À traiter maintenant</strong>
                    </div>
                    <button onClick={() => setFeedFilter("open")} type="button">Voir sans réponse</button>
                  </div>
                  <div className="social-smart-feed-grid">
                    {recommendedFeedPosts.map((post) => {
                      const author = findCommunityUser(post.userId);
                      const reason = post.isQuestion && post.questionStatus === "open"
                        ? "Question prioritaire"
                        : post.groupId
                          ? "Depuis un groupe"
                          : followingSet.has(post.userId)
                            ? "Membre suivi"
                            : "Sujet actif";
                      return (
                        <button className="social-smart-feed-card" key={`smart-${post.id}`} onClick={() => focusCommentInput(post.id)} type="button">
                          <span>{reason}</span>
                          <strong>{getPostPlainText(post).slice(0, 92)}{getPostPlainText(post).length > 92 ? "…" : ""}</strong>
                          <small>{author.name} · {post.comments.length} réponse{post.comments.length > 1 ? "s" : ""} · {post.likes} j&apos;aime</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="social-feed-insights">
                <button onClick={() => setFeedFilter("open")} type="button">
                  <strong>{openQuestionPosts.length}</strong>
                  <span>questions à aider</span>
                </button>
                <button onClick={() => setFeedFilter("official")} type="button">
                  <strong>{officialInterventionPosts.length}</strong>
                  <span>réponses fiables</span>
                </button>
                <button onClick={() => switchTab("groupes")} type="button">
                  <strong>{joinedGroupCount}</strong>
                  <span>groupes rejoints</span>
                </button>
                <button onClick={() => { setExplorerTab("membres"); switchTab("explorer"); }} type="button">
                  <strong>{followingSet.size}</strong>
                  <span>membres suivis</span>
                </button>
              </div>

              <div className="social-safety-panel">
                <strong>Qualité PieHUB</strong>
                <span>Fausse information, arnaque, spam ou attaque : signalez. L’équipe PieAgency garde le fil propre.</span>
              </div>

              {openQuestionPosts.length > 0 ? (
                <div className="social-open-questions-panel">
                  <div>
                    <strong>Questions sans réponse</strong>
                    <span>{openQuestionPosts.length} sujet{openQuestionPosts.length > 1 ? "s" : ""} à aider maintenant</span>
                  </div>
                  {openQuestionPosts.slice(0, 3).map((post) => (
                    <button key={`open-question-${post.id}`} onClick={() => focusCommentInput(post.id)} type="button">
                      Répondre au sujet #{post.id}
                    </button>
                  ))}
                </div>
              ) : null}

              {officialInterventionPosts.length > 0 ? (
                <div className="social-official-history-panel">
                  <div>
                    <strong>Interventions officielles PieAgency</strong>
                    <span>{officialInterventionPosts.length} sujet{officialInterventionPosts.length > 1 ? "s" : ""} avec réponse fiable</span>
                  </div>
                  {officialInterventionPosts.slice(0, 3).map((post) => (
                    <button key={`official-history-${post.id}`} onClick={() => focusCommentInput(post.id)} type="button">
                      Voir le sujet #{post.id}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="social-feed-filter-bar">
                {FEED_FILTERS.map((filter) => (
                  <button
                    className={feedFilter === filter.key ? "is-active" : ""}
                    key={filter.key}
                    onClick={() => setFeedFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {smartFeedPosts.length > 0 ? (
                smartFeedPosts.map((post) => renderPost(post))
              ) : (
                <div className="social-list-card social-empty-state">
                  <span className="social-list-copy">
                    <strong>Ce filtre est calme pour le moment.</strong>
                    <small>Créez le prochain sujet utile ou passez au fil intelligent.</small>
                  </span>
                  <button className="social-secondary-button" onClick={() => openQuestionComposer()} type="button">
                    Poser une question
                  </button>
                </div>
              )}

              <div className="social-recent-strip">
                <strong>Récents</strong>
                {recentFeedPosts.map((post) => (
                  <button key={`recent-${post.id}`} onClick={() => focusCommentInput(post.id)} type="button">
                    #{post.id} · {getPostPlainText(post).slice(0, 54)}{getPostPlainText(post).length > 54 ? "…" : ""}
                  </button>
                ))}
              </div>

              <div className="social-load-more">
                <button className="social-secondary-button" onClick={loadMore} type="button">
                  Voir plus de publications
                </button>
              </div>
            </>
          ) : null}

          {activeTab === "explorer" ? (
            <section className="social-tab-section">
              <h2>Explorer PieHUB</h2>
              <p>
                {normalizedSearchTerm
                  ? `Resultats pour "${searchTerm.trim()}".`
                  : "Retrouvez les publications, membres et hashtags utiles a votre parcours."}
              </p>
              <div className="social-tab-bar">
                <button className={`social-tab-button ${explorerTab === "posts" ? "is-active" : ""}`} onClick={() => setExplorerTab("posts")} type="button">Publications</button>
                <button className={`social-tab-button ${explorerTab === "membres" ? "is-active" : ""}`} onClick={() => setExplorerTab("membres")} type="button">Membres</button>
                <button className={`social-tab-button ${explorerTab === "hashtags" ? "is-active" : ""}`} onClick={() => setExplorerTab("hashtags")} type="button">Hashtags</button>
              </div>

              {explorerTab === "posts" ? (
                <div>
                  {filteredPosts.length ? (
                    filteredPosts.slice(0, normalizedSearchTerm ? 6 : 3).map((post) => renderPost(post))
                  ) : (
                    <div className="social-list-card social-empty-state">
                      <span className="social-list-copy">
                        <strong>Aucune publication ne correspond.</strong>
                        <small>Essayez un autre mot-cle ou publiez dans le fil.</small>
                      </span>
                      <button className="social-secondary-button" onClick={() => switchTab("feed")} type="button">
                        Retour au fil
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {explorerTab === "membres" ? (
                <div className="social-member-grid">
                  {filteredUsers.filter((user) => user.id !== currentProfileId).map((user) => (
                    <button className="social-member-card" key={user.id} onClick={() => setProfileId(user.id)} type="button">
                      <span className="social-avatar social-avatar-xl" style={{ backgroundColor: user.color }}>
                        {user.avatar}
                      </span>
                      <strong>{user.name}</strong>
                      <span>{user.country}</span>
                      <span className={`social-follow-button ${followingSet.has(user.id) ? "is-following" : ""}`} onClick={(event) => { event.stopPropagation(); toggleFollow(user.id); }}>
                        {followingSet.has(user.id) ? "Abonne" : "Suivre"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {explorerTab === "hashtags" ? (
                <div className="social-stack">
                  {hashtagFilter ? (
                    <div className="social-list-card">
                      <span className="social-list-copy">
                        <strong>Filtre actif : {hashtagFilter}</strong>
                        <small>{hashtagPosts.length} publication(s) trouvee(s)</small>
                      </span>
                      <button
                        className="social-secondary-button"
                        onClick={() => setHashtagFilter(null)}
                        type="button"
                      >
                        Reinitialiser
                      </button>
                    </div>
                  ) : null}
                  {dynamicTrends.map((trend) => (
                    <button className="social-list-card" key={trend.tag} onClick={() => openTrend(trend.tag)} type="button">
                      <span className="social-list-icon social-hash-icon">#</span>
                      <span className="social-list-copy">
                        <strong>{trend.tag}</strong>
                        <small>{trend.count}</small>
                      </span>
                      <span className="social-list-arrow">›</span>
                    </button>
                  ))}
                  {hashtagFilter ? (
                    <div>{hashtagPosts.slice(0, 4).map((post) => renderPost(post))}</div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "groupes" ? (
            <section className="social-tab-section">
              {(selectedGroupName || selectedApiGroupId) ? (
                <>
                  <button
                    className="social-back-button"
                    onClick={() => {
                      setSelectedGroupName(null);
                      setSelectedApiGroupId(null);
                      setGroupDetailPosts([]);
                      setGroupDetailTab("posts");
                      setComposeGroupId(null);
                    }}
                    type="button"
                  >
                    ← Retour aux groupes
                  </button>
                  {selectedGroupName ? (() => {
                    const group = GROUPS.find((g) => g.name === selectedGroupName);
                    if (!group) return null;
                    const tag = GROUP_TAG_MAP[group.name];
                    const groupPosts = posts.filter((post) => post.tag === tag);
                    return (
                      <>
                        <div className="social-group-detail-header" style={{ background: group.color }}>
                          <span className="social-group-detail-icon">{group.icon}</span>
                          <div className="social-group-detail-info">
                            <h2>{group.name}</h2>
                            <p>{group.desc}</p>
                            <small>{group.members.toLocaleString()} membres</small>
                          </div>
                          <button
                            className={`social-join-button ${groupState[group.name] ? "is-joined" : ""}`}
                            onClick={() => toggleGroup(group.name)}
                            type="button"
                          >
                            {groupState[group.name] ? "✓ Rejoint" : "Rejoindre"}
                          </button>
                        </div>
                        <div className="social-group-post-count">
                          {groupPosts.length} publication{groupPosts.length !== 1 ? "s" : ""} dans ce groupe
                        </div>
                        {groupPosts.length > 0 ? (
                          groupPosts.map((post) => renderPost(post))
                        ) : (
                          <div className="social-list-card social-empty-state">
                            <span className="social-list-copy">
                              <strong>Aucune publication pour le moment.</strong>
                              <small>Soyez le premier a partager dans ce groupe.</small>
                            </span>
                            <button className="social-secondary-button" onClick={() => openCompose("text")} type="button">
                              Publier
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })() : selectedApiGroupId ? (() => {
                    const group = apiGroups.find((g) => String(g.id) === selectedApiGroupId);
                    if (!group) return null;
                    const groupCategory = group.category.toLowerCase();
                    const groupTag = (group.category || "campus") as TagKey;
                    const groupResources = resourceLibrary
                      .filter((resource) => resource.tag === groupTag || resource.description.toLowerCase().includes(groupCategory))
                      .slice(0, 6);
                    const groupEvents = apiEvents
                      .filter((event) => `${event.name} ${event.description}`.toLowerCase().includes(groupCategory))
                      .slice(0, 4);
                    return (
                      <>
                        <div className="social-group-detail-hero">
                          <div className="social-group-detail-cover">
                            <span className="social-group-detail-icon">{group.icon}</span>
                            <div className="social-group-detail-info">
                              <span className="social-group-kicker">Espace communautaire</span>
                              <h2>{group.name}</h2>
                              <p>{group.description}</p>
                              <small>{group.memberCount.toLocaleString()} membres · {groupDetailPosts.length} publications · {group.isOfficial ? "Groupe officiel" : "Groupe membre"}</small>
                            </div>
                          </div>
                          <div className="social-group-detail-actions">
                            <button className={`social-join-button ${group.isMember ? "is-joined" : ""}`} onClick={() => void handleApiGroupMembership(group.id, group.name)} type="button">
                              {group.isMember ? "✓ Rejoint" : "Rejoindre"}
                            </button>
                            <button className="social-primary-pill" onClick={() => { setComposeGroupId(selectedApiGroupId); openCompose("text"); }} type="button">
                              + Publier
                            </button>
                          </div>
                        </div>

                        <div className="social-group-composer-card" onClick={() => { setComposeGroupId(selectedApiGroupId); openCompose("text"); }} role="button" tabIndex={0}>
                          <span className="social-avatar" style={{ backgroundColor: currentUser?.color || "#C8952A" }}>{currentUser?.avatar || "YJ"}</span>
                          <div>
                            <strong>Publier dans {group.name}</strong>
                            <small>Posez une question, partagez une ressource ou lancez un sondage dans ce groupe.</small>
                          </div>
                          <button className="social-secondary-pill" type="button">Écrire</button>
                        </div>

                        <div className="social-group-tabs" role="tablist" aria-label="Navigation du groupe">
                          {([
                            ["posts", "Publications", groupDetailPosts.length],
                            ["membres", "Membres", group.memberCount],
                            ["ressources", "Ressources", groupResources.length],
                            ["evenements", "Événements", groupEvents.length],
                          ] as const).map(([tab, label, count]) => (
                            <button className={`social-group-tab ${groupDetailTab === tab ? "is-active" : ""}`} key={tab} onClick={() => setGroupDetailTab(tab)} type="button">
                              {label}<span>{count}</span>
                            </button>
                          ))}
                        </div>

                        {groupDetailTab === "posts" ? (
                          <div className="social-group-panel">
                            <div className="social-group-post-count">
                              {isLoadingGroupPosts ? "Chargement..." : `${groupDetailPosts.length} publication${groupDetailPosts.length !== 1 ? "s" : ""} dans ce groupe`}
                            </div>
                            {isLoadingGroupPosts ? (
                              <div className="social-list-card social-empty-state"><span className="social-list-copy"><strong>Chargement du groupe...</strong><small>On récupère les publications du groupe.</small></span></div>
                            ) : groupDetailPosts.length > 0 ? (
                              groupDetailPosts.map((post) => renderPost(post))
                            ) : (
                              <div className="social-list-card social-empty-state">
                                <span className="social-list-copy"><strong>Aucune publication pour le moment.</strong><small>Soyez le premier à partager dans ce groupe.</small></span>
                                <button className="social-secondary-button" onClick={() => { setComposeGroupId(selectedApiGroupId); openCompose("text"); }} type="button">Publier</button>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {groupDetailTab === "membres" ? (
                          <div className="social-group-grid">
                            {groupDetailMembers.map(({ profile: member, role }) => (
                              <div className="social-member-card" key={member.id}>
                                <button onClick={() => setProfileId(member.id)} type="button">
                                <span className="social-avatar" style={{ backgroundColor: member.color }}>{member.avatar}</span>
                                <strong>{member.name}</strong>
                                <small>{role === "owner" ? "Propriétaire" : role === "moderator" ? "Modérateur" : "Membre"}</small>
                                </button>
                                {group.viewerRole === "owner" && role !== "owner" ? <span className="social-member-admin-actions">
                                  <button onClick={async () => { try { setGroupDetailMembers(await updateCommunityGroupMemberRole(group.id, member.id, role === "moderator" ? "member" : "moderator")); } catch { pushToast("Impossible de modifier ce rôle."); } }} type="button">{role === "moderator" ? "Retirer modérateur" : "Nommer modérateur"}</button>
                                  <button onClick={async () => { try { setGroupDetailMembers(await removeCommunityGroupMember(group.id, member.id)); setApiGroups((items) => items.map((item) => item.id === group.id ? { ...item, memberCount: Math.max(0, item.memberCount - 1) } : item)); } catch { pushToast("Impossible de retirer ce membre."); } }} type="button">Retirer</button>
                                </span> : null}
                              </div>
                            ))}
                            {isLoadingGroupMembers ? <div className="social-list-card social-empty-state"><span className="social-list-copy"><strong>Chargement des membres...</strong></span></div> : null}
                            {!isLoadingGroupMembers && !groupDetailMembers.length ? <div className="social-list-card social-empty-state"><span className="social-list-copy"><strong>{group.isMember ? "Aucun membre affiché." : "Liste réservée aux membres."}</strong><small>{group.isMember ? "Les membres apparaîtront ici au fur et à mesure." : "Rejoignez le groupe pour consulter la liste réelle."}</small></span></div> : null}
                          </div>
                        ) : null}

                        {groupDetailTab === "ressources" ? (
                          <div className="social-group-grid">
                            {groupResources.map((resource) => (
                              <button className="social-resource-card" key={`${group.id}-${resource.name}`} onClick={() => downloadResource(resource)} type="button">
                                <span className="social-resource-card-icon">📚</span>
                                <span className="social-resource-card-name">{resource.name}</span>
                                <small>{resource.type} · {resource.size}</small>
                              </button>
                            ))}
                            <button className="social-list-card social-empty-state" onClick={() => { setComposeGroupId(selectedApiGroupId); openCompose("doc"); }} type="button">
                              <span className="social-list-copy"><strong>Partager une ressource</strong><small>Ajoutez un document utile pour ce groupe.</small></span>
                            </button>
                          </div>
                        ) : null}

                        {groupDetailTab === "evenements" ? (
                          <div className="social-stack">
                            {groupEvents.length ? groupEvents.map((event) => (
                              <div className="social-event-card" key={`group-event-${event.id}`}>
                                <span className="social-event-date">{event.eventDate.slice(5) || "Live"}</span>
                                <span className="social-event-copy"><strong>{event.name}</strong><small>{event.description}</small></span>
                                <button className={`social-event-button ${event.isAttending ? "is-joined" : ""}`} onClick={() => void handleApiEventAttendance(event.id, event.name)} type="button">{event.isAttending ? "✓ Inscrit" : "Participer"}</button>
                              </div>
                            )) : <div className="social-list-card social-empty-state"><span className="social-list-copy"><strong>Aucun événement lié.</strong><small>Créez un événement pour animer ce groupe.</small></span><button className="social-secondary-button" onClick={() => setCreateEventOpen(true)} type="button">Créer</button></div>}
                          </div>
                        ) : null}
                      </>
                    );
                  })() : null}
                </>
              ) : (
                <>
                  <h2>Groupes</h2>
                  <p>Rejoignez des espaces thematiques et echangez avec d&apos;autres etudiants.</p>
                  <div className="social-section-actions">
                    <button className="social-primary-pill" onClick={() => setCreateGroupOpen(true)} type="button">
                      + Créer un groupe
                    </button>
                  </div>
                  <div className="social-stack">
                    {([] as GroupItem[]).map((group) => (
                      <div className="social-list-card" key={`static-${group.name}`}>
                        <span className="social-list-icon" style={{ background: group.color }}>
                          {group.icon}
                        </span>
                        <span className="social-list-copy">
                          <button className="social-group-name-button" onClick={() => setSelectedGroupName(group.name)} type="button">
                            <strong>{group.name}</strong>
                          </button>
                          <small>{group.members.toLocaleString()} membres · {group.desc}</small>
                        </span>
                        <button
                          className={`social-join-button ${groupState[group.name] ? "is-joined" : ""}`}
                          onClick={() => toggleGroup(group.name)}
                          type="button"
                        >
                          {groupState[group.name] ? "✓ Rejoint" : "Rejoindre"}
                        </button>
                      </div>
                    ))}
                    {!apiGroups.length ? (
                      <div className="social-list-card social-empty-state">
                        <span className="social-list-copy">
                          <strong>Aucun groupe disponible</strong>
                          <small>Les groupes réels apparaîtront ici dès qu’ils seront publiés.</small>
                        </span>
                      </div>
                    ) : null}
                    {apiGroups.map((group) => (
                      <div className={`social-list-card social-group-card ${group.isMember ? "is-joined" : ""}`} key={`api-${group.id}`}>
                        <button className="social-group-card-main" onClick={() => void openGroupDetail(group)} type="button">
                          <span className="social-list-icon">{group.icon}</span>
                          <span className="social-list-copy"><strong>{group.name}</strong><small>{group.memberCount.toLocaleString()} membres · {group.description}</small></span>
                          <span className="social-list-arrow">Entrer →</span>
                        </button>
                        <div className="social-group-card-actions">
                          <button className="social-secondary-pill" onClick={() => void openGroupDetail(group)} type="button">Entrer</button>
                          <button className={`social-join-button ${group.isMember ? "is-joined" : ""}`} onClick={() => void handleApiGroupMembership(group.id, group.name)} type="button">
                            {group.isMember ? "✓ Rejoint" : "Rejoindre"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {activeTab === "evenements" ? (
            <section className="social-tab-section">
              {(selectedEventName || selectedApiEventId) ? (
                <>
                  <button className="social-back-button" onClick={() => { setSelectedEventName(null); setSelectedApiEventId(null); }} type="button">
                    ← Retour aux evenements
                  </button>
                  {selectedEventName ? (() => {
                    const event = EVENTS.find((e) => e.name === selectedEventName);
                    if (!event) return null;
                    const isInscrit = eventState[event.name];
                    return (
                      <div className="social-event-detail">
                        <div className="social-event-detail-date">
                          <strong>{event.day}</strong>
                          <span>{event.month}</span>
                        </div>
                        <div className="social-event-detail-body">
                          <h2>{event.name}</h2>
                          <p>{event.desc}</p>
                          <div className="social-event-detail-meta">
                            <span>🕐 {event.time}</span>
                            <span>👥 {event.attendees + (isInscrit ? 1 : 0)} participants</span>
                            <span>📍 En ligne — Lien envoye apres inscription</span>
                          </div>
                          <div className="social-event-detail-actions">
                            <button
                              className={`social-event-button ${isInscrit ? "is-joined" : ""}`}
                              onClick={() => toggleEvent(event.name)}
                              type="button"
                            >
                              {isInscrit ? "✓ Inscrit — Annuler" : "S'inscrire a cet evenement"}
                            </button>
                            <button
                              className="social-secondary-button"
                              onClick={() => openMessagesWith("piehub")}
                              type="button"
                            >
                              💬 Poser une question
                            </button>
                          </div>
                          {isInscrit ? (
                            <div className="social-event-confirm-note">
                              ✅ Inscription confirmee. Vous recevrez le lien de connexion dans votre espace ou par retour PieAgency avant l&apos;evenement.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })() : selectedApiEventId ? (() => {
                    const event = apiEvents.find((e) => String(e.id) === selectedApiEventId);
                    if (!event) return null;
                    return (
                      <div className="social-event-detail">
                        <div className="social-event-detail-date">
                          <strong>{event.eventDate.slice(8, 10) || "—"}</strong>
                          <span>{event.eventDate.slice(5, 7) || ""}</span>
                        </div>
                        <div className="social-event-detail-body">
                          <h2>{event.name}</h2>
                          <p>{event.description}</p>
                          <div className="social-event-detail-meta">
                            <span>🕐 {event.eventTime}</span>
                            <span>👥 {event.attendeeCount + (event.isAttending ? 0 : 0)} participants</span>
                            <span>📍 {event.locationType === "online" ? "En ligne" : event.locationDetail || "Presentiel"}</span>
                          </div>
                          <div className="social-event-detail-actions">
                            <button
                              className={`social-event-button ${event.isAttending ? "is-joined" : ""}`}
                              onClick={() => void handleApiEventAttendance(event.id, event.name)}
                              type="button"
                            >
                              {event.isAttending ? "✓ Inscrit — Annuler" : "S'inscrire a cet evenement"}
                            </button>
                            <button
                              className="social-secondary-button"
                              onClick={() => openMessagesWith("piehub")}
                              type="button"
                            >
                              💬 Poser une question
                            </button>
                          </div>
                          {event.isAttending ? (
                            <div className="social-event-confirm-note">
                              ✅ Inscription confirmee. Vous recevrez les informations de connexion avant l&apos;evenement.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })() : null}
                </>
              ) : (
                <>
                  <h2>Evenements</h2>
                  <p>Webinaires, sessions de preparation et rencontres a ne pas manquer.</p>
                  <div className="social-section-actions">
                    <button className="social-primary-pill" onClick={() => setCreateEventOpen(true)} type="button">
                      + Créer un événement
                    </button>
                  </div>
                  <div className="social-stack">
                    {([] as EventItem[]).map((event) => (
                      <div className="social-event-card" key={`static-${event.name}`}>
                        <div className="social-event-date">
                          <strong>{event.day}</strong>
                          <span>{event.month}</span>
                        </div>
                        <div className="social-event-copy">
                          <button className="social-group-name-button" onClick={() => setSelectedEventName(event.name)} type="button">
                            <strong>{event.name}</strong>
                          </button>
                          <small>{event.time} · {event.attendees} participants · {event.desc}</small>
                        </div>
                        <button
                          className={`social-event-button ${eventState[event.name] ? "is-joined" : ""}`}
                          onClick={() => toggleEvent(event.name)}
                          type="button"
                        >
                          {eventState[event.name] ? "✓ Inscrit" : "S'inscrire"}
                        </button>
                      </div>
                    ))}
                    {!apiEvents.length ? (
                      <div className="social-list-card social-empty-state">
                        <span className="social-list-copy">
                          <strong>Aucun événement programmé</strong>
                          <small>Les prochains événements réels apparaîtront ici.</small>
                        </span>
                      </div>
                    ) : null}
                    {apiEvents.map((event) => (
                      <div className="social-event-card" key={`api-${event.id}`}>
                        <div className="social-event-date">
                          <strong>{event.eventDate.slice(8, 10) || "—"}</strong>
                          <span>{event.eventDate.slice(5, 7) || ""}</span>
                        </div>
                        <div className="social-event-copy">
                          <button className="social-group-name-button" onClick={() => setSelectedApiEventId(String(event.id))} type="button">
                            <strong>{event.name}</strong>
                          </button>
                          <small>{event.eventTime} · {event.attendeeCount} participants · {event.description}</small>
                        </div>
                        <button
                          className={`social-event-button ${event.isAttending ? "is-joined" : ""}`}
                          onClick={() => void handleApiEventAttendance(event.id, event.name)}
                          type="button"
                        >
                          {event.isAttending ? "✓ Inscrit" : "S'inscrire"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {activeTab === "ressources" ? (
            <section className="social-tab-section">
              <h2>Ressources partagees</h2>
              <p>
                {normalizedSearchTerm
                  ? `Bibliotheque filtree pour "${searchTerm.trim()}".`
                  : "Documents, guides et modeles partages dans PieHUB."}
              </p>
              <div className="social-tab-bar">
                {(["tous", "PDF", "DOC"] as const).map((filter) => (
                  <button
                    className={`social-tab-button ${resourceFilter === filter ? "is-active" : ""}`}
                    key={filter}
                    onClick={() => setResourceFilter(filter)}
                    type="button"
                  >
                    {filter === "tous" ? "Tous" : filter}
                  </button>
                ))}
                <button
                  className="social-tab-button"
                  onClick={() => openCompose("doc")}
                  type="button"
                >
                  + Partager
                </button>
              </div>
              <div className="social-resource-grid">
                {filteredResources
                  .filter((resource) => resourceFilter === "tous" || resource.type === resourceFilter)
                  .sort((a, b) => b.downloads - a.downloads)
                  .map((resource) => (
                    <button
                      className="social-resource-card"
                      key={`${resource.source}-${resource.name}`}
                      onClick={() => downloadResource(resource)}
                      type="button"
                    >
                      <div className="social-resource-card-icon">{resource.icon}</div>
                      <div className="social-resource-card-name">{resource.name}</div>
                      <div className="social-resource-card-meta">
                        <span>{resource.type} · {resource.size}</span>
                        <span>⬇ {resource.downloads}</span>
                      </div>
                      <small>Par {resource.author}</small>
                    </button>
                  ))}
              </div>
              {filteredResources.filter((resource) => resourceFilter === "tous" || resource.type === resourceFilter).length === 0 ? (
                <div className="social-list-card social-empty-state">
                  <span className="social-list-copy">
                    <strong>Aucune ressource {resourceFilter} pour le moment.</strong>
                    <small>Partagez la premiere ressource de ce type.</small>
                  </span>
                  <button className="social-secondary-button" onClick={() => openCompose("doc")} type="button">
                    Partager un document
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "messages" ? (
            <section className="social-tab-section">
              <h2>Messages PieHUB</h2>
              <p>
                Discutez avec Guide PieHUB ou ouvrez une conversation avec un conseiller
                disponible.
              </p>
              <div className="social-stack">
                <div className="social-list-card">
                  <span className="social-avatar social-avatar-sm social-avatar-with-status" style={{ backgroundColor: findCommunityUser("piehub").color }}>
                    {findCommunityUser("piehub").avatar}
                  </span>
                  <span className="social-list-copy">
                    <strong>Guide PieHUB</strong>
                    <small>Assistant communautaire séparé des messages privés.</small>
                  </span>
                  <button className="social-message-button" onClick={() => openMessagesWith("piehub")} type="button">Ouvrir</button>
                </div>

                {directThreads.length ? (
                  <div className="social-message-section-title">Conversations récentes</div>
                ) : null}
                {directThreads.map((thread) => (
                  <div className={`social-list-card ${thread.unreadCount ? "is-unread" : ""}`} key={`direct-${thread.id}`}>
                    <span className="social-avatar social-avatar-sm social-avatar-with-status" style={{ backgroundColor: thread.targetProfile.color }}>
                      {thread.targetProfile.avatar}
                    </span>
                    <span className="social-list-copy">
                      <strong>{thread.targetProfile.name}</strong>
                      <small>{thread.lastMessage ? thread.lastMessage.text : "Conversation privée PieHUB"} · {thread.updatedAt}</small>
                    </span>
                    <button className="social-message-button" onClick={() => openMessagesWith(thread.targetProfile.id)} type="button">
                      {thread.unreadCount ? `${thread.unreadCount} nouveau` : "Ouvrir"}
                    </button>
                  </div>
                ))}

                <div className="social-message-section-title">Membres à contacter</div>
                {communityUsers
                  .filter((user) => user.id !== currentProfileId && user.id !== "piehub")
                  .slice(0, 8)
                  .map((user) => (
                    <div className="social-list-card" key={`thread-${user.id}`}>
                      <span className="social-avatar social-avatar-sm social-avatar-with-status" style={{ backgroundColor: user.color }}>
                        {user.avatar}
                      </span>
                      <span className="social-list-copy">
                        <strong>{user.name}</strong>
                        <small>{user.bio}</small>
                      </span>
                      <button className="social-message-button" onClick={() => openMessagesWith(user.id)} type="button">
                        Message
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}

          {activeTab === "publicite" ? (
            <section className="social-tab-section">
              <h2>Espace Publicités</h2>
              <p>Découvrez les offres de la communauté. Chaque publicité est validée par l&apos;équipe PieAgency.</p>
              <div className="social-section-actions">
                <button className="social-primary-pill" onClick={() => setCreateAdOpen(true)} type="button">
                  + Créer une publicité
                </button>
              </div>
              {ads.filter((ad) => ad.moderationStatus === "approved").length === 0 ? (
                <div className="social-list-card social-empty-state">
                  <span className="social-list-copy">
                    <strong>Aucune publicité approuvée pour le moment.</strong>
                    <small>Soumettez la première publicité — elle sera visible après validation.</small>
                  </span>
                </div>
              ) : (
                <div className="social-ads-grid">
                  {ads.filter((ad) => ad.moderationStatus === "approved").map((ad) => (
                    <div className="social-ad-card" key={ad.id}>
                      {ad.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img alt={ad.title} className="social-ad-image" decoding="async" loading="lazy" src={ad.imageUrl} />
                      ) : null}
                      <div className="social-ad-body">
                        <div className="social-ad-category">{ad.category}</div>
                        <h3 className="social-ad-title">{ad.title}</h3>
                        <p className="social-ad-desc">{ad.body}</p>
                        {ad.ctaUrl ? (
                          <a
                            className="social-ad-cta"
                            href={ad.ctaUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {ad.ctaLabel}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {ads.filter((ad) => ad.isOwn && ad.moderationStatus === "pending").length > 0 ? (
                <div className="social-pending-note">
                  ⏳ Vous avez {ads.filter((ad) => ad.isOwn && ad.moderationStatus === "pending").length} publicité(s) en attente de validation.
                </div>
              ) : null}
            </section>
          ) : null}
        </main>

        <aside className="social-sidebar-right">
          <div className="social-widget social-guide-widget">
            <div className="social-widget-title">
              <strong>🤖 Guide PieHUB</strong>
              <button onClick={() => openMessagesWith("piehub")} type="button">Discuter</button>
            </div>
            <div className="social-guide-widget-body">
              <span>IA communautaire</span>
              <p>Détecte les sujets, résume les fils, suggère des ressources et oriente vers PieAgency quand le cas devient personnel.</p>
              <button onClick={() => openQuestionComposer()} type="button">Poser une question guidée</button>
            </div>
          </div>

          <div className="social-widget social-return-widget">
            <div className="social-widget-title">
              <strong>🎯 Pourquoi revenir ?</strong>
            </div>
            <div className="social-return-list">
              <button onClick={() => setFeedFilter("open")} type="button"><strong>{openQuestionPosts.length}</strong><span>questions à aider</span></button>
              <button onClick={() => setNotifPanelOpen(true)} type="button"><strong>{unreadNotifCount}</strong><span>notifications</span></button>
              <button onClick={() => openMessagesWith("piehub")} type="button"><strong>{directThreads.length}</strong><span>conversations</span></button>
            </div>
          </div>

          <div className="social-widget">
            <div className="social-widget-title">
              <strong>🔥 Tendances</strong>
              <button onClick={() => switchTab("explorer")} type="button">Voir tout</button>
            </div>
            {dynamicTrends.map((trend, index) => (
              <button className="social-trending-item" key={trend.tag} onClick={() => openTrend(trend.tag)} type="button">
                <span>{index + 1}</span>
                <span>
                  <strong>{trend.tag}</strong>
                  <small>{trend.count}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="social-widget">
            <div className="social-widget-title">
              <strong>👤 Suggestions</strong>
              <button onClick={() => switchTab("explorer")} type="button">Voir plus</button>
            </div>
            {communityUsers.filter((user) => !followingSet.has(user.id) && user.id !== currentProfileId).slice(0, 3).map((user) => (
              <div className="social-suggest-item" key={user.id}>
                <button className="social-avatar-button" onClick={() => setProfileId(user.id)} type="button">
                  <span className="social-avatar social-avatar-sm" style={{ backgroundColor: user.color }}>
                    {user.avatar}
                  </span>
                </button>
                <div className="social-suggest-copy">
                  <strong>{user.name}</strong>
                  <small>{user.country}</small>
                </div>
                <button className={`social-follow-button ${followingSet.has(user.id) ? "is-following" : ""}`} onClick={() => toggleFollow(user.id)} type="button">
                  {followingSet.has(user.id) ? "Abonne" : "Suivre"}
                </button>
              </div>
            ))}
            {communityUsers.filter((user) => !followingSet.has(user.id) && user.id !== currentProfileId).length === 0 ? (
              <div className="social-widget-empty">Votre réseau est bien lancé. Publiez maintenant pour attirer des réponses.</div>
            ) : null}
          </div>

          <div className="social-widget">
            <div className="social-widget-title">
              <strong>🟢 En ligne maintenant</strong>
            </div>
            {["piehub", "ibrahim", "junior"].map((userId) => {
              const user = findCommunityUser(userId);
              return (
                <div className="social-suggest-item" key={user.id}>
                  <button className="social-avatar-button" onClick={() => setProfileId(user.id)} type="button">
                    <span className="social-avatar social-avatar-sm social-avatar-with-status" style={{ backgroundColor: user.color }}>
                      {user.avatar}
                    </span>
                  </button>
                  <div className="social-suggest-copy">
                    <strong>{user.name}</strong>
                    <small>{user.city}</small>
                  </div>
                  <button className="social-message-button" onClick={() => openMessagesWith(user.id)} type="button">Message</button>
                </div>
              );
            })}
          </div>

          <div className="social-widget">
            <div className="social-widget-title">
              <strong>🌍 Nos espaces</strong>
            </div>
            <Link className="social-space-link is-page" href="/contact">📝 Formulaire PieAgency</Link>
            <a className="social-space-link is-facebook" href={company.communityLinks[1].href} rel="noreferrer" target="_blank">👥 Groupe Facebook</a>
            <a className="social-space-link is-page" href={company.communityLinks[2].href} rel="noreferrer" target="_blank">📢 Page Facebook</a>
          </div>
        </aside>
      </div>

      {messageOpen ? (
        <div className="social-message-panel">
          <div className="social-message-header">
            <span className="social-avatar social-avatar-sm" style={{ backgroundColor: messageTarget.color }}>
              {messageTarget.avatar}
            </span>
            <div className="social-message-title">{messageTarget.name} — {messageTarget.country}</div>
            <div className="social-message-controls">
              {messageTargetId !== "piehub" ? <button aria-label={blockedProfileIds.includes(messageTargetId) ? "Débloquer ce membre" : "Bloquer ce membre"} onClick={async () => { try { const blocked = await toggleCommunityUserBlock(messageTargetId); setBlockedProfileIds((current) => blocked ? [...new Set([...current, messageTargetId])] : current.filter((id) => id !== messageTargetId)); pushToast(blocked ? "Membre bloqué." : "Membre débloqué."); } catch { pushToast("Impossible de modifier le blocage."); } }} type="button">{blockedProfileIds.includes(messageTargetId) ? "🔓" : "⊘"}</button> : null}
              <button onClick={() => setMessageOpen(false)} type="button">✕</button>
            </div>
          </div>
          <div className="social-message-body">
            {!messages.length && !isAssistantMessageLoading ? (
              <div className="social-message-empty">Aucun message pour le moment. Écrivez le premier message.</div>
            ) : null}
            {messages.map((message, index) => (
              <div className={`social-message-line is-${message.from}`} key={`${message.time}-${index}`}>
                <div className={`social-message-bubble is-${message.from}`}>{message.text}</div>
                <div className={`social-message-time is-${message.from}`}>{message.time}{message.from === "me" ? ` · ${message.readAt ? "Lu" : "Envoyé"}` : ""}</div>
              </div>
            ))}
            {isAssistantMessageLoading ? (
              <div className="social-message-line is-them">
                <div className="social-message-bubble is-them is-pending">{messageTargetId === "piehub" ? "Guide PieHUB prepare une reponse..." : "Envoi du message..."}</div>
                <div className="social-message-time is-them">A l&apos;instant</div>
              </div>
            ) : null}
          </div>
          <div className="social-message-input-row">
            <input className="social-message-input" disabled={isAssistantMessageLoading} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { void sendMessage(); } }} placeholder="Ecrire un message..." type="text" value={messageDraft} />
            <button className="social-send-button" disabled={isAssistantMessageLoading} onClick={() => void sendMessage()} type="button">➤</button>
          </div>
        </div>
      ) : null}

      {storyIndex !== null && activeLocalStories[storyIndex] ? (
        <div className="social-modal-overlay" onClick={() => setStoryIndex(null)} role="presentation">
          <div aria-modal="true" className="social-story-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-story-modal-head">
              <strong>{selectedStoryUser.name}</strong>
              <div>
                {activeLocalStories[storyIndex].viewerCanDelete ? (
                  <button onClick={() => void removeStory(activeLocalStories[storyIndex])} type="button">Supprimer</button>
                ) : null}
                <button aria-label="Fermer la story" onClick={() => setStoryIndex(null)} type="button">✕</button>
              </div>
            </div>
            <div className="social-story-modal-body">
              <span className="social-avatar social-avatar-xl" style={{ backgroundColor: selectedStoryUser.color }}>
                {selectedStoryUser.avatar}
              </span>
              <div className="social-story-country">{selectedStoryUser.country}</div>
              {activeLocalStories[storyIndex].mediaUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img alt="Média de la story" className="social-story-media" src={activeLocalStories[storyIndex].mediaUrl || ""} />
              ) : null}
              <div className="social-story-box">{activeLocalStories[storyIndex].content}</div>
            </div>
          </div>
        </div>
      ) : null}

      {profileId ? (
        <div className="social-modal-overlay" onClick={() => setProfileId(null)} role="presentation">
          <div aria-modal="true" className="social-profile-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-profile-cover" style={{ background: `linear-gradient(135deg, ${selectedProfile.color}, ${selectedProfile.color}88)` }}>
              <button className="social-profile-close" onClick={() => setProfileId(null)} type="button">✕</button>
              <span className="social-avatar social-avatar-hero" style={{ backgroundColor: selectedProfile.color }}>
                {selectedProfile.avatar}
              </span>
            </div>
            <div className="social-profile-modal-body">
              <div className="social-profile-modal-name">{profileId === currentProfileId ? "Mon profil" : selectedProfile.name}</div>
              <div className="social-profile-modal-handle">{findUser(profileId).tag} · {findUser(profileId).country}</div>
              <div className="social-profile-modal-badges">
                <span>{getProfileStageLabel(selectedProfile)}</span>
                <span>{getProfileActivityLabel(selectedProfile)}</span>
                <span>{getProfileLastActivityLabel(selectedProfile)}</span>
              </div>
              <div className="social-profile-trust-card">
                <div>
                  <span>Niveau de confiance</span>
                  <strong>{selectedProfileTrustLabel}</strong>
                </div>
                <b>{selectedProfileHelpScore}%</b>
              </div>
              <p className="social-profile-modal-bio">{selectedProfile.bio}</p>
              <div className="social-profile-tag-list">
                {selectedProfile.tags.map((tag) => (
                  <span className="social-profile-tag" key={`${profileId}-${tag}`}>{tag}</span>
                ))}
              </div>
              <div className="social-profile-modal-stats">
                <div><strong>{selectedProfile.posts}</strong><span>Posts</span></div>
                <div><strong>{selectedProfile.followers.toLocaleString()}</strong><span>Abonnes</span></div>
                <div><strong>{selectedProfile.following.toLocaleString()}</strong><span>Abonnements</span></div>
                <div><strong>{selectedProfileAnsweredCount}</strong><span>Aides</span></div>
              </div>
              <div className="social-profile-section-grid">
                <div className="social-profile-section-card">
                  <strong>Activité récente</strong>
                  {selectedProfileRecentPosts.length ? selectedProfileRecentPosts.map((post) => (
                    <button key={`profile-post-${post.id}`} onClick={() => { setProfileId(null); switchTab("feed"); focusCommentInput(post.id); }} type="button">
                      #{post.id} · {getPostPlainText(post).slice(0, 68)}{getPostPlainText(post).length > 68 ? "…" : ""}
                    </button>
                  )) : <small>Aucune publication récente.</small>}
                </div>
                <div className="social-profile-section-card">
                  <strong>Groupes liés</strong>
                  {selectedProfileGroups.length ? selectedProfileGroups.map((group) => (
                    <button key={`profile-group-${group.id}`} onClick={() => { setProfileId(null); switchTab("groupes"); void openGroupDetail(group); }} type="button">
                      {group.icon} {group.name}
                    </button>
                  )) : <small>Pas encore de groupe visible.</small>}
                </div>
              </div>
              {profileId !== currentProfileId ? (
                <div className="social-profile-modal-actions">
                  <button className="social-primary-pill" onClick={() => toggleFollow(profileId)} type="button">{followingSet.has(profileId) ? "✓ Abonne" : "Suivre"}</button>
                  <button className="social-secondary-pill" onClick={() => { setProfileId(null); openMessagesWith(profileId); }} type="button">💬 Message</button>
                  <button className="social-secondary-pill" onClick={() => { setProfileId(null); setExplorerTab("posts"); setSearchTerm(selectedProfile.name); switchTab("explorer"); }} type="button">Voir publications</button>
                </div>
              ) : (
                <div className="social-profile-modal-actions">
                  <button className="social-primary-pill social-full-width" onClick={() => openQuestionComposer()} type="button">+ Poser une question</button>
                  <button className="social-secondary-pill" onClick={() => { setProfileId(null); switchTab("groupes"); }} type="button">Rejoindre un groupe</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {composeOpen ? (
        <div className="social-modal-overlay" onClick={closeCompose} role="presentation">
          <div aria-modal="true" className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-compose-head">
              <strong>{composeMode === "story" ? "Publier un statut" : composeMode === "question" ? "Poser une question" : "Creer une publication"}</strong>
              <button onClick={closeCompose} type="button">✕</button>
            </div>
            <div className="social-compose-body">
              <div className="social-compose-author">
                <span className="social-avatar" style={{ backgroundColor: currentUser.color }}>{currentUser.avatar}</span>
                <div>
                  <strong>{currentUser.name}</strong>
                  <div className="social-compose-audience">🌍 Public</div>
                </div>
              </div>
              <div className="social-compose-mode-bar">
                {(["question", "text", "doc", "poll", "event", "story"] as ComposeMode[]).map((mode) => {
                  const labels: Record<ComposeMode, string> = { question: "Question", text: "Texte", doc: "Document", poll: "Sondage", event: "Evenement", story: "Statut" };
                  return (
                    <button
                      className={`social-compose-mode-tab ${composeMode === mode ? "is-active" : ""}`}
                      key={mode}
                      onClick={() => setComposeMode(mode)}
                      type="button"
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
              <div className="social-compose-tags">
                {Object.entries(TAG_META).map(([key, meta]) => (
                  <button
                    className={`social-compose-tag ${composeTag === key ? "is-active" : ""}`}
                    key={key}
                    onClick={() => setComposeTag(key as TagKey)}
                    type="button"
                  >
                    {meta.label}
                  </button>
                ))}
              </div>

              {composeMode === "doc" || composeMode === "story" || composeMode === "text" ? (
                <label className="social-file-picker">
                  <span>{composeMode === "doc" ? "Document réel *" : "Image facultative"}</span>
                  <input
                    accept={composeMode === "doc" ? ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "image/jpeg,image/png,image/webp"}
                    onChange={(event) => setComposeFile(event.target.files?.[0] || null)}
                    type="file"
                  />
                  <small>{composeFile ? `${composeFile.name} · ${(composeFile.size / 1024 / 1024).toFixed(2)} Mo` : "Maximum 10 Mo"}</small>
                </label>
              ) : null}

              {composeMode === "poll" ? (
                <div className="social-compose-poll-fields">
                  <input
                    className="social-compose-input"
                    onChange={(event) => setComposePollQuestion(event.target.value)}
                    placeholder="Votre question de sondage..."
                    type="text"
                    value={composePollQuestion}
                  />
                  <div className="social-compose-poll-options">
                    {composePollOptions.map((option, index) => (
                      <input
                        className="social-compose-input"
                        key={`poll-option-${index}`}
                        onChange={(event) => {
                          const next = [...composePollOptions];
                          next[index] = event.target.value;
                          setComposePollOptions(next);
                        }}
                        placeholder={`Option ${index + 1}...`}
                        type="text"
                        value={option}
                      />
                    ))}
                  </div>
                  <textarea className="social-compose-textarea" onChange={(event) => setComposeText(event.target.value)} placeholder="Contexte ou explication du sondage (optionnel)" value={composeText} />
                </div>
              ) : composeMode === "doc" ? (
                <div className="social-compose-doc-fields">
                  <input
                    className="social-compose-input"
                    onChange={(event) => setComposeResourceName(event.target.value)}
                    placeholder="Nom du document ou de la ressource..."
                    type="text"
                    value={composeResourceName}
                  />
                  <div className="social-compose-doc-meta">
                    <select
                      className="social-compose-select"
                      onChange={(event) => setComposeResourceType(event.target.value as "pdf" | "doc")}
                      value={composeResourceType}
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">DOC</option>
                    </select>
                    <input
                      className="social-compose-input"
                      onChange={(event) => setComposeResourceSize(event.target.value)}
                      placeholder="Taille (ex: 245 Ko)"
                      type="text"
                      value={composeResourceSize}
                    />
                  </div>
                  <textarea className="social-compose-textarea" onChange={(event) => setComposeText(event.target.value)} placeholder="Decrivez rapidement le contenu de ce document..." value={composeText} />
                  <button
                    className="social-ai-rewrite-btn"
                    disabled={isRewriting === "composeText"}
                    onClick={() => void handleAIRewrite("composeText", "publication")}
                    type="button"
                  >
                    {isRewriting === "composeText" ? "⏳ Reformulation..." : "✨ Reformuler avec l'IA"}
                  </button>
                </div>
              ) : (
                <>
                  <textarea className="social-compose-textarea" onChange={(event) => setComposeText(event.target.value)} placeholder={COMPOSE_HINTS[composeMode]} value={composeText} />
                  <button
                    className="social-ai-rewrite-btn"
                    disabled={isRewriting === "composeText"}
                    onClick={() => void handleAIRewrite("composeText", "publication")}
                    type="button"
                  >
                    {isRewriting === "composeText" ? "⏳ Reformulation..." : "✨ Reformuler avec l'IA"}
                  </button>
                </>
              )}
              {similarQuestionPosts.length > 0 ? (
                <div className="social-similar-questions-box">
                  <strong>Questions similaires déjà posées</strong>
                  <span>Vérifiez avant de republier la même demande.</span>
                  {similarQuestionPosts.map(({ post }) => (
                    <button key={`similar-${post.id}`} onClick={() => { closeCompose(); focusCommentInput(post.id); }} type="button">
                      Sujet #{post.id} · {post.questionStatus === "open" ? "encore ouvert" : "déjà répondu"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="social-compose-footer">
              <span>{composeText.trim().length} caracteres</span>
              <button className="social-primary-pill" disabled={isPublishing} onClick={publishPost} type="button">
                {isPublishing ? "Publication…" : "Publier"}
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {editTarget ? (
        <div className="social-modal-overlay" onClick={() => { setEditTarget(null); setEditDraft(""); }} role="presentation">
          <div aria-labelledby="community-edit-title" aria-modal="true" className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-compose-head">
              <strong id="community-edit-title">
                Modifier {editTarget.kind === "post" ? "la publication" : "le commentaire"}
              </strong>
              <button aria-label="Fermer l’éditeur" onClick={() => { setEditTarget(null); setEditDraft(""); }} type="button">✕</button>
            </div>
            <div className="social-compose-body">
              <textarea
                autoFocus
                className="social-compose-textarea"
                maxLength={editTarget.kind === "post" ? 4000 : 2000}
                onChange={(event) => setEditDraft(event.target.value)}
                value={editDraft}
              />
            </div>
            <div className="social-compose-footer">
              <span>{editDraft.trim().length} caractères</span>
              <button className="social-primary-pill" disabled={isSavingEdit || editDraft.trim().length < 2} onClick={() => void saveEdit()} type="button">
                {isSavingEdit ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {reportTarget ? (
        <div className="social-modal-overlay" onClick={closeReportModal} role="presentation">
          <div aria-modal="true" className="social-compose-modal social-report-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-compose-head">
              <strong>Signaler un contenu</strong>
              <button onClick={closeReportModal} type="button">✕</button>
            </div>
            <div className="social-compose-body">
              <div className="social-report-target">
                <span>Contenu concerné</span>
                <strong>{reportTarget.label}</strong>
              </div>
              <label className="social-field-label">Motif</label>
              <select className="social-compose-select" onChange={(event) => setReportReason(event.target.value)} value={reportReason}>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
              <label className="social-field-label">Détails utiles pour la modération</label>
              <textarea
                className="social-compose-textarea"
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Expliquez rapidement le problème. Ne partagez pas de données sensibles."
                value={reportDetails}
              />
              <div className="social-moderation-note">
                Les signalements sont transmis à la file de modération PieAgency. Le contenu peut être vérifié, archivé ou rejeté.
              </div>
            </div>
            <div className="social-compose-footer">
              <span>{reportDetails.trim().length} caractères</span>
              <button className="social-primary-pill" disabled={isReporting} onClick={() => void submitReport()} type="button">
                {isReporting ? "Transmission..." : "Envoyer le signalement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {createGroupOpen ? (
        <div className="social-modal-overlay" onClick={() => setCreateGroupOpen(false)} role="presentation">
          <div aria-modal="true" className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-compose-head">
              <strong>Créer un groupe</strong>
              <button onClick={() => setCreateGroupOpen(false)} type="button">✕</button>
            </div>
            <div className="social-compose-body">
              <div className="social-compose-doc-fields">
                <label className="social-field-label">Emoji / icône du groupe</label>
                <input
                  className="social-compose-input"
                  maxLength={4}
                  onChange={(e) => setGroupForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="👥"
                  type="text"
                  value={groupForm.icon}
                />
                <label className="social-field-label">Nom du groupe *</label>
                <input
                  className="social-compose-input"
                  onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Campus France — Mon pays"
                  type="text"
                  value={groupForm.name}
                />
                <label className="social-field-label">Description *</label>
                <textarea
                  className="social-compose-textarea"
                  onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez l'objectif de ce groupe..."
                  value={groupForm.description}
                />
                <label className="social-field-label">Catégorie</label>
                <select
                  className="social-compose-select"
                  onChange={(e) => setGroupForm((f) => ({ ...f, category: e.target.value }))}
                  value={groupForm.category}
                >
                  <option value="campus">Campus France</option>
                  <option value="visa">Visa Étudiant</option>
                  <option value="logement">Logement</option>
                  <option value="vie">Vie étudiante</option>
                  <option value="temoignage">Témoignages</option>
                  <option value="general">Général</option>
                </select>
                {groupFormError ? <div className="social-form-error">{groupFormError}</div> : null}
              </div>
            </div>
            <div className="social-compose-footer">
              <span />
              <button className="social-primary-pill" disabled={isCreatingGroup} onClick={() => void submitCreateGroup()} type="button">
                {isCreatingGroup ? "Création..." : "Créer le groupe"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {createEventOpen ? (
        <div className="social-modal-overlay" onClick={() => setCreateEventOpen(false)} role="presentation">
          <div aria-modal="true" className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-compose-head">
              <strong>Créer un événement</strong>
              <button onClick={() => setCreateEventOpen(false)} type="button">✕</button>
            </div>
            <div className="social-compose-body">
              <div className="social-compose-doc-fields">
                <label className="social-field-label">Nom de l&apos;événement *</label>
                <input
                  className="social-compose-input"
                  onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Webinaire : Réussir son entretien Campus France"
                  type="text"
                  value={eventForm.name}
                />
                <label className="social-field-label">Description *</label>
                <textarea
                  className="social-compose-textarea"
                  onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez le programme, l'objectif, les intervenants..."
                  value={eventForm.description}
                />
                <div className="social-compose-doc-meta">
                  <div style={{ flex: 1 }}>
                    <label className="social-field-label">Date *</label>
                    <input
                      className="social-compose-input"
                      onChange={(e) => setEventForm((f) => ({ ...f, event_date: e.target.value }))}
                      type="date"
                      value={eventForm.event_date}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="social-field-label">Heure</label>
                    <input
                      className="social-compose-input"
                      onChange={(e) => setEventForm((f) => ({ ...f, event_time: e.target.value }))}
                      placeholder="18h00 GMT+1"
                      type="text"
                      value={eventForm.event_time}
                    />
                  </div>
                </div>
                <label className="social-field-label">Type</label>
                <select
                  className="social-compose-select"
                  onChange={(e) => setEventForm((f) => ({ ...f, location_type: e.target.value }))}
                  value={eventForm.location_type}
                >
                  <option value="online">En ligne</option>
                  <option value="physical">Présentiel</option>
                </select>
                {eventForm.location_type === "physical" ? (
                  <>
                    <label className="social-field-label">Lieu</label>
                    <input
                      className="social-compose-input"
                      onChange={(e) => setEventForm((f) => ({ ...f, location_detail: e.target.value }))}
                      placeholder="Adresse ou ville..."
                      type="text"
                      value={eventForm.location_detail}
                    />
                  </>
                ) : null}
                {eventFormError ? <div className="social-form-error">{eventFormError}</div> : null}
              </div>
            </div>
            <div className="social-compose-footer">
              <span />
              <button className="social-primary-pill" disabled={isCreatingEvent} onClick={() => void submitCreateEvent()} type="button">
                {isCreatingEvent ? "Création..." : "Créer l'événement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notifPanelOpen ? (
        <div className="social-notif-panel">
          <div className="social-notif-panel-head">
            <div>
              <strong>Notifications utiles</strong>
              <span>{unreadNotifCount} non lue{unreadNotifCount > 1 ? "s" : ""}</span>
            </div>
            <div className="social-notif-actions">
              {unreadNotifCount > 0 ? <button onClick={() => void handleMarkAllNotificationsRead()} type="button">Tout lu</button> : null}
              <button onClick={() => setNotifPanelOpen(false)} type="button">✕</button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="social-notif-empty">Aucune notification pour le moment. Les likes, réponses, abonnements, messages et groupes apparaîtront ici.</div>
          ) : (
            notifications.map((notif) => (
              <div
                className={`social-notif-item ${notif.isRead ? "is-read" : ""} is-${notif.type.replace(/_/g, "-")}`}
                key={notif.id}
                onClick={() => void handleMarkNotifRead(notif.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") void handleMarkNotifRead(notif.id); }}
              >
                <span className="social-notif-icon">{getNotificationIcon(notif.type)}</span>
                <div>
                  <div className="social-notif-title">{notif.title}</div>
                  <div className="social-notif-body">{notif.body}</div>
                  <div className="social-notif-time">{notif.createdAt}</div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {createAdOpen ? (
        <div className="social-modal-overlay" onClick={() => { setCreateAdOpen(false); setAdStep(0); }} role="presentation">
          <div aria-modal="true" className="social-compose-modal social-ad-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="social-compose-head">
              <strong>Créer une publicité — Étape {adStep + 1} / 3</strong>
              <button onClick={() => { setCreateAdOpen(false); setAdStep(0); }} type="button">✕</button>
            </div>

            <div className="social-ad-steps">
              {[0, 1, 2].map((step) => (
                <div className={`social-ad-step-dot ${step <= adStep ? "is-done" : ""}`} key={step} />
              ))}
            </div>

            <div className="social-compose-body">
              {adStep === 0 ? (
                <div className="social-compose-doc-fields">
                  <p className="social-ad-step-hint">Commencez par l&apos;essentiel : le titre et la catégorie de votre annonce.</p>
                  <label className="social-field-label">Titre de la publicité *</label>
                  <input
                    className="social-compose-input"
                    onChange={(e) => setAdForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Votre service, offre ou annonce en une phrase..."
                    type="text"
                    value={adForm.title}
                  />
                  <label className="social-field-label">Catégorie</label>
                  <select
                    className="social-compose-select"
                    onChange={(e) => setAdForm((f) => ({ ...f, category: e.target.value }))}
                    value={adForm.category}
                  >
                    <option value="general">Général</option>
                    <option value="service">Service</option>
                    <option value="logement">Logement</option>
                    <option value="emploi">Emploi / Stage</option>
                    <option value="formation">Formation</option>
                    <option value="produit">Produit</option>
                  </select>
                </div>
              ) : adStep === 1 ? (
                <div className="social-compose-doc-fields">
                  <p className="social-ad-step-hint">Décrivez votre offre. Vous pouvez demander à l&apos;IA de reformuler votre texte.</p>
                  <label className="social-field-label">Description *</label>
                  <textarea
                    className="social-compose-textarea"
                    onChange={(e) => setAdForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Décrivez votre offre, vos avantages, votre contact..."
                    value={adForm.body}
                  />
                  <button
                    className="social-ai-rewrite-btn"
                    disabled={isRewriting === "adBody"}
                    onClick={() => void handleAIRewrite("adBody", "publicite")}
                    type="button"
                  >
                    {isRewriting === "adBody" ? "⏳ Reformulation..." : "✨ Reformuler avec l'IA"}
                  </button>
                  <label className="social-field-label">Image (URL facultative)</label>
                  <input
                    className="social-compose-input"
                    onChange={(e) => setAdForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://... (lien vers une image)"
                    type="url"
                    value={adForm.image_url}
                  />
                </div>
              ) : (
                <div className="social-compose-doc-fields">
                  <p className="social-ad-step-hint">Ajoutez un lien et un bouton d&apos;appel à l&apos;action pour diriger les lecteurs.</p>
                  <label className="social-field-label">Texte du bouton</label>
                  <input
                    className="social-compose-input"
                    onChange={(e) => setAdForm((f) => ({ ...f, cta_label: e.target.value }))}
                    placeholder="En savoir plus, Contacter, Commander..."
                    type="text"
                    value={adForm.cta_label}
                  />
                  <label className="social-field-label">Lien du bouton</label>
                  <input
                    className="social-compose-input"
                    onChange={(e) => setAdForm((f) => ({ ...f, cta_url: e.target.value }))}
                    placeholder="https://votre-site.com ou https://docs..."
                    type="url"
                    value={adForm.cta_url}
                  />
                  <div className="social-ad-preview">
                    <div className="social-ad-preview-label">Aperçu :</div>
                    {adForm.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img alt="Aperçu de la publicité" className="social-ad-image" decoding="async" src={adForm.image_url} />
                    ) : null}
                    <div className="social-ad-category">{adForm.category}</div>
                    <div className="social-ad-title">{adForm.title || "Titre de la publicité"}</div>
                    <div className="social-ad-desc">{adForm.body || "Description..."}</div>
                    {adForm.cta_label ? <div className="social-ad-cta-preview">{adForm.cta_label}</div> : null}
                  </div>
                  {adFormError ? <div className="social-form-error">{adFormError}</div> : null}
                </div>
              )}
            </div>

            <div className="social-compose-footer">
              {adStep > 0 ? (
                <button className="btn btn-outline" onClick={() => setAdStep((s) => s - 1)} type="button">
                  Retour
                </button>
              ) : <span />}
              {adStep < 2 ? (
                <button
                  className="social-primary-pill"
                  onClick={() => {
                    if (adStep === 0 && adForm.title.trim().length < 4) {
                      setAdFormError("Ajoutez un titre d'au moins 4 caractères.");
                      return;
                    }
                    if (adStep === 1 && adForm.body.trim().length < 8) {
                      setAdFormError("La description est trop courte.");
                      return;
                    }
                    setAdFormError("");
                    setAdStep((s) => s + 1);
                  }}
                  type="button"
                >
                  Continuer →
                </button>
              ) : (
                <button className="social-primary-pill" disabled={isCreatingAd} onClick={() => void submitCreateAd()} type="button">
                  {isCreatingAd ? "Envoi..." : "Soumettre la publicité"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <CommunityToastRegion toasts={toasts} />
    </div>
  );
}
