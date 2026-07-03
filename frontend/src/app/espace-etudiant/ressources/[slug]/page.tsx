import { PrivateResourceTunnelView } from "@/components/private/private-resource-tunnel-view";

type ResourceTunnelPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ResourceTunnelPage({ params }: ResourceTunnelPageProps) {
  const { slug } = await params;
  return <PrivateResourceTunnelView slug={slug} />;
}
