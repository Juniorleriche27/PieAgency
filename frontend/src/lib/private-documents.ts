import { authenticatedFetch } from "@/lib/auth";

export type DocumentStatus = "not-started" | "in-progress" | "to-review" | "validated" | "rejected";
export type DocumentPriority = "high" | "medium" | "low";
export type EducationLevel = "lycee" | "universite" | "bts" | "autre";
export type GradingSystem = "trimestre" | "semestre";

export type CandidateDocument = {
  id: string;
  title: string;
  status: DocumentStatus;
  lastUpdated?: string;
  priority?: DocumentPriority;
  note?: string;
};

export type CandidateProfile = {
  education_level: EducationLevel | null;
  grading_system: GradingSystem | null;
};

type StudentDocumentApiItem = {
  id?: string;
  name: string;
  status: "approved" | "review" | "missing" | "rejected";
  note: string;
};

type StudentDocumentListResponse = {
  documents: StudentDocumentApiItem[];
};

type ProfileApiResponse = {
  education_level: EducationLevel | null;
  grading_system: GradingSystem | null;
};

const MOCK_DOCUMENTS: CandidateDocument[] = [];

function mapDocumentStatus(status: StudentDocumentApiItem["status"]): DocumentStatus {
  if (status === "approved") return "validated";
  if (status === "review") return "to-review";
  if (status === "rejected") return "rejected";
  return "not-started";
}

function toCandidateDocument(item: StudentDocumentApiItem, index: number): CandidateDocument {
  return {
    id: item.id || `doc-${index + 1}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: item.name,
    status: mapDocumentStatus(item.status),
    lastUpdated: item.status === "missing" ? undefined : item.note || undefined,
    note: item.note || undefined,
    priority: index < 4 ? "high" : "medium",
  };
}

export async function getProfile(): Promise<CandidateProfile> {
  try {
    const response = await authenticatedFetch(
      "/api/private/profile",
      { cache: "no-store" },
      { requireAuth: true },
    );
    if (!response.ok) throw new Error();
    const data = (await response.json()) as ProfileApiResponse;
    return { education_level: data.education_level, grading_system: data.grading_system };
  } catch {
    return { education_level: null, grading_system: null };
  }
}

export async function updateProfile(patch: Partial<CandidateProfile>): Promise<boolean> {
  try {
    const response = await authenticatedFetch(
      "/api/private/profile",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      },
      { requireAuth: true },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function getDocuments(): Promise<CandidateDocument[]> {
  try {
    const response = await authenticatedFetch(
      "/api/private/documents",
      { cache: "no-store" },
      { requireAuth: true },
    );
    if (!response.ok) throw new Error();
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

export async function uploadDocumentFile(documentId: string, file: File): Promise<boolean> {
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
