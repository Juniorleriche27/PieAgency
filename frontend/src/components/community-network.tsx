"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { company } from "@/content/site";
import { onAuthSessionChange } from "@/lib/auth";
import {
  createCommunityComment,
  createCommunityPost,
  fetchCommunityAssistantThread,
  fetchCommunityBootstrap,
  sendCommunityAssistantMessage,
  toggleCommunityReaction,
  voteCommunityPoll,
} from "@/lib/community";

type MainTab = "feed" | "explorer" | "groupes" | "evenements" | "ressources";
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

const STORIES: StoryItem[] = [
  { userId: "moi", content: "Ajouter une story", add: true },
  {
    userId: "ibrahim",
    content: "⚠️ Rappel : fermeture de la procedure Campus France le 30 mars pour certains pays.",
  },
  {
    userId: "amara",
    content: "📸 Ma nouvelle ville : Lyon, vue depuis Fourviere. Courage a tous ceux qui se preparent.",
  },
  {
    userId: "kofi",
    content: "🎓 Rendu de mon premier devoir de Master aujourd'hui. Le niveau est exigeant mais passionnant.",
  },
  {
    userId: "fatou",
    content: "Lettre de motivation terminee. Relue 10 fois et corrigee avec PieAgency.",
  },
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
  return text.split(/(#[\w-]+|@[\w-]+|\n)/g).filter(Boolean).map((chunk, index) => {
    if (chunk === "\n") {
      return <br key={`br-${index}`} />;
    }
    if (chunk.startsWith("#")) {
      return (
        <span className="social-post-hashtag" key={`tag-${index}`}>
          {chunk}
        </span>
      );
    }
    if (chunk.startsWith("@")) {
      return (
        <span className="social-post-mention" key={`mention-${index}`}>
          {chunk}
        </span>
      );
    }
    return <span key={`text-${index}`}>{chunk}</span>;
  });
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
  const [activeTab, setActiveTab] = useState<MainTab>("feed");
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("posts");
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>(USERS);
  const [currentProfileId, setCurrentProfileId] = useState("moi");
  const [posts, setPosts] = useState<SocialPost[]>(() => copyPosts(INITIAL_POSTS));
  const [feedFromApi, setFeedFromApi] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>(["piehub", "ibrahim", "junior"]);
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [groupState, setGroupState] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map((group) => [group.name, group.joined])),
  );
  const [eventState, setEventState] = useState<Record<string, boolean>>(
    Object.fromEntries(EVENTS.map((event) => [event.name, event.joined])),
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
  const [composeTag, setComposeTag] = useState<TagKey>("temoignage");
  const [composeResourceName, setComposeResourceName] = useState("");
  const [composeResourceType, setComposeResourceType] = useState<"pdf" | "doc">("pdf");
  const [composeResourceSize, setComposeResourceSize] = useState("");
  const [composePollQuestion, setComposePollQuestion] = useState("");
  const [composePollOptions, setComposePollOptions] = useState(["", "", "", ""]);
  const [loadedExtraCount, setLoadedExtraCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [aiReplyingPostIds, setAiReplyingPostIds] = useState<number[]>([]);
  const [isAssistantMessageLoading, setIsAssistantMessageLoading] = useState(false);

  const currentUser = findUserInList(communityUsers, currentProfileId);
  const messageTarget = findUserInList(communityUsers, messageTargetId);
  const likedSet = new Set(likedPostIds);
  const savedSet = new Set(savedPostIds);
  const followingSet = new Set(followingIds);

  function findCommunityUser(userId: string) {
    return findUserInList(communityUsers, userId);
  }

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

  function pushToast(text: string) {
    const id = toastIdRef.current;
    toastIdRef.current += 1;
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2200);
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

  function openCompose(mode: ComposeMode) {
    setComposeMode(mode);
    setComposeTag(mode === "doc" ? "visa" : mode === "poll" ? "vie" : "temoignage");
    setComposeOpen(true);
  }

  function closeCompose() {
    setComposeOpen(false);
    setComposeMode("text");
    setComposeText("");
    setComposeTag("temoignage");
    setComposeResourceName("");
    setComposeResourceType("pdf");
    setComposeResourceSize("");
    setComposePollQuestion("");
    setComposePollOptions(["", "", "", ""]);
  }

  async function publishPost() {
    const trimmedText = composeText.trim();
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
      const mutation = await createCommunityPost({
        tag: composeTag,
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
      });
      setPosts((current) => [
        mutation.post,
        ...current.filter((post) => post.id !== mutation.post.id),
      ]);
      syncPostViewState(mutation.post);
      closeCompose();
      setActiveTab("feed");
      pushToast("Publication partagee avec la communaute.");
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

  function openMessagesWith(userId: string) {
    setMessageTargetId(userId);
    setMessages(createConversationStarter(userId, communityUsers));
    setCommunityConversationId(null);
    setIsAssistantMessageLoading(false);
    setMessageOpen(true);
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
          <button className="social-post-action is-comment" type="button">
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

  const selectedStoryUser =
    storyIndex !== null ? findCommunityUser(STORIES[storyIndex].userId) : currentUser;
  const selectedProfile = profileId ? findCommunityUser(profileId) : currentUser;

  return (
    <div className="social-page-shell">
      <div className="social-topbar">
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

        <div className="social-topbar-search">
          <span>⌕</span>
          <span>Rechercher des etudiants, posts, ressources...</span>
        </div>

        <div className="social-topbar-actions">
          <button className="social-icon-button" onClick={() => openMessagesWith("piehub")} type="button">
            💬
          </button>
          <button className="social-icon-button" onClick={() => pushToast("Centre de notifications")} type="button">
            🔔
          </button>
          <button className="social-profile-trigger" onClick={() => setProfileId(currentProfileId)} type="button">
            {currentUser.avatar}
          </button>
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
            <button className={`social-nav-item ${activeTab === "feed" ? "is-active" : ""}`} onClick={() => setActiveTab("feed")} type="button"><span className="social-nav-symbol">▦</span><span>Fil d&apos;actualite</span></button>
            <button className={`social-nav-item ${activeTab === "explorer" ? "is-active" : ""}`} onClick={() => setActiveTab("explorer")} type="button"><span className="social-nav-symbol">⌕</span><span>Explorer</span></button>
            <button className={`social-nav-item ${activeTab === "groupes" ? "is-active" : ""}`} onClick={() => setActiveTab("groupes")} type="button"><span className="social-nav-symbol">👥</span><span>Groupes</span><span className="social-nav-badge">4</span></button>
            <button className={`social-nav-item ${activeTab === "evenements" ? "is-active" : ""}`} onClick={() => setActiveTab("evenements")} type="button"><span className="social-nav-symbol">🗓</span><span>Evenements</span></button>
            <button className={`social-nav-item ${activeTab === "ressources" ? "is-active" : ""}`} onClick={() => setActiveTab("ressources")} type="button"><span className="social-nav-symbol">📚</span><span>Ressources</span></button>
            <button className="social-nav-item" onClick={() => openMessagesWith("piehub")} type="button"><span className="social-nav-symbol">💬</span><span>Messages</span><span className="social-nav-badge">3</span></button>
          </div>

          <div className="social-nav-group">
            <div className="social-nav-label">Rejoindre</div>
            <a className="social-nav-item" href={company.communityLinks[0].href} rel="noreferrer" target="_blank"><span className="social-nav-symbol">💬</span><span>WhatsApp PieHUB</span></a>
            <a className="social-nav-item" href={company.communityLinks[1].href} rel="noreferrer" target="_blank"><span className="social-nav-symbol">👥</span><span>Groupe Facebook</span></a>
          </div>
        </aside>

        <main className="social-main-feed">
          {activeTab === "feed" ? (
            <>
              <div className="social-stories-row">
                {STORIES.map((story, index) => {
                  const user = findCommunityUser(story.userId);
                  if (story.add) {
                    return (
                      <button className="social-story-item" key={`${story.userId}-add`} onClick={() => openCompose("story")} type="button">
                        <span className="social-story-ring is-seen"><span className="social-story-inner social-story-add">+</span></span>
                        <span className="social-story-label">Ma story</span>
                      </button>
                    );
                  }

                  return (
                    <button className="social-story-item" key={`${story.userId}-${index}`} onClick={() => setStoryIndex(index)} type="button">
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
              <div className="social-tab-bar">
                <button className={`social-tab-button ${explorerTab === "posts" ? "is-active" : ""}`} onClick={() => setExplorerTab("posts")} type="button">Publications</button>
                <button className={`social-tab-button ${explorerTab === "membres" ? "is-active" : ""}`} onClick={() => setExplorerTab("membres")} type="button">Membres</button>
                <button className={`social-tab-button ${explorerTab === "hashtags" ? "is-active" : ""}`} onClick={() => setExplorerTab("hashtags")} type="button">Hashtags</button>
              </div>

              {explorerTab === "posts" ? <div>{[...posts].reverse().slice(0, 3).map((post) => renderPost(post))}</div> : null}

              {explorerTab === "membres" ? (
                <div className="social-member-grid">
                  {communityUsers.filter((user) => user.id !== currentProfileId).map((user) => (
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
                  {TRENDING.map((trend) => (
                    <button className="social-list-card" key={trend.tag} type="button">
                      <span className="social-list-icon social-hash-icon">#</span>
                      <span className="social-list-copy">
                        <strong>{trend.tag}</strong>
                        <small>{trend.count}</small>
                      </span>
                      <span className="social-list-arrow">›</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "groupes" ? (
            <section className="social-tab-section">
              <h2>Groupes</h2>
              <p>Rejoignez des espaces thematiques et echangez avec d&apos;autres etudiants.</p>
              <div className="social-stack">
                {GROUPS.map((group) => (
                  <div className="social-list-card" key={group.name}>
                    <span className="social-list-icon" style={{ background: group.color }}>
                      {group.icon}
                    </span>
                    <span className="social-list-copy">
                      <strong>{group.name}</strong>
                      <small>{group.members.toLocaleString()} membres · {group.desc}</small>
                    </span>
                    <button className={`social-join-button ${groupState[group.name] ? "is-joined" : ""}`} onClick={() => toggleGroup(group.name)} type="button">
                      {groupState[group.name] ? "✓ Rejoint" : "Rejoindre"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "evenements" ? (
            <section className="social-tab-section">
              <h2>Evenements</h2>
              <p>Webinaires, sessions de preparation et rencontres a ne pas manquer.</p>
              <div className="social-stack">
                {EVENTS.map((event) => (
                  <div className="social-event-card" key={event.name}>
                    <div className="social-event-date">
                      <strong>{event.day}</strong>
                      <span>{event.month}</span>
                    </div>
                    <div className="social-event-copy">
                      <strong>{event.name}</strong>
                      <small>{event.time} · {event.attendees} participants · {event.desc}</small>
                    </div>
                    <button className={`social-event-button ${eventState[event.name] ? "is-joined" : ""}`} onClick={() => toggleEvent(event.name)} type="button">
                      {eventState[event.name] ? "✓ Inscrit" : "S&apos;inscrire"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "ressources" ? (
            <section className="social-tab-section">
              <h2>Ressources partagees</h2>
              <p>Documents, guides et modeles partages dans PieHUB.</p>
              <div className="social-resource-grid">
                {RESOURCES.map((resource) => (
                  <button className="social-resource-card" key={resource.name} onClick={() => pushToast(`Telechargement : ${resource.name}`)} type="button">
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
            </section>
          ) : null}
        </main>

        <aside className="social-sidebar-right">
          <div className="social-widget">
            <div className="social-widget-title">
              <strong>🔥 Tendances</strong>
              <button onClick={() => setActiveTab("explorer")} type="button">Voir tout</button>
            </div>
            {TRENDING.map((trend, index) => (
              <button className="social-trending-item" key={trend.tag} type="button">
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
              <button onClick={() => setActiveTab("explorer")} type="button">Voir plus</button>
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
            <a className="social-space-link is-whatsapp" href={company.communityLinks[0].href} rel="noreferrer" target="_blank">💬 Groupe WhatsApp</a>
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

      {storyIndex !== null ? (
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
              <div className="social-story-box">{STORIES[storyIndex].content}</div>
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
              <strong>Creer une publication</strong>
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
              <textarea className="social-compose-textarea" onChange={(event) => setComposeText(event.target.value)} placeholder={COMPOSE_HINTS[composeMode]} value={composeText} />
              <div className="social-compose-tools">
                <button onClick={() => setComposeMode("doc")} type="button">Document</button>
                <button onClick={() => setComposeMode("poll")} type="button">Sondage</button>
                <button onClick={() => setComposeMode("event")} type="button">Evenement</button>
                <button onClick={() => setComposeMode("story")} type="button">Story</button>
              </div>
            </div>
            <div className="social-compose-footer">
              <span>{composeText.trim().length} caracteres</span>
              <button className="social-primary-pill" onClick={publishPost} type="button">Publier</button>
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
