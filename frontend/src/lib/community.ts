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
};

export type CommunityComment = {
  id: number;
  userId: string;
  text: string;
  time: string;
  likes: number;
  isOfficial?: boolean;
  isAiGenerated?: boolean;
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
};

export type CommunityThreadData = {
  conversationId: string | null;
  messages: CommunityThreadMessage[];
  source?: "cohere" | "fallback" | null;
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
  }>;
  posts: CommunityPostApi[];
  groups?: CommunityGroupApi[];
  events_calendar?: CommunityEventCalendarApi[];
  notifications?: CommunityNotificationApi[];
  unread_notifications?: number;
  ads?: CommunityAdApi[];
};

type CommunityCommentApi = {
  id: number;
  user_id: string;
  text: string;
  time: string;
  likes: number;
  is_official?: boolean;
  is_ai_generated?: boolean;
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
  question?: string | null;
  options?: CommunityPollOption[];
  viewer_has_liked?: boolean;
  viewer_has_saved?: boolean;
  viewer_poll_vote?: number | null;
  group_id?: string | null;
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
  source?: "cohere" | "fallback" | null;
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

function mapComment(item: CommunityCommentApi): CommunityComment {
  return {
    id: item.id,
    userId: item.user_id,
    text: item.text,
    time: item.time,
    likes: item.likes,
    isOfficial: item.is_official,
    isAiGenerated: item.is_ai_generated,
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
    };
  }

  return {
    ...base,
    type: "text",
    content: item.content || "",
  };
}

function mapMutation(item: CommunityMutationApi): CommunityMutationData {
  return {
    post: mapPost(item.post),
    assistantComment: item.assistant_comment ? mapComment(item.assistant_comment) : null,
    assistantReplied: item.assistant_replied,
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
    users: payload.profiles.map((item) => ({
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
    })),
    posts: payload.posts.map(mapPost),
    groups: (payload.groups || []).map(mapGroup),
    eventsCalendar: (payload.events_calendar || []).map(mapEventCalendar),
    notifications: (payload.notifications || []).map(mapNotification),
    unreadNotifications: payload.unread_notifications ?? 0,
    ads: (payload.ads || []).map(mapAd),
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
    messages: payload.messages.map((item) => ({
      id: item.id,
      from: item.from_role,
      text: item.text,
      time: item.time,
    })),
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
    messages: payload.messages.map((item) => ({
      id: item.id,
      from: item.from_role,
      text: item.text,
      time: item.time,
    })),
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
  createdByProfileId: string | null;
  createdAt: string;
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
