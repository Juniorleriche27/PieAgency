import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityMobileNavigation } from "./community-mobile-navigation";

afterEach(cleanup);

describe("CommunityMobileNavigation", () => {
  it("indique l’onglet actif et transmet la nouvelle sélection", () => {
    const select = vi.fn();
    render(<CommunityMobileNavigation activeTab="feed" onSelect={select} />);

    expect(screen.getByRole("button", { name: "Fil" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: /Groupes/ }));
    expect(select).toHaveBeenCalledWith("groupes");
  });
});
