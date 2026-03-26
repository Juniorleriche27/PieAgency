"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { company } from "@/content/site";
import { onAuthSessionChange } from "@/lib/auth";
import {
  createCommunityComment,
  createCommunityPost,
  fetchCommunityAssistantThread,
  fetchCommunityBootstrap,
  fetchCommunityEventsCalendar,
  fetchCommunityGroups,
  fetchCommunityNotifications,
  markCommunityNotificationRead,
  createCommunityGroup,
  createCommunityEvent,
  toggleCommunityGroupMembership,
  toggleCommunityEventAttendance,
  sendCommunityAssistantMessage,
  toggleCommunityReaction,
  voteCommunityPoll,
  fetchCommunityAds,
  createCommunityAd,
  rewriteWithAI,
  fetchGroupPosts,
  type CommunityGroupItem as ApiGroupItem,
  type CommunityEventCalendarItem as ApiEventItem,
  type CommunityNotificationItem,
  type CommunityAdItem,
} from "@/lib/community";

type MainTab =
  | "feed"
  | "explorer"
  | "groupes"
  | "evenements"
  | "ressources"
  | "messages"
  | "publicite";
type ExplorerTab = "posts" | "membres" | "hashtags";
type ComposeMode = "text" | "doc" | "poll" | "event" | "story";
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
};

type SocialComment = {
  userId: string;
  text: string;
  time: string;
  likes: number;
  isPending?: boolean;
};

type PostBase = {
  id: number;
  userId: string;
  tag: TagKey;
  time: string;
  likes: number;
  comments: SocialComment[];
  shares: number;
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
};

type PollPost = PostBase & {
  type: "poll";
  question: string;
  options: { text: string; votes: number }[];
};

type SocialPost = TextPost | ResourcePost | PollPost;

type StoryItem = {
  userId: string;
  content: string;
  add?: boolean;
  createdAt?: number; // timestamp ms — stories expirent apres 24H
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
};

