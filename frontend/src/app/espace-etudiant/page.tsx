import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { StudentSpaceView } from "@/components/student-space-view";

export const metadata: Metadata = {
  title: "Espace etudiant",
  description:
    "Suivi du dossier etudiant PieAgency, progression, documents et consignes.",
};

export default function StudentSpacePage() {
  return (
    <>
      <PageHero
        breadcrumb="Espace etudiant"
        description="Un espace personnel pour suivre le dossier, comprendre les prochaines etapes et centraliser les retours de PieAgency."
        title="Mon espace etudiant"
      />

      <section className="section">
        <div className="container">
          <StudentSpaceView />
        </div>
      </section>
    </>
  );
}
