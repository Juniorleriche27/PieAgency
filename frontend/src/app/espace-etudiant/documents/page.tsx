import { DocumentsView } from "@/components/private/documents-view";

export const metadata = {
  title: "Mes documents | Espace étudiant — PieAgency",
};

export default function StudentDocumentsPage() {
  return <DocumentsView documents={[]} />;
}
