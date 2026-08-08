import { authenticatedFetch } from "@/lib/auth";

type CommunityTag = "campus" | "visa" | "vie" | "logement" | "temoignage";

export type CommunityUser = {
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
  isOfficial?: boolean;
  isAi?: boolean;
  viewerIsFollowing?: boolean;
  stageLabel?: string;
  activityLabel?: string;
  lastActiveLabel?: string | null;
};

export type CommunityComment = {
  id: number;
  userId: string;
  text: string;
  time: string;
  likes: number;
  isOfficial?: boolean;
  isAiGenerated?: boolean;
  isPinned?: boolean;
  trustLabel?: string | null;
  viewerHasLiked: boolean;
  viewerCanEdit: boolean;
};

export type CommunityPollOption = {
  text: string;
  votes: number;
};

type CommunityPostBase = {
  id: number;
  tag: CommunityTag;
  time: string;
  likes: number;
  comments: CommunityComment[];
  shares: number;
  userId: string;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  viewerPollVote?: number | null;
  isQuestion: boolean;
  questionStatus?: "open" | "answered" | "official_answered" | null;
  answerCount: number;
  hasOfficialAnswer: boolean;
  officialAnswerCount: number;
  resolvedByOfficial: boolean;
  trustLabel?: string | null;
  pinnedOfficialComment?: CommunityComment | null;
  viewerCanEdit: boolean;
  mediaUrls: string[];
};

export type CommunityPost =
  | (CommunityPostBase & {
      type: "text";
      content: string;
    })
  | (CommunityPostBase & {
      type: "resource";
      content: string;
      resourceName: string;
      resourceType: "pdf" | "doc";
      resourceSize: string;
      resourceUrl: string | null;
      resourceMimeType: string | null;
    })
  | (CommunityPostBase & {
      type: "poll";
      question: string;
      options: CommunityPollOption[];
      content: string;
    });

export type CommunityBootstrapData = {
  currentProfileId: string | null;
  users: CommunityUser[];
  posts: CommunityPost[];
  groups?: CommunityGroupItem[];
  eventsCalendar?: CommunityEventCalendarItem[];
  notifications?: CommunityNotificationItem[];
  unreadNotifications?: number;
  ads?: CommunityAdItem[];
  stories?: CommunityStoryItem[];
};

export type CommunityStoryItem = {
  id: string;
  userId: string;
  content: string;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  createdAt: string;
  expiresAt: string;
  viewerCanDelete: boolean;
};

export type CommunityAssetItem = {
  storagePath: string;
  publicUrl: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type CommunityMutationData = {
  post: CommunityPost;
  assistantComment: CommunityComment | null;
  assistantReplied: boolean;
};

export type CommunityThreadMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  readAt?: string | null;
};

export type CommunityThreadData = {
  conversationId: string | null;
  messages: CommunityThreadMessage[];
  source?: "cohere" | "ai_gateway" | "fallback" | null;
};

export type CommunityDirectThreadItem = {
  id: string;
  targetProfile: CommunityUser;
  lastMessage: CommunityThreadMessage | null;
  unreadCount: number;
  updatedAt: string;
};

export type CommunityDirectThreadData = {
  thread: CommunityDirectThreadItem;
  messages: CommunityThreadMessage[];
};

type CommunityGroupApi = {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  member_count: number;
  is_official: boolean;
  is_member: boolean;
  viewer_role: "owner" | "moderator" | "member" | null;
  created_by_profile_id: string | null;
  created_at: string;
};

type CommunityEventCalendarApi = {
  id: number;
  name: string;
  description: string;
  event_date: string;
  event_time: string;
  location_type: string;
  location_detail: string;
  attendee_count: number;
  is_official: boolean;
  is_attending: boolean;
  created_by_profile_id: string | null;
  created_at: string;
};

type CommunityNotificationApi = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

type CommunityBootstrapApi = {
  current_profile_id: string | null;
  profiles: Array<{
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
    is_official?: boolean;
    is_ai?: boolean;
    viewer_is_following?: boolean;
    stage_label?: string;
    activity_label?: string;
    last_active_label?: string | null;
  }>;
  posts: CommunityPostApi[];
  groups?: CommunityGroupApi[];
  events_calendar?: CommunityEventCalendarApi[];
  notifications?: CommunityNotificationApi[];
  unread_notifications?: number;
  ads?: CommunityAdApi[];
  stories?: CommunityStoryApi[];
};

