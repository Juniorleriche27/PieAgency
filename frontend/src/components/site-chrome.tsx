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

  return (
    <>
      {isCommunityRoute ? null : <SiteHeader />}
      <main>{children}</main>
      {isCommunityRoute ? null : <SiteAssistantSpotlight />}
      {isCommunityRoute ? null : <SiteFooter />}
      {isCommunityRoute ? null : <SiteChatbot />}
    </>
  );
}
