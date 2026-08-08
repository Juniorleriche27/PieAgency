import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticatedFetch } = vi.hoisted(() => ({ authenticatedFetch: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authenticatedFetch }));

import { getPrivateDiagnostic } from "./private-diagnostic";
import { fetchPrivateResources } from "./private-resources";

describe("private space API truthfulness", () => {
  beforeEach(() => authenticatedFetch.mockReset());

  it("ne remplace pas une panne diagnostic par un faux résultat", async () => {
    authenticatedFetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(getPrivateDiagnostic()).rejects.toThrow("Impossible de charger le diagnostic");
  });

  it("charge uniquement les métadonnées de ressources renvoyées par le backend", async () => {
    authenticatedFetch.mockResolvedValue({ ok: true, json: async () => ({ resources: [{ id: "res-1", title: "Guide", description: "Aperçu", category: "Visa", resource_type: "guide", badge_label: "Guide", action_label: "Ouvrir", access_level: "premium" }] }) });
    const resources = await fetchPrivateResources();
    expect(resources).toHaveLength(1);
    expect(resources[0].title).toBe("Guide");
    expect(authenticatedFetch).toHaveBeenCalledWith("/api/private/resources", { cache: "no-store" }, { requireAuth: true });
  });
});
