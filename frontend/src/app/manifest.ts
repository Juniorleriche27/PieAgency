import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PieAgency — Espace étudiant",
    short_name: "PieAgency",
    description:
      "Votre accompagnement étudiant en France et en Belgique, toujours à portée de main.",
    start_url: "/espace-etudiant",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fafaf8",
    theme_color: "#0d1b38",
    categories: ["education", "productivity"],
    lang: "fr",
    icons: [
      {
        src: "/icons/pieagency-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pieagency-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pieagency-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
