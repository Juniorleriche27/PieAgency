import type { Metadata } from "next";
import { CommunityNetwork } from "@/components/community-network";

export const metadata: Metadata = {
  title: "PieHUB",
  description:
    "PieHUB est l'espace communautaire de PieAgency pour suivre les conseils, les ressources et les echanges entre etudiants et conseillers.",
};

export default function CommunityPage() {
  return <CommunityNetwork />;
}
