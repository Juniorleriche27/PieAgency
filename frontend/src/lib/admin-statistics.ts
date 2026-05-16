import { authenticatedFetch } from "@/lib/auth";

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "good" | "attention" | "info";
};

export type AdminCaseStat = {
  case_reference: string;
  student_name: string;
  track: string;
  stage: string;
  counselor: string;
  progress_percent: number;
  priority: "low" | "medium" | "high";
};

export type AdminTaskStat = {
  title: string;
  owner: string;
  due_label: string;
  status: "todo" | "in_progress" | "done";
};

export type AdminConversationStat = {
  conversation_id: string;
  title: string;
  user_label: string;
  page_path: string;
  message_count: number;
  status: string;
  updated_at_label: string;
};

export type AdminPageStat = {
  id: string;
  title: string;
  route_path: string;
  audience: "public" | "student" | "admin";
  is_published: boolean;
  updated_at_label: string;
};

export type AdminCommunityPostStat = {
  id: number;
  author_name: string;
  author_handle: string;
  post_type: "text" | "resource" | "poll";
  tag: string;
  excerpt: string;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  poll_votes_count: number;
  ai_reply_count: number;
  is_archived: boolean;
  created_at_label: string;
};

export type AdminStatisticsDashboard = {
  metrics: AdminMetric[];
  active_cases: AdminCaseStat[];
  tasks: AdminTaskStat[];
  recent_chats: AdminConversationStat[];
  managed_pages: AdminPageStat[];
  community_posts: AdminCommunityPostStat[];
};

export async function fetchAdminStatistics(): Promise<AdminStatisticsDashboard> {
  const response = await authenticatedFetch(
    "/api/admin/dashboard",
    { cache: "no-store" },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les statistiques admin.");
  }

  return (await response.json()) as AdminStatisticsDashboard;
}
