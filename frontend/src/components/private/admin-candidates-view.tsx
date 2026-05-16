"use client";

import { Download, Eye, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth";
import { fetchAdminCandidates, type AdminCandidate } from "@/lib/admin-candidates";

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("actif")) {
    return "active";
  }
  if (normalized.includes("lead")) {
    return "lead";
  }
  return "closed";
}

function sourceLabel(source: AdminCandidate["source"]) {
  return source === "case" ? "Dossier" : "Lead";
}

export function AdminCandidatesView() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await fetchAdminCandidates();
        if (active) {
          setCandidates(payload);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les candidats.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCandidates();
    return () => {
      active = false;
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return candidates;
    }

    return candidates.filter((candidate) =>
      [
        candidate.full_name,
        candidate.email ?? "",
        candidate.phone ?? "",
        candidate.country,
        candidate.procedure,
        candidate.stage,
        candidate.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [candidates, query]);

  const selectedCandidates = filteredCandidates.filter((candidate) =>
    selectedIds.includes(candidate.id),
  );

  function toggleSelect(candidateId: string) {
    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter((item) => item !== candidateId)
        : [...current, candidateId],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredCandidates.map((candidate) => candidate.id));
  }

  async function downloadCandidatesExport() {
    setIsExporting(true);
    setErrorMessage("");

    try {
      const response = await authenticatedFetch(
        "/api/admin/exports/contact_requests?format=csv",
        undefined,
        { requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de generer l'export candidats.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pieagency-candidats.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de generer l'export candidats.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="admin-candidates-page">
      <section className="admin-candidates-hero">
        <div>
          <span>Cockpit admin</span>
          <h1>Gestion des candidats</h1>
          <p>
            Consultez les leads entrants et les dossiers actifs dans une vue
            exploitable par l&apos;equipe PieAgency.
          </p>
        </div>
        <div className="admin-candidates-count">
          <Users size={20} />
          <strong>{filteredCandidates.length}</strong>
          <span>profil(s)</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-candidates-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom, pays, procedure..."
            type="search"
            value={query}
          />
        </label>
        <button
          className="btn btn-outline"
          disabled={isExporting}
          onClick={() => void downloadCandidatesExport()}
          type="button"
        >
          <Download size={17} />
          {isExporting ? "Export..." : "Exporter"}
        </button>
      </section>

      <section className="admin-candidates-table-card">
        {isLoading ? (
          <div className="admin-candidates-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredCandidates.length ? (
          <div className="admin-candidates-table-wrap">
            <table className="admin-candidates-table">
              <thead>
                <tr>
                  <th>
                    <input
                      checked={
                        filteredCandidates.length > 0 &&
                        selectedIds.length === filteredCandidates.length
                      }
                      onChange={toggleSelectAll}
                      type="checkbox"
                    />
                  </th>
                  <th>Nom</th>
                  <th>Procedure</th>
                  <th>Etape</th>
                  <th>Acces</th>
                  <th>Statut</th>
                  <th>Recu</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <input
                        checked={selectedIds.includes(candidate.id)}
                        onChange={() => toggleSelect(candidate.id)}
                        type="checkbox"
                      />
                    </td>
                    <td>
                      <strong>{candidate.full_name}</strong>
                      <span>{candidate.email || candidate.phone || "Contact non renseigne"}</span>
                      <small>{candidate.country}</small>
                    </td>
                    <td>{candidate.procedure}</td>
                    <td>
                      <span className="admin-candidates-chip">{candidate.stage}</span>
                    </td>
                    <td>{candidate.subscription}</td>
                    <td>
                      <span className={`admin-candidates-status ${statusClass(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td>
                      <span>{candidate.created_at_label}</span>
                      <small>{sourceLabel(candidate.source)}</small>
                    </td>
                    <td>
                      <button aria-label="Voir le profil" type="button">
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !filteredCandidates.length ? (
          <div className="portal-empty">
            Aucun candidat ne correspond a cette recherche.
          </div>
        ) : null}
      </section>

      {selectedCandidates.length ? (
        <section className="admin-candidates-selection">
          <strong>
            {selectedCandidates.length} candidat
            {selectedCandidates.length > 1 ? "s" : ""} selectionne
            {selectedCandidates.length > 1 ? "s" : ""}
          </strong>
          <span>
            Les actions de masse seront activees apres ajout des endpoints email
            et moderation candidats.
          </span>
        </section>
      ) : null}
    </div>
  );
}
