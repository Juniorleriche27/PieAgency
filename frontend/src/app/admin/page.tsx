import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin-dashboard-view";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Interface admin PieAgency pour gerer les leads, les dossiers et les actions.",
};

export default function AdminPage() {
  return <AdminDashboardView />;
}