type CommunityCommentApi = {
  id: number;
  user_id: string;
  text: string;
  time: string;
  likes: number;
  is_official?: boolean;
  is_ai_generated?: boolean;
  is_pinned?: boolean;
  trust_label?: string | null;
  viewer_has_liked?: boolean;
  viewer_can_edit?: boolean;
};

type CommunityPostApi = {
  id: number;
  user_id: string;
  post_type: "text" | "resource" | "poll";
  tag: string;
  time: string;
  likes: number;
  comments: CommunityCommentApi[];
  shares: number;
  content: string;
  resource_name?: string | null;
  resource_type?: "pdf" | "doc" | null;
  resource_size?: string | null;
  resource_url?: string | null;
  resource_mime_type?: string | null;
  media_urls?: string[];
  question?: string | null;
  options?: CommunityPollOption[];
  viewer_has_liked?: boolean;
  viewer_has_saved?: boolean;
  viewer_poll_vote?: number | null;
  group_id?: string | null;
  is_question?: boolean;
  question_status?: "open" | "answered" | "official_answered" | null;
  answer_count?: number;
  has_official_answer?: boolean;
  official_answer_count?: number;
  resolved_by_official?: boolean;
  trust_label?: string | null;
  pinned_official_comment?: CommunityCommentApi | null;
  viewer_can_edit?: boolean;
};

type CommunityStoryApi = {
  id: string;
  user_id: string;
  content: string;
  media_url?: string | null;
  media_mime_type?: string | null;
  created_at: string;
  expires_at: string;
  viewer_can_delete?: boolean;
};

type CommunityMutationApi = {
  post: CommunityPostApi;
  assistant_comment?: CommunityCommentApi | null;
  assistant_replied: boolean;
};

type CommunityThreadApi = {
  conversation_id: string | null;
  messages: Array<{
    id: string;
    from_role: "me" | "them";
    text: string;
    time: string;
  }>;
  source?: "cohere" | "ai_gateway" | "fallback" | null;
};

type CommunityDirectThreadApi = {
  id: string;
  target_profile: CommunityBootstrapApi["profiles"][number];
  last_message?: {
    id: string;
    from_role: "me" | "them";
    text: string;
    time: string;
    read_at?: string | null;
  } | null;
  unread_count: number;
  updated_at: string;
};

type CommunityDirectThreadResponseApi = {
  thread: CommunityDirectThreadApi;
  messages: Array<{
    id: string;
    from_role: "me" | "them";
    text: string;
    time: string;
    read_at?: string | null;
  }>;
};

type CommunityDirectThreadListResponseApi = {
  threads: CommunityDirectThreadApi[];
};

function inferTagFromText(text: string, fallback: CommunityTag = "vie"): CommunityTag {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.includes("visa") ||
    normalized.includes("consulaire") ||
    normalized.includes("hebergement") ||
    normalized.includes("lettre explicative")
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
    normalized.includes("retour") ||
    normalized.includes("mon parcours")
  ) {
    return "temoignage";
  }

  return fallback;
}

function normalizeTag(
  tag: string,
  content: string,
  postType: CommunityPostApi["post_type"],
): CommunityTag {
  const normalized = (tag || "").trim().toLowerCase();
  if (normalized.includes("campus")) {
    return "campus";
  }
  if (normalized.includes("visa")) {
    return "visa";
  }
  if (normalized.includes("vie")) {
    return "vie";
  }
  if (normalized.includes("logement")) {
    return "logement";
  }
  if (normalized.includes("temoignage")) {
    const inferred = inferTagFromText(
      content,
      postType === "resource" ? "visa" : postType === "poll" ? "vie" : "temoignage",
    );
    return inferred === "temoignage" ? "temoignage" : inferred;
  }

  return inferTagFromText(
    content,
    postType === "resource" ? "visa" : postType === "poll" ? "vie" : "campus",
  );
}

