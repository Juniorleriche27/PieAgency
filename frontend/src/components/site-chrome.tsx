"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteAssistantSpotlight } from "@/components/site-assistant-spotlight";
import { SiteChatbot } from "@/components/site-chatbot";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isCommunityRoute = pathname === "/communaute";
  const isPrivateRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/espace-etudiant" ||
    pathname.startsWith("/espace-etudiant/");
  const useMinimalChrome = isCommunityRoute || isPrivateRoute;
  const showConversionBar = !useMinimalChrome && pathname !== "/contact" && pathname !== "/paiement";

  return (
    <>
      {useMinimalChrome ? null : <SiteHeader />}
      <main>{children}</main>
      {showConversionBar ? (
        <div className="conversion-sticky-bar" role="region" aria-label="Action rapide PieAgency">
          <div>
            <strong>Besoin d’un plan clair ?</strong>
            <span>Diagnostic, inscription, contact, accompagnement.</span>
          </div>
          <Link href="/contact?source=sticky&intent=diagnostic">Diagnostic gratuit</Link>
        </div>
      ) : null}
      {useMinimalChrome ? null : <SiteAssistantSpotlight />}
      {useMinimalChrome ? null : <SiteFooter />}
      {useMinimalChrome ? null : <SiteChatbot />}
    </>
  );
}
