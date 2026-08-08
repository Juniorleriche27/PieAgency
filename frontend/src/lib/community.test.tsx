import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticatedFetch } = vi.hoisted(() => ({ authenticatedFetch: vi.fn() }));

vi.mock("@/lib/auth", () => ({ authenticatedFetch }));

import { fetchCommunityBootstrap } from "./community";

describe("community API mapping", () => {
  beforeEach(() => authenticatedFetch.mockReset());

  it("conserve les permissions, fichiers, médias et stories du serveur", async () => {
    authenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        current_profile_id: "user:1",
        profiles: [{
          id: "user:1", name: "Awa", tag: "Étudiante", country: "Togo", city: "Lomé",
          bio: "", avatar: "AW", color: "#123456", followers: 0, following: 0, posts: 1, tags: [],
        }],
        posts: [{
          id: 12, user_id: "user:1", post_type: "resource", tag: "visa", time: "À l’instant",
          likes: 1, shares: 2, content: "Mon document", resource_name: "guide.pdf",
          resource_type: "pdf", resource_size: "20 Ko", resource_url: "https://files.test/guide.pdf",
          resource_mime_type: "application/pdf", media_urls: [], comments: [{
            id: 4, user_id: "user:1", text: "Merci", time: "À l’instant", likes: 2,
            viewer_has_liked: true, viewer_can_edit: true,
          }], viewer_can_edit: true,
        }],
        stories: [{
          id: "story-1", user_id: "user:1", content: "Bonjour", media_url: null,
          media_mime_type: null, created_at: "2026-08-08T10:00:00Z",
          expires_at: "2026-08-09T10:00:00Z", viewer_can_delete: true,
        }],
      }),
    });

    const result = await fetchCommunityBootstrap();
    const post = result.posts[0];
    expect(post.viewerCanEdit).toBe(true);
    expect(post.comments[0].viewerHasLiked).toBe(true);
    expect(post.comments[0].viewerCanEdit).toBe(true);
    expect(post.type === "resource" && post.resourceUrl).toBe("https://files.test/guide.pdf");
    expect(result.stories?.[0].viewerCanDelete).toBe(true);
  });
});