type CommunityFollowApi = {
  profile: CommunityBootstrapApi["profiles"][number];
  current_profile?: CommunityBootstrapApi["profiles"][number] | null;
  is_following: boolean;
};

export type CommunityFollowData = {
  profile: CommunityUser;
  currentProfile: CommunityUser | null;
  isFollowing: boolean;
};

function mapUser(item: CommunityBootstrapApi["profiles"][number]): CommunityUser {
  return {
    id: item.id,
    name: item.name,
    tag: item.tag,
    country: item.country,
    city: item.city,
    bio: item.bio,
    avatar: item.avatar,
    color: item.color,
    followers: item.followers,
    following: item.following,
    posts: item.posts,
    tags: item.tags || [],
    isOfficial: item.is_official,
    isAi: item.is_ai,
    viewerIsFollowing: item.viewer_is_following,
    stageLabel: item.stage_label,
    activityLabel: item.activity_label,
    lastActiveLabel: item.last_active_label ?? null,
  };
}

function mapComment(item: CommunityCommentApi): CommunityComment {
  return {
    id: item.id,
    userId: item.user_id,
    text: item.text,
    time: item.time,
    likes: item.likes,
    isOfficial: item.is_official,
    isAiGenerated: item.is_ai_generated,
    isPinned: item.is_pinned,
    trustLabel: item.trust_label ?? null,
    viewerHasLiked: Boolean(item.viewer_has_liked),
    viewerCanEdit: Boolean(item.viewer_can_edit),
  };
}

function mapBase(item: CommunityPostApi): CommunityPostBase {
  const rawText = item.question || item.content || "";
  return {
    id: item.id,
    userId: item.user_id,
    tag: normalizeTag(item.tag, rawText, item.post_type),
    time: item.time,
    likes: item.likes,
    comments: (item.comments || []).map(mapComment),
    shares: item.shares,
    viewerHasLiked: Boolean(item.viewer_has_liked),
    viewerHasSaved: Boolean(item.viewer_has_saved),
    viewerPollVote: item.viewer_poll_vote,
    isQuestion: Boolean(item.is_question),
    questionStatus: item.question_status ?? null,
    answerCount: item.answer_count ?? 0,
    hasOfficialAnswer: Boolean(item.has_official_answer),
    officialAnswerCount: item.official_answer_count ?? 0,
    resolvedByOfficial: Boolean(item.resolved_by_official),
    trustLabel: item.trust_label ?? null,
    pinnedOfficialComment: item.pinned_official_comment ? mapComment(item.pinned_official_comment) : null,
    viewerCanEdit: Boolean(item.viewer_can_edit),
    mediaUrls: item.media_urls || [],
  };
}

function mapPost(item: CommunityPostApi): CommunityPost {
  const base = mapBase(item);

  if (item.post_type === "poll") {
    return {
      ...base,
      type: "poll",
      question: item.question || item.content || "",
      options: item.options || [],
      content: item.content || "",
    };
  }

  if (item.post_type === "resource") {
    return {
      ...base,
      type: "resource",
      content: item.content || "",
      resourceName: item.resource_name || "Ressource PieHUB",
      resourceType: item.resource_type || "pdf",
      resourceSize: item.resource_size || "N/A",
      resourceUrl: item.resource_url ?? null,
      resourceMimeType: item.resource_mime_type ?? null,
    };
  }

  return {
    ...base,
    type: "text",
    content: item.content || "",
  };
}


function mapThreadMessage(item: { id: string; from_role: "me" | "them"; text: string; time: string; read_at?: string | null }): CommunityThreadMessage {
  return {
    id: item.id,
    from: item.from_role,
    text: item.text,
    time: item.time,
    readAt: item.read_at,
  };
}

function mapDirectThread(item: CommunityDirectThreadApi): CommunityDirectThreadItem {
  return {
    id: item.id,
    targetProfile: mapUser(item.target_profile),
    lastMessage: item.last_message ? mapThreadMessage(item.last_message) : null,
    unreadCount: item.unread_count ?? 0,
    updatedAt: item.updated_at,
  };
}

