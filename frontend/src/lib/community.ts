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

function normalizeTag(tag: string): CommunityTag {
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
  return "temoignage";
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
  return {
    id: item.id,
    userId: item.user_id,
    tag: normalizeTag(item.tag),
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
