import { getDocuments } from "@/lib/private-documents";
import { DocumentsView } from "@/components/private/documents-view";

export const metadata = {
  title: "Mes documents | Espace étudiant — PieAgency",
};

export default async function StudentDocumentsPage() {
  const documents = await getDocuments();
  return <DocumentsView documents={documents} />;
}
