"use client";

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

  return (
    <>
      {useMinimalChrome ? null : <SiteHeader />}
      <main>{children}</main>
      {useMinimalChrome ? null : <SiteAssistantSpotlight />}
      {useMinimalChrome ? null : <SiteFooter />}
      {useMinimalChrome ? null : <SiteChatbot />}
    </>
  );
}
