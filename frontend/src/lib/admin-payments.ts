import { authenticatedFetch } from "@/lib/auth";
import { fetchPrivatePaymentConfig, type PrivatePaymentConfig } from "@/lib/private-subscriptions";

export type AdminPaymentStatus = {
  provider: "maketou";
  cart_id: string;
  status: "waiting_payment" | "completed" | "abandoned" | "payment_failed" | "unknown";
  message: string;
  payment_id?: string | null;
  reference?: string | null;
};

export async function fetchAdminPaymentConfig(): Promise<PrivatePaymentConfig> {
  return fetchPrivatePaymentConfig();
}

export async function fetchAdminPaymentStatus(cartId: string): Promise<AdminPaymentStatus> {
  const response = await authenticatedFetch(
    `/api/payments/maketou/carts/${encodeURIComponent(cartId)}`,
    { cache: "no-store" },
    { requireAuth: true },
  );

  const payload = (await response.json().catch(() => null)) as
    | ({ detail?: string } & AdminPaymentStatus)
    | null;

  if (!response.ok) {
    throw new Error(payload?.detail ?? "Impossible de verifier ce paiement.");
  }
  if (!payload) {
    throw new Error("MakeTou n'a pas retourne de statut exploitable.");
  }

  return payload;
}

export async function downloadAdminPaymentRelatedExport(datasetKey: string) {
  const response = await authenticatedFetch(
    `/api/admin/exports/${datasetKey}?format=csv`,
    undefined,
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de generer l'export.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pieagency-${datasetKey}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
