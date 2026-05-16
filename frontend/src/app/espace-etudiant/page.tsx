import type { Metadata } from "next";
import { StudentSpaceView } from "@/components/student-space-view";

export const metadata: Metadata = {
  title: "Espace etudiant",
  description:
    "Suivi du dossier etudiant PieAgency, progression, documents et consignes.",
};

export default function StudentSpacePage() {
  return <StudentSpaceView />;
}
