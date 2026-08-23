import { AssistantGenieBubble } from "@/components/private/assistant-genie-bubble";
import { PrivatePortalShell } from "@/components/private/private-portal-shell";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export default function StudentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PrivatePortalShell requiredRole="student">{children}</PrivatePortalShell>
      <AssistantGenieBubble />
      <PwaInstallPrompt />
    </>
  );
}
