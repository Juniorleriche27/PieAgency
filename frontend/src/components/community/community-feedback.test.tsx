import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityStatus, CommunityToastRegion } from "./community-feedback";

afterEach(cleanup);

describe("CommunityStatus", () => {
  it("annonce le chargement sans afficher de contenu fictif", () => {
    render(<CommunityStatus state="loading" onRetry={() => undefined} />);
    expect(screen.getByRole("status").textContent).toContain("Connexion à PieHUB");
  });

  it("explique une panne et permet de réessayer", () => {
    const retry = vi.fn();
    render(<CommunityStatus state="error" onRetry={retry} />);
    expect(screen.getByRole("alert").textContent).toContain("momentanément indisponible");
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("ne rend aucun bandeau lorsque le fil est prêt", () => {
    const { container } = render(<CommunityStatus state="ready" onRetry={() => undefined} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("CommunityToastRegion", () => {
  it("annonce les notifications de manière accessible", () => {
    render(<CommunityToastRegion toasts={[{ id: 1, text: "Publication envoyée" }]} />);
    expect(screen.getByRole("status").textContent).toContain("Publication envoyée");
  });
});
