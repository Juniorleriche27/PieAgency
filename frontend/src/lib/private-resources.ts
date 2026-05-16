import { authenticatedFetch } from "@/lib/auth";

export type PrivateResourceType =
  | "guide"
  | "template"
  | "video"
  | "checklist"
  | "link";

export type PrivateResourceAccessLevel = "free" | "student" | "premium";

export type PrivateResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: PrivateResourceType;
  format_label: string;
  access_level: PrivateResourceAccessLevel;
  url?: string | null;
};

type PrivateResourceListResponse = {
  resources: PrivateResource[];
};

export async function fetchPrivateResources(): Promise<PrivateResource[]> {
  const response = await authenticatedFetch(
    "/api/private/resources",
    { cache: "no-store" },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les ressources privees.");
  }

  const payload = (await response.json()) as PrivateResourceListResponse;
  return payload.resources;
}
