"use client";

import Link from "next/link";
import { CreditCard, Download, Search, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import {
  downloadAdminPaymentRelatedExport,
  fetchAdminPaymentConfig,
  fetchAdminPaymentStatus,
  type AdminPaymentStatus,
} from "@/lib/admin-payments";
import type { PrivatePaymentConfig } from "@/lib/private-subscriptions";

const paymentExports = [
  { key: "student_cases", label: "Dossiers etudiants" },
  { key: "contact_requests", label: "Demandes contact" },
  { key: "profiles", label: "Profils plateforme" },
];

function statusLabel(status: AdminPaymentStatus["status"]) {
  const labels: Record<AdminPaymentStatus["status"], string> = {
    waiting_payment: "En attente",
    completed: "Complete",
    abandoned: "Abandonne",
    payment_failed: "Echec",
    unknown: "Inconnu",
  };
  return labels[status];
}

export function AdminPaymentsView() {
  const [config, setConfig] = useState<PrivatePaymentConfig | null>(null);
  const [cartId, setCartId] = useState("");
  const [statusResult, setStatusResult] = useState<AdminPaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await fetchAdminPaymentConfig();
        if (active) {
          setConfig(payload);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger la configuration paiement.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadConfig();
    return () => {
      active = false;
    };
  }, []);

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCartId = cartId.trim();
    if (!normalizedCartId) {
      return;
    }

    setIsChecking(true);
    setErrorMessage("");
    setStatusResult(null);

    try {
      setStatusResult(await fetchAdminPaymentStatus(normalizedCartId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de verifier ce paiement.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleExport(datasetKey: string) {
    setExportingKey(datasetKey);
    setErrorMessage("");

    try {
      await downloadAdminPaymentRelatedExport(datasetKey);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de generer l'export.",
      );
    } finally {
      setExportingKey(null);
    }
  }

  return (
    <div className="admin-payments-page">
      <section className="admin-payments-hero">
        <div>
          <span>Pilotage paiement</span>
          <h1>Paiements</h1>
          <p>
            Suivez la configuration MakeTou, verifiez un panier par identifiant et
            exportez les donnees utiles au rapprochement manuel.
          </p>
        </div>
        <div className="admin-payments-status">
          <CreditCard size={20} />
          <strong>{config?.enabled ? "MakeTou actif" : "Configuration incomplete"}</strong>
          <span>{config?.display_currency ?? "Devise inconnue"}</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-payments-metrics">
        <div>
          <span>Provider</span>
          <strong>{config?.provider ?? "MakeTou"}</strong>
        </div>
        <div>
          <span>Marchand</span>
          <strong>{config?.merchant_label ?? "Non charge"}</strong>
        </div>
        <div>
          <span>Status check</span>
          <strong>{config?.status_check_enabled ? "Actif" : "Inactif"}</strong>
        </div>
        <div>
          <span>Etat</span>
          <strong>{isLoading ? "Chargement" : config?.enabled ? "Pret" : "A configurer"}</strong>
        </div>
      </section>

      <div className="admin-payments-grid">
        <section className="admin-payments-card">
          <div className="admin-payments-card-head">
            <span>Verification panier</span>
            <h2>Rechercher un cart_id MakeTou</h2>
            <p>
              Entrez l&apos;identifiant de panier retourne par MakeTou pour recuperer
              son statut courant.
            </p>
          </div>

          <form className="admin-payments-form" onSubmit={handleStatusSubmit}>
            <label>
              <Search size={18} />
              <input
                onChange={(event) => setCartId(event.target.value)}
                placeholder="cart_id MakeTou"
                type="text"
                value={cartId}
              />
            </label>
            <button className="btn btn-primary" disabled={isChecking || !cartId.trim()} type="submit">
              {isChecking ? "Verification..." : "Verifier"}
            </button>
          </form>

          {statusResult ? (
            <div className="admin-payments-result">
              <div>
                <span>Statut</span>
                <strong className={`admin-payments-pill ${statusResult.status}`}>
                  {statusLabel(statusResult.status)}
                </strong>
              </div>
              <div>
                <span>Panier</span>
                <strong>{statusResult.cart_id}</strong>
              </div>
              <div>
                <span>Paiement</span>
                <strong>{statusResult.payment_id ?? "En attente"}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{statusResult.reference ?? "Non retournee"}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="admin-payments-card">
          <div className="admin-payments-card-head">
            <span>Exports rapprochement</span>
            <h2>Donnees utiles</h2>
            <p>
              Ces exports aident a rapprocher paiements, dossiers et profils tant
              qu&apos;un historique paiement dedie n&apos;existe pas.
            </p>
          </div>

          <div className="admin-payments-export-list">
            {paymentExports.map((item) => (
              <button
                disabled={exportingKey === item.key}
                key={item.key}
                onClick={() => void handleExport(item.key)}
                type="button"
              >
                <span>{item.label}</span>
                <Download size={17} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-payments-note">
        <div>
          <span>Limite actuelle</span>
          <p>
            Le backend gere le checkout, la verification de panier et les recus,
            mais il ne stocke pas encore une table interne d&apos;historique paiement.
          </p>
        </div>
        <div className="admin-payments-note-actions">
          <Link className="btn btn-outline" href="/paiement">
            Page paiement
          </Link>
          <Link className="btn btn-green" href="/admin/abonnements">
            Voir abonnements
          </Link>
        </div>
      </section>

      <section className="admin-payments-safety">
        <ShieldCheck size={20} />
        <p>
          Les montants doivent rester ceux valides avec un conseiller PieAgency.
          Eviter de promettre un paiement confirme sans statut MakeTou complet.
        </p>
      </section>
    </div>
  );
}
