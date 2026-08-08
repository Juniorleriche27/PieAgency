import { authenticatedFetch } from "@/lib/auth";

export type PrivateResourceType = "guide" | "template" | "video" | "checklist" | "example" | "exercise" | "link";
export type PrivateResourceAccessLevel = "free" | "student" | "premium";
export type PrivateResourceVideo = { id: string; title: string; url: string; provider: "youtube"; source_label?: string | null };
export type PrivateResource = {
  id: string; title: string; description: string; category: string;
  resource_type: PrivateResourceType; badge_label: string; action_label: string;
  duration_label?: string | null; access_level: PrivateResourceAccessLevel;
  url?: string | null; slug?: string | null; is_active?: boolean;
  publication_status?: "published" | "draft" | "archived";
  video_url?: string | null; video_title?: string | null; video_provider?: string | null;
  sidebar_videos?: PrivateResourceVideo[];
};
export type PrivateResourceSectionType = "preview" | "paywall" | "chapter" | "timeline" | "checklist" | "mistakes" | "video" | "example" | "exercise" | "sources";
export type PrivateResourceSection = {
  id: string; screen_number: number; section_type: PrivateResourceSectionType;
  title: string; subtitle?: string | null; body?: string | null; items: string[];
  is_preview?: boolean; is_locked?: boolean; video_url?: string | null;
  video_title?: string | null; video_provider?: string | null; video_source_label?: string | null;
};
export type PrivateResourceDetail = {
  id: string; title: string; slug: string; description: string; category: string;
  resource_type: "tunnel_guide"; access_mode: "preview_free_then_paid";
  badge_label: string; action_label: string; reading_minutes: number;
  current_screen: number; total_screens: number; has_access: boolean;
  requires_payment: boolean; checkout_service_slug?: string | null;
  watermark_label: string; sections: PrivateResourceSection[];
  sidebar_videos?: PrivateResourceVideo[];
};

type PrivateResourceListResponse = { resources: PrivateResource[] };

export const RESOURCE_CATEGORIES = ["Tous", "Campus France", "Visa", "Lettres", "Projet d'études", "Projet professionnel", "Entretien", "Écoles privées", "Belgique", "CV", "Financement", "Motivation", "Dossier"] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export async function fetchPrivateResources(): Promise<PrivateResource[]> {
  const response = await authenticatedFetch("/api/private/resources", { cache: "no-store" }, { requireAuth: true });
  if (!response.ok) throw new Error("Impossible de charger les ressources.");
  return ((await response.json()) as PrivateResourceListResponse).resources;
}

export async function fetchPrivateResourceDetail(slug: string): Promise<PrivateResourceDetail> {
  const response = await authenticatedFetch(`/api/private/resources/${encodeURIComponent(slug)}`, { cache: "no-store" }, { requireAuth: true });
  if (!response.ok) {
    if (response.status === 404) throw new Error("RESOURCE_NOT_FOUND");
    throw new Error("Impossible de charger cette ressource.");
  }
  return (await response.json()) as PrivateResourceDetail;
}