function mapDirectThreadResponse(item: CommunityDirectThreadResponseApi): CommunityDirectThreadData {
  return {
    thread: mapDirectThread(item.thread),
    messages: item.messages.map(mapThreadMessage),
  };
}

function mapMutation(item: CommunityMutationApi): CommunityMutationData {
  return {
    post: mapPost(item.post),
    assistantComment: item.assistant_comment ? mapComment(item.assistant_comment) : null,
    assistantReplied: item.assistant_replied,
  };
}

function mapStory(item: CommunityStoryApi): CommunityStoryItem {
  return {
    id: item.id,
    userId: item.user_id,
    content: item.content,
    mediaUrl: item.media_url ?? null,
    mediaMimeType: item.media_mime_type ?? null,
    createdAt: item.created_at,
    expiresAt: item.expires_at,
    viewerCanDelete: Boolean(item.viewer_can_delete),
  };
}

export async function fetchCommunityBootstrap(): Promise<CommunityBootstrapData> {
  const response = await authenticatedFetch("/api/community/bootstrap");
  if (!response.ok) {
    throw new Error("COMMUNITY_BOOTSTRAP_FAILED");
  }

  const payload = (await response.json()) as CommunityBootstrapApi;
  return {
    currentProfileId: payload.current_profile_id,
    users: payload.profiles.map(mapUser),
    posts: payload.posts.map(mapPost),
    groups: (payload.groups || []).map(mapGroup),
    eventsCalendar: (payload.events_calendar || []).map(mapEventCalendar),
    notifications: (payload.notifications || []).map(mapNotification),
    unreadNotifications: payload.unread_notifications ?? 0,
    ads: (payload.ads || []).map(mapAd),
    stories: (payload.stories || []).map(mapStory),
  };
}

export async function createCommunityPost(payload: {
  tag: string;
  content: string;
  postType?: "text" | "resource" | "poll";
  resourceName?: string;
  resourceType?: "pdf" | "doc";
  resourceSize?: string;
  question?: string;
  options?: string[];
  groupId?: string | null;
  isQuestion?: boolean;
  resourceStoragePath?: string;
  resourceUrl?: string;
  resourceMimeType?: string;
  mediaUrls?: string[];
}): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    "/api/community/posts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_type: payload.postType ?? "text",
        tag: payload.tag,
        content: payload.content,
        resource_name: payload.resourceName,
        resource_type: payload.resourceType,
        resource_size: payload.resourceSize,
        question: payload.question,
        options: payload.options || [],
        group_id: payload.groupId ?? null,
        is_question: Boolean(payload.isQuestion),
        resource_storage_path: payload.resourceStoragePath,
        resource_url: payload.resourceUrl,
        resource_mime_type: payload.resourceMimeType,
        media_urls: payload.mediaUrls || [],
      }),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_POST_FAILED");
  }

  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function createCommunityComment(
  postId: number,
  text: string,
): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/posts/${postId}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_COMMENT_FAILED");
  }

  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function updateCommunityPost(postId: number, payload: { content?: string; question?: string; tag?: string }): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/posts/${postId}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_POST_UPDATE_FAILED");
  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function deleteCommunityPost(postId: number): Promise<void> {
  const response = await authenticatedFetch(
    `/api/community/posts/${postId}`,
    { method: "DELETE" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_POST_DELETE_FAILED");
}

export async function updateCommunityComment(commentId: number, text: string): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/comments/${commentId}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_COMMENT_UPDATE_FAILED");
  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function deleteCommunityComment(commentId: number): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/comments/${commentId}`,
    { method: "DELETE" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_COMMENT_DELETE_FAILED");
  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function toggleCommunityCommentReaction(commentId: number): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/comments/${commentId}/reaction`,
    { method: "POST" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_COMMENT_REACTION_FAILED");
  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function registerCommunityPostShare(postId: number): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/posts/${postId}/shares`,
    { method: "POST" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_SHARE_FAILED");
  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function uploadCommunityAsset(file: File): Promise<CommunityAssetItem> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await authenticatedFetch(
    "/api/community/assets/upload",
    { method: "POST", body: formData },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_ASSET_UPLOAD_FAILED");
  const item = await response.json() as {
    storage_path: string; public_url: string; filename: string; mime_type: string; size: number;
  };
  return {
    storagePath: item.storage_path,
    publicUrl: item.public_url,
    filename: item.filename,
    mimeType: item.mime_type,
    size: item.size,
  };
}

export async function createCommunityStory(payload: {
  content: string;
  mediaStoragePath?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
}): Promise<CommunityStoryItem> {
  const response = await authenticatedFetch(
    "/api/community/stories",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: payload.content,
        media_storage_path: payload.mediaStoragePath,
        media_url: payload.mediaUrl,
        media_mime_type: payload.mediaMimeType,
      }),
    },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_STORY_CREATE_FAILED");
  return mapStory((await response.json()) as CommunityStoryApi);
}

export async function deleteCommunityStory(storyId: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/community/stories/${encodeURIComponent(storyId)}`,
    { method: "DELETE" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_STORY_DELETE_FAILED");
}

export async function toggleCommunityReaction(
  postId: number,
  reactionKind: "like" | "save",
): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/posts/${postId}/reactions/${reactionKind}`,
    {
      method: "POST",
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_REACTION_FAILED");
  }

  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function voteCommunityPoll(
  postId: number,
  optionIndex: number,
): Promise<CommunityMutationData> {
  const response = await authenticatedFetch(
    `/api/community/posts/${postId}/poll-votes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ option_index: optionIndex }),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_POLL_VOTE_FAILED");
  }

  return mapMutation((await response.json()) as CommunityMutationApi);
}

