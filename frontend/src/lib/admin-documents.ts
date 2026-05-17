import { authenticatedFetch } from "@/lib/auth";
import type { CandidateDocument, DocumentStatus } from "@/lib/private-documents";

type AdminDocumentApiItem = {
  id: string;
  name: string;
  status: "approved" | "review" | "missing" | "rejected";
  note: string;
};

type AdminDocumentListResponse = {
  documents: AdminDocumentApiItem[];
};

function mapStatus(s: AdminDocumentApiItem["status"]): DocumentStatus {
  if (s === "approved") return "validated";
  if (s === "review") return "to-review";
  if (s === "rejected") return "rejected";
  return "not-started";
}

function toDoc(item: AdminDocumentApiItem, index: number): CandidateDocument {
  return {
    id: item.id,
    title: item.name,
    status: mapStatus(item.status),
    lastUpdated: item.note || undefined,
    note: item.note || undefined,
    priority: index < 4 ? "high" : "medium",
  };
}

function toApiStatus(s: DocumentStatus): AdminDocumentApiItem["status"] {
  if (s === "validated") return "approved";
  if (s === "to-review") return "review";
  if (s === "rejected") return "rejected";
  return "missing";
}

export async function fetchCandidateDocuments(userId: string): Promise<CandidateDocument[]> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/candidates/${userId}/documents`,
      { cache: "no-store" },
      { requireAuth: true },
    );
    if (!res.ok) throw new Error();
    const payload = (await res.json()) as AdminDocumentListResponse;
    return payload.documents.map(toDoc);
  } catch {
    return [];
  }
}

export async function adminAddDocument(userId: string, name: string): Promise<CandidateDocument | null> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/candidates/${userId}/documents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
      { requireAuth: true },
    );
    if (!res.ok) throw new Error();
    const item = (await res.json()) as AdminDocumentApiItem;
    return toDoc(item, 0);
  } catch {
    return null;
  }
}

export async function adminUpdateDocumentStatus(
  userId: string,
  docId: string,
  status: DocumentStatus,
  note?: string,
): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/candidates/${userId}/documents/${docId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toApiStatus(status), note: note ?? "" }),
      },
      { requireAuth: true },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminDeleteDocument(userId: string, docId: string): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/candidates/${userId}/documents/${docId}`,
      { method: "DELETE" },
      { requireAuth: true },
    );
    return res.ok;
  } catch {
    return false;
  }
}
