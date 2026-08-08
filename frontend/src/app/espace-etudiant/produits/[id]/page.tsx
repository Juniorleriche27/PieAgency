import { ProductDetailView } from "@/components/private/product-detail-view";

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}
