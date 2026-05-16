import { getDocuments } from "@/lib/private-documents";
import { DocumentsView } from "@/components/private/documents-view";

export const metadata = {
  title: "Mes documents | Espace étudiant — PieAgency",
};

export default async function StudentDocumentsPage() {
  // Swap getDocuments() body for GET /api/private/documents when backend is ready
  const documents = await getDocuments();
  return <DocumentsView documents={documents} />;
}