type ToastItem = {
  id: number;
  text: string;
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

const INITIAL_POSTS: SocialPost[] = [
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

const EXTRA_POSTS: SocialPost[] = [
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
const STORIES: StoryItem[] = [
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

const RESOURCES: ResourceItem[] = [
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

const COMPOSE_HINTS: Record<ComposeMode, string> = {
  text: "Partagez votre experience, posez une question ou donnez un conseil...",
  doc: "Presentez rapidement la ressource ou le guide que vous partagez...",
  poll: "Posez votre question de sondage et expliquez le contexte...",
  event: "Annoncez votre evenement, son objectif et les informations utiles...",
  story: "Partagez votre story avec la communaute...",
};

const FOLLOWING_STORAGE_KEY = "piehub-following";
const GROUP_STORAGE_KEY = "piehub-groups";
const EVENT_STORAGE_KEY = "piehub-events";

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

function readStoredArray(key: string, fallback: string[]) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStoredBooleanMap(key: string, fallback: Record<string, boolean>) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

function findUser(userId: string) {
  return USERS.find((user) => user.id === userId) ?? USERS[0];
}

function findUserInList(users: UserProfile[], userId: string) {
  return users.find((user) => user.id === userId) ?? findUser(userId);
}

function copyPosts(posts: SocialPost[]) {
  return posts.map((post) => {
    if (post.type === "poll") {
      return {
        ...post,
        comments: post.comments.map((comment) => ({ ...comment })),
        options: post.options.map((option) => ({ ...option })),
      };
    }
    return {
      ...post,
      comments: post.comments.map((comment) => ({ ...comment })),
    };
  });
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

function currentClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>(USERS);
  const [currentProfileId, setCurrentProfileId] = useState("moi");
  const [posts, setPosts] = useState<SocialPost[]>(() => copyPosts(INITIAL_POSTS));
  const [feedFromApi, setFeedFromApi] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>(() =>
    readStoredArray(FOLLOWING_STORAGE_KEY, ["piehub", "ibrahim", "junior"]),
  );
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({});
  const [localStories, setLocalStories] = useState<StoryItem[]>(() => {
    // Charger les statuts depuis localStorage et filtrer ceux > 24H
    try {
      const stored = localStorage.getItem("piehub-stories");
      if (!stored) return [];
      const parsed: StoryItem[] = JSON.parse(stored);
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return parsed.filter((s) => (s.createdAt ?? 0) > cutoff);
    } catch {
      return [];
    }
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [groupState, setGroupState] = useState<Record<string, boolean>>(() =>
    readStoredBooleanMap(
      GROUP_STORAGE_KEY,
      Object.fromEntries(GROUPS.map((group) => [group.name, group.joined])),
    ),
  );
  const [eventState, setEventState] = useState<Record<string, boolean>>(() =>
    readStoredBooleanMap(
      EVENT_STORAGE_KEY,
      Object.fromEntries(EVENTS.map((event) => [event.name, event.joined])),
    ),
  );
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTargetId, setMessageTargetId] = useState("piehub");
  const [messages, setMessages] = useState<MessageItem[]>(() => createConversationStarter("piehub"));
  const [communityConversationId, setCommunityConversationId] = useState<string | null>(null);
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
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [selectedApiGroupId, setSelectedApiGroupId] = useState<string | null>(null);
  const [groupDetailPosts, setGroupDetailPosts] = useState<SocialPost[]>([]);
  const [isLoadingGroupPosts, setIsLoadingGroupPosts] = useState(false);
  const [composeGroupId, setComposeGroupId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [selectedApiEventId, setSelectedApiEventId] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<"tous" | "PDF" | "DOC">("tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadedExtraCount, setLoadedExtraCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
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

  const currentUser = findUserInList(communityUsers, currentProfileId);
  const messageTarget = findUserInList(communityUsers, messageTargetId);
  const likedSet = new Set(likedPostIds);
  const savedSet = new Set(savedPostIds);
  const followingSet = new Set(followingIds);
  const joinedGroupCount = Object.values(groupState).filter(Boolean).length;
  const joinedEventCount = Object.values(eventState).filter(Boolean).length;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  function findCommunityUser(userId: string) {
    return findUserInList(communityUsers, userId);
  }

  const resourceLibrary = [
    ...RESOURCES.map((resource) => ({
      ...resource,
      source: "catalog" as const,
      tag: inferTagFromText(resource.name, resource.type === "DOC" ? "campus" : "visa"),
      description: `${resource.name} ${resource.author} ${resource.type} ${resource.size}`,
    })),
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
      })),
  ];

  const explorerPosts = [...posts].reverse();
  const filteredPosts = normalizedSearchTerm
    ? explorerPosts.filter((post) => {
        const author = findCommunityUser(post.userId);
        const rawText =
          post.type === "poll"
            ? `${post.question} ${"content" in post ? post.content : ""}`
            : post.content;
        const tagMeta = TAG_META[inferTagFromText(
          rawText,
          post.tag,
        )];
        const searchableText =
          post.type === "poll"
            ? rawText
            : post.type === "resource"
              ? `${post.resourceName} ${post.content}`
              : post.content;
        return `${author.name} ${author.country} ${tagMeta.label} ${searchableText}`
          .toLowerCase()
          .includes(normalizedSearchTerm);
      })
    : explorerPosts.slice(0, 3);

  const filteredUsers = normalizedSearchTerm
    ? communityUsers.filter((user) =>
        `${user.name} ${user.country} ${user.city} ${user.bio} ${user.tags.join(" ")}`
          .toLowerCase()
          .includes(normalizedSearchTerm),
      )
    : communityUsers.filter((user) => user.id !== currentProfileId);

  const filteredResources = normalizedSearchTerm
    ? resourceLibrary.filter((resource) =>
        `${resource.name} ${resource.author} ${resource.description}`
          .toLowerCase()
          .includes(normalizedSearchTerm),
      )
    : resourceLibrary;

  async function hydrateCommunityFeed() {
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
      setCommunityUsers(payload.users.length ? payload.users : USERS);
      setPosts(payload.posts.length ? payload.posts : copyPosts(INITIAL_POSTS));
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
      setCurrentProfileId(payload.currentProfileId ?? "moi");
      setFeedFromApi(payload.posts.length > 0);
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
        fetchCommunityNotifications().then((data) => {
          setNotifications(data.notifications);
          setUnreadNotifCount(data.unreadCount);
        }).catch(() => {});
      }
    } catch {
      setCommunityUsers(USERS);
      setPosts(copyPosts(INITIAL_POSTS));
      setLikedPostIds([]);
      setSavedPostIds([]);
      setPollVotes({});
      setCurrentProfileId("moi");
      setFeedFromApi(false);
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

  useEffect(() => {
    void hydrateCommunityFeed();
    const unsubscribe = onAuthSessionChange(() => {
      void hydrateCommunityFeed();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(followingIds));
  }, [followingIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groupState));
  }, [groupState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(eventState));
  }, [eventState]);

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
    try {
      const result = await toggleCommunityGroupMembership(groupId);
      setApiGroups((current) =>
        current.map((g) => (g.id === groupId ? result.group : g)),
      );
      pushToast(result.isMember ? `✅ Rejoint : ${groupName}` : `Groupe quitté : ${groupName}`);
    } catch {
      pushToast("Connectez-vous pour rejoindre un groupe.");
    }
  }

  async function openGroupDetail(group: ApiGroupItem) {
    setSelectedApiGroupId(String(group.id));
    setSelectedGroupName(null);
    setIsLoadingGroupPosts(true);
    try {
      const gposts = await fetchGroupPosts(String(group.id));
      setGroupDetailPosts(gposts);
    } catch {
      setGroupDetailPosts([]);
    } finally {
      setIsLoadingGroupPosts(false);
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
      pushToast("Connectez-vous pour vous inscrire à un événement.");
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
  }) {
    const content = [
      `PieHUB - ${resource.name}`,
      "",
      `Auteur: ${resource.author}`,
      `Format: ${resource.type}`,
      `Taille: ${resource.size}`,
      "",
      resource.description,
      "",
      "Pour obtenir la version complete ou un accompagnement, utilisez le formulaire PieAgency ou le chat du site.",
      "Formulaire: https://pieagency.fr/contact",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${resource.name.replace(/[^\w.-]+/g, "_")}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    pushToast(`Ressource telechargee : ${resource.name}`);
  }

  function openCompose(mode: ComposeMode) {
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
    setComposeGroupId(null);
  }

  function resolveComposeTag(rawText: string) {
    if (composeMode === "doc") {
      return "visa";
    }

    if (composeMode === "poll") {
      return "vie";
    }

    return inferTagFromText(rawText, composeTag);
  }

  async function publishPost() {
    const trimmedText = composeText.trim();

    // Mode story/statut — gere separement, pas de publication API
    if (composeMode === "story") {
      if (trimmedText.length < 4) {
        pushToast("Ecrivez quelque chose pour votre statut.");
        return;
      }
      const newStory: StoryItem = {
        userId: currentProfileId,
        content: trimmedText,
        createdAt: Date.now(),
      };
      setLocalStories((prev) => {
        const updated = [newStory, ...prev.filter((s) => s.userId !== currentProfileId)];
        try { localStorage.setItem("piehub-stories", JSON.stringify(updated)); } catch { /* noop */ }
        return updated;
      });
      closeCompose();
      pushToast("Statut publie. Il disparaitra apres 24h.");
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
    } else if (trimmedText.length < 12) {
      pushToast("Ajoutez un peu plus de contexte avant de publier.");
      return;
    }
    try {
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
            ? composeResourceName.trim() || "Ressource PieHUB"
            : undefined,
        resourceType: composeMode === "doc" ? composeResourceType : undefined,
        resourceSize:
          composeMode === "doc"
            ? composeResourceSize.trim() || "Document"
            : undefined,
        question: composeMode === "poll" ? inferredQuestion : undefined,
        options: composeMode === "poll" ? normalizedOptions : undefined,
        groupId: composeGroupId,
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
        pushToast("Publication partagee avec la communaute.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast("Connectez-vous pour publier dans PieHUB.");
        return;
      }
      pushToast("Publication impossible pour le moment.");
    }
  }
  async function toggleLike(postId: number) {
    try {
      const mutation = await toggleCommunityReaction(postId, "like");
      setPosts((current) =>
        current.map((post) => (post.id === postId ? mutation.post : post)),
      );
      syncPostViewState(mutation.post);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        pushToast("Connectez-vous pour aimer une publication.");
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
        pushToast("Connectez-vous pour sauvegarder une publication.");
        return;
      }
      pushToast("Impossible de mettre a jour cette sauvegarde.");
    }
  }
  async function sharePost(postId: number) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/communaute#post-${postId}`);
    } catch {}

    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, shares: post.shares + 1 } : post)),
    );
    pushToast("🔗 Lien copie dans le presse-papier.");
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
        pushToast("Connectez-vous pour voter a ce sondage.");
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
        pushToast("Connectez-vous pour commenter dans PieHUB.");
      } else {
        pushToast("Commentaire impossible pour le moment.");
      }
    } finally {
      setAiReplyingPostIds((current) => current.filter((id) => id !== postId));
    }
  }
  function toggleFollow(userId: string) {
    const user = findCommunityUser(userId);
    const isFollowing = followingSet.has(userId);
    setFollowingIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
    setCommunityUsers((current) =>
      current.map((entry) => {
        if (entry.id === userId) {
          return {
            ...entry,
            followers: Math.max(0, entry.followers + (isFollowing ? -1 : 1)),
          };
        }

        if (entry.id === currentProfileId) {
          return {
            ...entry,
            following: Math.max(0, entry.following + (isFollowing ? -1 : 1)),
          };
        }

        return entry;
      }),
    );
    pushToast(
      isFollowing
        ? `Abonnement annule pour ${user.name}.`
        : `✅ Vous suivez maintenant ${user.name}.`,
    );
  }

  function toggleGroup(name: string) {
    const nextState = !groupState[name];
    setGroupState((current) => ({ ...current, [name]: nextState }));
    pushToast(nextState ? `✅ Groupe rejoint : ${name}` : `Groupe quitte : ${name}`);
  }

  function toggleEvent(name: string) {
    const nextState = !eventState[name];
    setEventState((current) => ({ ...current, [name]: nextState }));
    pushToast(nextState ? `✅ Inscrit a : ${name}` : `Inscription annulee : ${name}`);
  }

  function openTrend(tag: string) {
    setHashtagFilter(tag);
    setExplorerTab("hashtags");
    switchTab("explorer");
  }

  function openMessagesWith(userId: string) {
    setActiveTab("messages");
    setMessageTargetId(userId);
    setMessages(createConversationStarter(userId, communityUsers));
    setCommunityConversationId(null);
    setIsAssistantMessageLoading(false);
    setMessageOpen(true);
    focusMainContent();
    if (userId === "piehub") {
      void loadPiehubThread();
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
        pushToast("Connectez-vous pour discuter avec Guide PieHUB.");
      } finally {
        setIsAssistantMessageLoading(false);
      }
      return;
    }

    setMessages((current) => [...current, { from: "me", text, time: currentClock() }]);
    setMessageDraft("");

    window.setTimeout(() => {
      const replies = [
        "Je comprends. Je vous reponds bientot.",
        "Tres bien note.",
        "Merci pour votre message 🙏",
        "Bonne question, je verifie et je reviens vers vous.",
      ];

      setMessages((current) => [
        ...current,
        {
          from: "them",
          text: replies[Math.floor(Math.random() * replies.length)],
          time: currentClock(),
        },
      ]);
    }, 1200);
  }

  function loadMore() {
    if (feedFromApi) {
      pushToast("Le fil PieHUB est deja synchronise avec la base de donnees.");
      return;
    }

    if (loadedExtraCount >= EXTRA_POSTS.length) {
      pushToast("Vous avez deja charge toutes les publications du prototype.");
      return;
    }

    setPosts((current) => [...current, EXTRA_POSTS[loadedExtraCount]]);
    setLoadedExtraCount((current) => current + 1);
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
            </button>
            <div className="social-post-meta">
              <span>{author.country}</span>
              <span className="social-dot" />
              <span>{post.time}</span>
              <span className="social-dot" />
              <span className={`social-post-tag ${tagMeta.className}`}>{tagMeta.label}</span>
            </div>
          </div>

          <button className="social-icon-button" onClick={() => pushToast("Menu publication")} type="button">
            ⋯
          </button>
        </div>

        <div className="social-post-body">
          {post.type === "poll" ? null : <p>{renderRichText(post.content)}</p>}

          {post.type === "resource" ? (
            <button
              className="social-resource-box"
              onClick={() => pushToast(`Telechargement de ${post.resourceName}...`)}
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
            💬 Commenter
          </button>
          <button className="social-post-action is-share" onClick={() => sharePost(post.id)} type="button">
            ↗ Partager
          </button>
          <button className={`social-post-action ${isSaved ? "is-saved" : ""}`} onClick={() => toggleSave(post.id)} type="button">
            🔖 Sauvegarder
          </button>
        </div>

        <div className="social-comments">
          {post.comments.map((comment, index) => {
            const user = findCommunityUser(comment.userId);
            return (
              <div className={`social-comment ${comment.isPending ? "is-pending" : ""}`} key={`${post.id}-${user.id}-${index}`}>
                <button className="social-avatar-button" onClick={() => setProfileId(user.id)} type="button">
                  <span className="social-avatar social-avatar-sm" style={{ backgroundColor: user.color }}>
                    {user.avatar}
                  </span>
                </button>
                <div className="social-comment-body">
                  <div className="social-comment-head">
                    <strong>{user.name}</strong>
                    <span>{comment.time}</span>
                  </div>
                  <div className={`social-comment-text ${comment.isPending ? "is-pending" : ""}`}>
                    {renderRichText(comment.text)}
                  </div>
                  <div className="social-comment-actions">
                    <button type="button">❤️ {comment.likes}</button>
                    <button type="button">Repondre</button>
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
                <div className="social-comment-text is-pending">Guide PieHUB prepare une reponse...</div>
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
              placeholder="Ajouter un commentaire..."
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
  const hashtagPosts = hashtagFilter
    ? posts.filter((post) => {
        const tagMeta = TAG_META[post.tag];
        const content =
          post.type === "poll"
            ? `${post.question} ${"content" in post ? post.content : ""}`
            : post.content;
        return `${tagMeta.label} ${content}`.toLowerCase().includes(
          hashtagFilter.replace("#", "").toLowerCase(),
        );
      })
    : posts;

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
          <button className="social-icon-button" onClick={() => openMessagesWith("piehub")} type="button">
            💬
          </button>
          <button className="social-icon-button social-notif-button" onClick={() => setNotifPanelOpen(!notifPanelOpen)} type="button">
            🔔
            {unreadNotifCount > 0 ? (
              <span className="social-notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
            ) : null}
          </button>
          <button className="social-profile-trigger" onClick={() => setProfileId(currentProfileId)} type="button">
            {currentUser.avatar}
          </button>
        </div>
      </div>

      <div className="social-mobile-tabs-wrapper">
        <div className="social-mobile-tabs">
          <button className={`social-mobile-tab ${activeTab === "feed" ? "is-active" : ""}`} onClick={() => switchTab("feed")} type="button">Fil</button>
          <button className={`social-mobile-tab ${activeTab === "groupes" ? "is-active" : ""}`} onClick={() => switchTab("groupes")} type="button">👥 Groupes</button>
          <button className={`social-mobile-tab ${activeTab === "evenements" ? "is-active" : ""}`} onClick={() => switchTab("evenements")} type="button">🗓 Evenements</button>
          <button className={`social-mobile-tab ${activeTab === "ressources" ? "is-active" : ""}`} onClick={() => switchTab("ressources")} type="button">📚 Ressources</button>
          <button className={`social-mobile-tab ${activeTab === "publicite" ? "is-active" : ""}`} onClick={() => switchTab("publicite")} type="button">📢 Pub</button>
          <button className={`social-mobile-tab ${activeTab === "explorer" ? "is-active" : ""}`} onClick={() => switchTab("explorer")} type="button">⌕ Explorer</button>
          <button className={`social-mobile-tab ${activeTab === "messages" ? "is-active" : ""}`} onClick={() => openMessagesWith("piehub")} type="button">💬 Messages</button>
        </div>
      </div>

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

              <div className="social-create-card">
                <div className="social-create-top">
                  <span className="social-avatar" style={{ backgroundColor: currentUser.color }}>
                    {currentUser.avatar}
                  </span>
                  <button className="social-create-input" onClick={() => openCompose("text")} type="button">
                    Quoi de nouveau ? Partagez votre experience...
                  </button>
                </div>
                <div className="social-create-actions">
                  <button className="social-create-action is-doc" onClick={() => openCompose("doc")} type="button">Document</button>
                  <button className="social-create-action is-poll" onClick={() => openCompose("poll")} type="button">Sondage</button>
                  <button className="social-create-action is-event" onClick={() => openCompose("event")} type="button">Evenement</button>
                  <button className="social-create-action is-photo" onClick={() => openCompose("story")} type="button">Story</button>
                </div>
              </div>

              {posts.map((post) => renderPost(post))}

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
                  {TRENDING.map((trend) => (
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
                    return (
                      <>
                        <div className="social-group-detail-header">
                          <span className="social-group-detail-icon">{group.icon}</span>
                          <div className="social-group-detail-info">
                            <h2>{group.name}</h2>
                            <p>{group.description}</p>
                            <small>{group.memberCount.toLocaleString()} membres</small>
                          </div>
                          <button
                            className={`social-join-button ${group.isMember ? "is-joined" : ""}`}
                            onClick={() => void handleApiGroupMembership(group.id, group.name)}
                            type="button"
                          >
                            {group.isMember ? "✓ Rejoint" : "Rejoindre"}
                          </button>
                        </div>
                        <div className="social-group-post-count">
                          {isLoadingGroupPosts ? "Chargement..." : `${groupDetailPosts.length} publication${groupDetailPosts.length !== 1 ? "s" : ""} dans ce groupe`}
                        </div>
                        <div className="social-section-actions">
                          <button
                            className="social-primary-pill"
                            onClick={() => {
                              setComposeGroupId(selectedApiGroupId);
                              openCompose("text");
                            }}
                            type="button"
                          >
                            + Publier dans ce groupe
                          </button>
                        </div>
                        {isLoadingGroupPosts ? null : groupDetailPosts.length > 0 ? (
                          groupDetailPosts.map((post) => renderPost(post))
                        ) : (
                          <div className="social-list-card social-empty-state">
                            <span className="social-list-copy">
                              <strong>Aucune publication pour le moment.</strong>
                              <small>Soyez le premier a partager dans ce groupe.</small>
                            </span>
                          </div>
                        )}
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
                    {GROUPS.map((group) => (
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
                    {apiGroups.map((group) => (
                      <div className="social-list-card" key={`api-${group.id}`}>
                        <span className="social-list-icon">{group.icon}</span>
                        <span className="social-list-copy">
                          <button className="social-group-name-button" onClick={() => void openGroupDetail(group)} type="button">
                            <strong>{group.name}</strong>
                          </button>
                          <small>{group.memberCount.toLocaleString()} membres · {group.description}</small>
                        </span>
                        <button className={`social-join-button ${group.isMember ? "is-joined" : ""}`} onClick={() => void handleApiGroupMembership(group.id, group.name)} type="button">
                          {group.isMember ? "✓ Rejoint" : "Rejoindre"}
                        </button>
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
                    {EVENTS.map((event) => (
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
                {["piehub", "ibrahim", "junior"].map((userId) => {
                  const user = findCommunityUser(userId);
                  return (
                    <div className="social-list-card" key={`thread-${user.id}`}>
                      <span
                        className="social-avatar social-avatar-sm social-avatar-with-status"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.avatar}
                      </span>
                      <span className="social-list-copy">
                        <strong>{user.name}</strong>
                        <small>{user.bio}</small>
                      </span>
                      <button
                        className="social-message-button"
                        onClick={() => openMessagesWith(user.id)}
                        type="button"
                      >
                        Ouvrir
                      </button>
                    </div>
                  );
                })}
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
                        <img alt={ad.title} className="social-ad-image" src={ad.imageUrl} />
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
          <div className="social-widget">
            <div className="social-widget-title">
              <strong>🔥 Tendances</strong>
              <button onClick={() => switchTab("explorer")} type="button">Voir tout</button>
            </div>
            {TRENDING.map((trend, index) => (
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
              <button onClick={() => pushToast("Appel en cours...")} type="button">☎</button>
              <button onClick={() => setMessageOpen(false)} type="button">✕</button>
            </div>
          </div>
          <div className="social-message-body">
            {messages.map((message, index) => (
              <div className={`social-message-line is-${message.from}`} key={`${message.time}-${index}`}>
                <div className={`social-message-bubble is-${message.from}`}>{message.text}</div>
                <div className={`social-message-time is-${message.from}`}>{message.time}</div>
              </div>
            ))}
            {isAssistantMessageLoading ? (
              <div className="social-message-line is-them">
                <div className="social-message-bubble is-them is-pending">Guide PieHUB prepare une reponse...</div>
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
          <div className="social-story-modal" onClick={(event) => event.stopPropagation()} role="presentation">
            <div className="social-story-modal-head">
              <strong>{selectedStoryUser.name}</strong>
              <button onClick={() => setStoryIndex(null)} type="button">✕</button>
            </div>
            <div className="social-story-modal-body">
              <span className="social-avatar social-avatar-xl" style={{ backgroundColor: selectedStoryUser.color }}>
                {selectedStoryUser.avatar}
              </span>
              <div className="social-story-country">{selectedStoryUser.country}</div>
              <div className="social-story-box">{storyIndex !== null && activeLocalStories[storyIndex] ? activeLocalStories[storyIndex].content : ""}</div>
            </div>
          </div>
        </div>
      ) : null}

      {profileId ? (
        <div className="social-modal-overlay" onClick={() => setProfileId(null)} role="presentation">
          <div className="social-profile-modal" onClick={(event) => event.stopPropagation()} role="presentation">
            <div className="social-profile-cover" style={{ background: `linear-gradient(135deg, ${selectedProfile.color}, ${selectedProfile.color}88)` }}>
              <button className="social-profile-close" onClick={() => setProfileId(null)} type="button">✕</button>
              <span className="social-avatar social-avatar-hero" style={{ backgroundColor: selectedProfile.color }}>
                {selectedProfile.avatar}
              </span>
            </div>
            <div className="social-profile-modal-body">
              <div className="social-profile-modal-name">{profileId === currentProfileId ? "Mon profil" : selectedProfile.name}</div>
              <div className="social-profile-modal-handle">{findUser(profileId).tag} · {findUser(profileId).country}</div>
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
              </div>
              {profileId !== "moi" ? (
                <div className="social-profile-modal-actions">
                  <button className="social-primary-pill" onClick={() => toggleFollow(profileId)} type="button">{followingSet.has(profileId) ? "✓ Abonne" : "Suivre"}</button>
                  <button className="social-secondary-pill" onClick={() => { setProfileId(null); openMessagesWith(profileId); }} type="button">💬 Message</button>
                </div>
              ) : (
                <button className="social-primary-pill social-full-width" onClick={() => openCompose("text")} type="button">+ Creer une publication</button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {composeOpen ? (
        <div className="social-modal-overlay" onClick={closeCompose} role="presentation">
          <div className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="presentation">
            <div className="social-compose-head">
              <strong>{composeMode === "story" ? "Publier un statut" : "Creer une publication"}</strong>
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
                {(["text", "doc", "poll", "event", "story"] as ComposeMode[]).map((mode) => {
                  const labels: Record<ComposeMode, string> = { text: "Texte", doc: "Document", poll: "Sondage", event: "Evenement", story: "Statut" };
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
            </div>
            <div className="social-compose-footer">
              <span>{composeText.trim().length} caracteres</span>
              <button className="social-primary-pill" onClick={publishPost} type="button">Publier</button>
            </div>
          </div>
        </div>
      ) : null}

      {createGroupOpen ? (
        <div className="social-modal-overlay" onClick={() => setCreateGroupOpen(false)} role="presentation">
          <div className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="presentation">
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
          <div className="social-compose-modal" onClick={(event) => event.stopPropagation()} role="presentation">
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
            <strong>Notifications</strong>
            <button onClick={() => setNotifPanelOpen(false)} type="button">✕</button>
          </div>
          {notifications.length === 0 ? (
            <div className="social-notif-empty">Aucune notification pour le moment.</div>
          ) : (
            notifications.map((notif) => (
              <div
                className={`social-notif-item ${notif.isRead ? "is-read" : ""}`}
                key={notif.id}
                onClick={() => void handleMarkNotifRead(notif.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") void handleMarkNotifRead(notif.id); }}
              >
                <div className="social-notif-title">{notif.title}</div>
                <div className="social-notif-body">{notif.body}</div>
                <div className="social-notif-time">{notif.createdAt}</div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {createAdOpen ? (
        <div className="social-modal-overlay" onClick={() => { setCreateAdOpen(false); setAdStep(0); }} role="presentation">
          <div className="social-compose-modal social-ad-modal" onClick={(event) => event.stopPropagation()} role="presentation">
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
                    {adForm.image_url ? <img alt="preview" className="social-ad-image" src={adForm.image_url} /> : null}
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

      {toasts.length ? (
        <div className="social-toast-stack">
          {toasts.map((toast) => (
            <div className="social-toast" key={toast.id}>{toast.text}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
