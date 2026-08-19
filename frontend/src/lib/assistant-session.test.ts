import { afterEach, describe, expect, it, vi } from "vitest";

import { getAssistantOrigin, revokeAssistantSession } from "@/lib/assistant-session";

describe("assistant session bridge", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses the configured Assistant origin", () => {
    vi.stubEnv("NEXT_PUBLIC_ASSISTANT_BASE_URL", "https://assistant.example.test/");
    expect(getAssistantOrigin()).toBe("https://assistant.example.test");
  });

  it("revokes the Assistant cookie without blocking PieAgency", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASSISTANT_BASE_URL", "https://assistant.example.test");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    await revokeAssistantSession();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://assistant.example.test/api/v1/auth/logout",
      { method: "POST", credentials: "include" },
    );
  });
});
