export type DocumentStatus = "not-started" | "in-progress" | "to-review" | "validated";
export type DocumentPriority = "high" | "medium" | "low";

export type CandidateDocument = {
  id: string;
  title: string;
  status: DocumentStatus;
  lastUpdated?: string;
  priority?: DocumentPriority;
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

// TODO: replace body with:
// const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/private/documents`, {
//   headers: { Authorization: `Bearer ${token}` },
//   cache: "no-store",
// });
// return res.ok ? (await res.json()) as CandidateDocument[] : [];
export async function getDocuments(): Promise<CandidateDocument[]> {
  return MOCK_DOCUMENTS;
}
