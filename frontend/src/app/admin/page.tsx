import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { AdminDashboardView } from "@/components/admin-dashboard-view";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Interface admin PieAgency pour gerer les leads, les dossiers et les actions.",
};

export default function AdminPage() {
  return (
    <>
      <PageHero
        breadcrumb="Admin"
        description="Une interface interne pour suivre les leads, piloter les dossiers et organiser les actions de l'equipe."
        theme="gold"
        title="Tableau de bord admin"
      />

      <section className="section">
        <div className="container">
          <AdminDashboardView />
        </div>
      </section>
    </>
  );
}
