import { notFound } from "next/navigation";
import { getAllProductIds, getProduct } from "@/lib/private-products";
import { ProductDetailView } from "@/components/private/product-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getAllProductIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  // Swap getProduct() body for GET /api/private/products/{id} when backend is ready
  const product = await getProduct(id);
  return {
    title: product
      ? `${product.title} | Produits — PieAgency`
      : "Produit introuvable | PieAgency",
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
