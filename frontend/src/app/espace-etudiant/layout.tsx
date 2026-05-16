import { PrivatePortalShell } from "@/components/private/private-portal-shell";

export default function StudentPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PrivatePortalShell requiredRole="student">{children}</PrivatePortalShell>
  );
}