export async function toggleCommunityProfileFollow(
  profileId: string,
): Promise<CommunityFollowData> {
  const response = await authenticatedFetch(
    `/api/community/profiles/${encodeURIComponent(profileId)}/follow`,
    { method: "POST" },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_FOLLOW_FAILED");
  }

  const payload = (await response.json()) as CommunityFollowApi;
  return {
    profile: mapUser(payload.profile),
    currentProfile: payload.current_profile ? mapUser(payload.current_profile) : null,
    isFollowing: payload.is_following,
  };
}

export async function fetchCommunityAssistantThread(): Promise<CommunityThreadData> {
  const response = await authenticatedFetch(
    "/api/community/assistant/thread",
    undefined,
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_THREAD_FAILED");
  }

  const payload = (await response.json()) as CommunityThreadApi;
  return {
    conversationId: payload.conversation_id,
    messages: payload.messages.map(mapThreadMessage),
    source: payload.source,
  };
}

export async function sendCommunityAssistantMessage(
  message: string,
  conversationId?: string | null,
): Promise<CommunityThreadData> {
  const response = await authenticatedFetch(
    "/api/community/assistant/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_THREAD_MESSAGE_FAILED");
  }

  const payload = (await response.json()) as CommunityThreadApi;
  return {
    conversationId: payload.conversation_id,
    messages: payload.messages.map(mapThreadMessage),
    source: payload.source,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CommunityGroupItem = {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  memberCount: number;
  isOfficial: boolean;
  isMember: boolean;
  viewerRole: "owner" | "moderator" | "member" | null;
  createdByProfileId: string | null;
  createdAt: string;
};

export type CommunityGroupMemberItem = {
  profile: CommunityUser;
  role: "owner" | "moderator" | "member";
  joinedAt: string;
};

export type CommunityEventCalendarItem = {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  eventTime: string;
  locationType: string;
  locationDetail: string;
  attendeeCount: number;
  isOfficial: boolean;
  isAttending: boolean;
  createdByProfileId: string | null;
  createdAt: string;
};

export type CommunityNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type CommunityNotificationsData = {
  notifications: CommunityNotificationItem[];
  unreadCount: number;
};

// ── API mappers ────────────────────────────────────────────────────────────────

function mapGroup(item: CommunityGroupApi): CommunityGroupItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    category: item.category,
    memberCount: item.member_count,
    isOfficial: item.is_official,
    isMember: item.is_member,
    viewerRole: item.viewer_role,
    createdByProfileId: item.created_by_profile_id,
    createdAt: item.created_at,
  };
}

