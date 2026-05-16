import { PrivatePortalShell } from "@/components/private/private-portal-shell";

export default function AdminPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PrivatePortalShell requiredRole="admin">{children}</PrivatePortalShell>;
}
