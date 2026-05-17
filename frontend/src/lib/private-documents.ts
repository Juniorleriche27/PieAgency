import { authenticatedFetch } from "@/lib/auth";

export type DocumentStatus = "not-started" | "in-progress" | "to-review" | "validated";
export type DocumentPriority = "high" | "medium" | "low";

export type CandidateDocument = {
  id: string;
  title: string;
  status: DocumentStatus;
  lastUpdated?: string;
  priority?: DocumentPriority;
};

type StudentDocumentApiItem = {
  name: string;
  status: "approved" | "review" | "missing";
  note: string;
};

type StudentDocumentListResponse = {
  documents: StudentDocumentApiItem[];
};

const MOCK_DOCUMENTS: CandidateDocument[] = [
  { id: "doc-001", title: "CV", status: "validated", lastUpdated: "2025-05-10", priority: "high" },
  { id: "doc-002", title: "Projet d'études", status: "in-progress", lastUpdated: "2025-05-14", priority: "high" },
  { id: "doc-003", title: "Projet professionnel", status: "not-started", priority: "high" },
  { id: "doc-004", title: "Lettres de motivation", status: "in-progress", lastUpdated: "2025-05-12", priority: "high" },
  { id: "doc-005", title: "Relevés de notes", status: "validated", lastUpdated: "2025-05-08", priority: "medium" },
  { id: "doc-006", title: "Admission", status: "not-started", priority: "medium" },
  { id: "doc-007", title: "Justificatif hébergement", status: "to-review", lastUpdated: "2025-05-13", priority: "medium" },
  { id: "doc-008", title: "Justificatif financement", status: "not-started", priority: "high" },
  { id: "doc-009", title: "Passeport", status: "validated", lastUpdated: "2025-05-01", priority: "high" },
  { id: "doc-010", title: "Documents visa", status: "not-started", priority: "medium" },
];

function mapDocumentStatus(status: StudentDocumentApiItem["status"]): DocumentStatus {
  if (status === "approved") {
    return "validated";
  }
  if (status === "review") {
    return "to-review";
  }
  return "not-started";
}

function toCandidateDocument(
  item: StudentDocumentApiItem,
  index: number,
): CandidateDocument {
  return {
    id: `doc-${index + 1}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: item.name,
    status: mapDocumentStatus(item.status),
    lastUpdated: item.status === "missing" ? undefined : item.note,
    priority: index < 4 ? "high" : "medium",
  };
}

export async function getDocuments(): Promise<CandidateDocument[]> {
  try {
    const response = await authenticatedFetch(
      "/api/private/documents",
      { cache: "no-store" },
      { requireAuth: true },
    );

    if (!response.ok) {
      throw new Error("Impossible de charger les documents.");
    }

    const payload = (await response.json()) as StudentDocumentListResponse;
    const docs = payload.documents.map(toCandidateDocument);
    return docs.length > 0 ? docs : MOCK_DOCUMENTS;
  } catch {
    return MOCK_DOCUMENTS;
  }
}

export async function addDocument(name: string): Promise<CandidateDocument | null> {
  try {
    const response = await authenticatedFetch(
      "/api/private/documents",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
      { requireAuth: true },
    );
    if (!response.ok) throw new Error();
    const item = (await response.json()) as StudentDocumentApiItem;
    return toCandidateDocument(item, Date.now());
  } catch {
    return null;
  }
}

export async function uploadDocumentFile(
  documentId: string,
  file: File,
): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("file", file);
    const response = await authenticatedFetch(
      `/api/private/documents/${documentId}/upload`,
      { method: "POST", body: form },
      { requireAuth: true },
    );
    return response.ok;
  } catch {
    return false;
  }
}