function mapEventCalendar(item: CommunityEventCalendarApi): CommunityEventCalendarItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    eventDate: item.event_date,
    eventTime: item.event_time,
    locationType: item.location_type,
    locationDetail: item.location_detail,
    attendeeCount: item.attendee_count,
    isOfficial: item.is_official,
    isAttending: item.is_attending,
    createdByProfileId: item.created_by_profile_id,
    createdAt: item.created_at,
  };
}

function mapNotification(item: CommunityNotificationApi): CommunityNotificationItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    isRead: item.is_read,
    createdAt: item.created_at,
  };
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function fetchCommunityGroups(): Promise<CommunityGroupItem[]> {
  const response = await authenticatedFetch("/api/community/groups");
  if (!response.ok) return [];
  const payload = (await response.json()) as CommunityGroupApi[];
  return payload.map(mapGroup);
}

export async function createCommunityGroup(payload: {
  name: string;
  description: string;
  icon: string;
  category: string;
}): Promise<{ group: CommunityGroupItem; isMember: boolean }> {
  const response = await authenticatedFetch(
    "/api/community/groups",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("CREATE_GROUP_FAILED");
  const data = (await response.json()) as { group: CommunityGroupApi; is_member: boolean };
  return { group: mapGroup(data.group), isMember: data.is_member };
}

export async function toggleCommunityGroupMembership(
  groupId: number,
): Promise<{ group: CommunityGroupItem; isMember: boolean }> {
  const response = await authenticatedFetch(
    `/api/community/groups/${groupId}/membership`,
    { method: "POST" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("GROUP_MEMBERSHIP_FAILED");
  const data = (await response.json()) as { group: CommunityGroupApi; is_member: boolean };
  return { group: mapGroup(data.group), isMember: data.is_member };
}

export async function fetchCommunityGroupMembers(groupId: number): Promise<CommunityGroupMemberItem[]> {
  const response = await authenticatedFetch(`/api/community/groups/${groupId}/members`, undefined, { requireAuth: true });
  if (!response.ok) throw new Error("GROUP_MEMBERS_FAILED");
  const payload = (await response.json()) as Array<{ profile: CommunityBootstrapApi["profiles"][number]; role: "owner" | "moderator" | "member"; joined_at: string }>;
  return payload.map((item) => ({ profile: mapUser(item.profile), role: item.role, joinedAt: item.joined_at }));
}

export async function updateCommunityGroupMemberRole(groupId: number, profileId: string, role: "moderator" | "member"): Promise<CommunityGroupMemberItem[]> {
  const response = await authenticatedFetch(`/api/community/groups/${groupId}/members/${profileId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }, { requireAuth: true });
  if (!response.ok) throw new Error("GROUP_MEMBER_ROLE_FAILED");
  const payload = (await response.json()) as Array<{ profile: CommunityBootstrapApi["profiles"][number]; role: "owner" | "moderator" | "member"; joined_at: string }>;
  return payload.map((item) => ({ profile: mapUser(item.profile), role: item.role, joinedAt: item.joined_at }));
}

export async function removeCommunityGroupMember(groupId: number, profileId: string): Promise<CommunityGroupMemberItem[]> {
  const response = await authenticatedFetch(`/api/community/groups/${groupId}/members/${profileId}`, { method: "DELETE" }, { requireAuth: true });
  if (!response.ok) throw new Error("GROUP_MEMBER_REMOVE_FAILED");
  const payload = (await response.json()) as Array<{ profile: CommunityBootstrapApi["profiles"][number]; role: "owner" | "moderator" | "member"; joined_at: string }>;
  return payload.map((item) => ({ profile: mapUser(item.profile), role: item.role, joinedAt: item.joined_at }));
}

export async function fetchCommunityEventsCalendar(): Promise<CommunityEventCalendarItem[]> {
  const response = await authenticatedFetch("/api/community/events-calendar");
  if (!response.ok) return [];
  const payload = (await response.json()) as CommunityEventCalendarApi[];
  return payload.map(mapEventCalendar);
}

export async function createCommunityEvent(payload: {
  name: string;
  description: string;
  event_date: string;
  event_time: string;
  location_type: string;
  location_detail: string;
}): Promise<{ event: CommunityEventCalendarItem; isAttending: boolean }> {
  const response = await authenticatedFetch(
    "/api/community/events-calendar",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("CREATE_EVENT_FAILED");
  const data = (await response.json()) as { event: CommunityEventCalendarApi; is_attending: boolean };
  return { event: mapEventCalendar(data.event), isAttending: data.is_attending };
}

export async function toggleCommunityEventAttendance(
  eventId: number,
): Promise<{ event: CommunityEventCalendarItem; isAttending: boolean }> {
  const response = await authenticatedFetch(
    `/api/community/events-calendar/${eventId}/attendance`,
    { method: "POST" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("EVENT_ATTENDANCE_FAILED");
  const data = (await response.json()) as { event: CommunityEventCalendarApi; is_attending: boolean };
  return { event: mapEventCalendar(data.event), isAttending: data.is_attending };
}

export async function fetchCommunityNotifications(): Promise<CommunityNotificationsData> {
  const response = await authenticatedFetch(
    "/api/community/notifications",
    undefined,
    { requireAuth: true },
  );
  if (!response.ok) return { notifications: [], unreadCount: 0 };
  const payload = (await response.json()) as { notifications: CommunityNotificationApi[]; unread_count: number };
  return {
    notifications: payload.notifications.map(mapNotification),
    unreadCount: payload.unread_count,
  };
}

export async function markCommunityNotificationRead(
  notificationId: string,
): Promise<CommunityNotificationsData> {
  const response = await authenticatedFetch(
    `/api/community/notifications/${notificationId}/read`,
    { method: "POST" },
    { requireAuth: true },
  );
  if (!response.ok) return { notifications: [], unreadCount: 0 };
  const payload = (await response.json()) as { notifications: CommunityNotificationApi[]; unread_count: number };
  return {
    notifications: payload.notifications.map(mapNotification),
    unreadCount: payload.unread_count,
  };
}

export async function markAllCommunityNotificationsRead(): Promise<CommunityNotificationsData> {
  const response = await authenticatedFetch("/api/community/notifications/read-all", { method: "POST" }, { requireAuth: true });
  if (!response.ok) throw new Error("NOTIFICATIONS_READ_ALL_FAILED");
  const payload = (await response.json()) as { notifications: CommunityNotificationApi[]; unread_count: number };
  return { notifications: payload.notifications.map(mapNotification), unreadCount: payload.unread_count };
}

export async function toggleCommunityUserBlock(profileId: string): Promise<boolean> {
  const response = await authenticatedFetch(`/api/community/profiles/${profileId}/block`, { method: "POST" }, { requireAuth: true });
  if (!response.ok) throw new Error("COMMUNITY_BLOCK_FAILED");
  return ((await response.json()) as { is_blocked: boolean }).is_blocked;
}

export async function fetchCommunityUserBlocks(): Promise<string[]> {
  const response = await authenticatedFetch("/api/community/blocks", undefined, { requireAuth: true });
  if (!response.ok) return [];
  return ((await response.json()) as { blocked_profile_ids: string[] }).blocked_profile_ids;
}

// ── Ads ──────────────────────────────────────────────────────────────────────

export type CommunityAdItem = {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string;
  category: string;
  moderationStatus: "pending" | "approved" | "rejected";
  createdByProfileId: string | null;
  createdAt: string;
  isOwn: boolean;
};

type CommunityAdApi = {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  cta_label: string;
  cta_url: string;
  category: string;
  moderation_status: string;
  created_by_profile_id: string | null;
  created_at: string;
  is_own: boolean;
};

function mapAd(item: CommunityAdApi): CommunityAdItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    imageUrl: item.image_url,
    ctaLabel: item.cta_label,
    ctaUrl: item.cta_url,
    category: item.category,
    moderationStatus: (item.moderation_status as CommunityAdItem["moderationStatus"]) || "pending",
    createdByProfileId: item.created_by_profile_id,
    createdAt: item.created_at,
    isOwn: item.is_own,
  };
}

export async function fetchCommunityAds(): Promise<{ ads: CommunityAdItem[]; pendingCount: number }> {
  const response = await authenticatedFetch("/api/community/ads");
  if (!response.ok) return { ads: [], pendingCount: 0 };
  const payload = (await response.json()) as { ads: CommunityAdApi[]; pending_count: number };
  return { ads: payload.ads.map(mapAd), pendingCount: payload.pending_count };
}

export async function createCommunityAd(payload: {
  title: string;
  body: string;
  image_url?: string | null;
  cta_label: string;
  cta_url: string;
  category: string;
}): Promise<CommunityAdItem> {
  const response = await authenticatedFetch(
    "/api/community/ads",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("CREATE_AD_FAILED");
  return mapAd((await response.json()) as CommunityAdApi);
}


export type CommunityReportItem = {
  id: string;
  targetType: "post" | "comment" | "ad" | "profile";
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdByProfileId: string | null;
  createdAt: string;
};

type CommunityReportApi = {
  id: string;
  target_type: "post" | "comment" | "ad" | "profile";
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_by_profile_id: string | null;
  created_at: string;
};

function mapReport(item: CommunityReportApi): CommunityReportItem {
  return {
    id: item.id,
    targetType: item.target_type,
    targetId: item.target_id,
    reason: item.reason,
    details: item.details ?? null,
    status: item.status,
    createdByProfileId: item.created_by_profile_id,
    createdAt: item.created_at,
  };
}

export async function reportCommunityContent(payload: {
  targetType: "post" | "comment" | "ad" | "profile";
  targetId: string;
  reason: string;
  details?: string | null;
}): Promise<CommunityReportItem> {
  const response = await authenticatedFetch(
    "/api/community/reports",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_type: payload.targetType,
        target_id: payload.targetId,
        reason: payload.reason,
        details: payload.details ?? null,
      }),
    },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("COMMUNITY_REPORT_FAILED");
  const data = (await response.json()) as { report: CommunityReportApi; message: string };
  return mapReport(data.report);
}

export async function fetchCommunityModerationQueue(): Promise<{
  reports: CommunityReportItem[];
  pendingCount: number;
}> {
  const response = await authenticatedFetch(
    "/api/community/moderation/queue",
    undefined,
    { requireAuth: true },
  );
  if (!response.ok) return { reports: [], pendingCount: 0 };
  const data = (await response.json()) as { reports: CommunityReportApi[]; pending_count: number };
  return { reports: data.reports.map(mapReport), pendingCount: data.pending_count };
}

export async function rewriteWithAI(text: string, context = "publication"): Promise<string> {
  const response = await authenticatedFetch(
    "/api/community/ai-rewrite",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context }),
    },
    { requireAuth: true },
  );
  if (!response.ok) return text;
  const payload = (await response.json()) as { rewritten: string };
  return payload.rewritten || text;
}


export async function fetchCommunityDirectThreads(): Promise<CommunityDirectThreadItem[]> {
  const response = await authenticatedFetch(
    "/api/community/direct-messages",
    undefined,
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_DIRECT_THREADS_FAILED");
  }

  const payload = (await response.json()) as CommunityDirectThreadListResponseApi;
  return (payload.threads || []).map(mapDirectThread);
}

export async function fetchCommunityDirectThread(targetProfileId: string): Promise<CommunityDirectThreadData> {
  const response = await authenticatedFetch(
    `/api/community/direct-messages/${encodeURIComponent(targetProfileId)}`,
    undefined,
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_DIRECT_THREAD_FAILED");
  }

  return mapDirectThreadResponse((await response.json()) as CommunityDirectThreadResponseApi);
}

export async function sendCommunityDirectMessage(targetProfileId: string, body: string): Promise<CommunityDirectThreadData> {
  const response = await authenticatedFetch(
    "/api/community/direct-messages",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_profile_id: targetProfileId, body }),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("COMMUNITY_DIRECT_MESSAGE_FAILED");
  }

  return mapDirectThreadResponse((await response.json()) as CommunityDirectThreadResponseApi);
}

export async function fetchGroupPosts(groupId: string): Promise<CommunityPost[]> {
  const response = await authenticatedFetch(
    `/api/community/groups/${groupId}/posts`,
    undefined,
    { requireAuth: true },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as CommunityPostApi[];
  return data.map(mapPost);
}
