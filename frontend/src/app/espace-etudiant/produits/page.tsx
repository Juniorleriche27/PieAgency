import { ProductsCatalogue } from "@/components/private/products-catalogue";
import { getProducts } from "@/lib/private-products";

export const metadata = {
  title: "Produits digitaux | Espace étudiant — PieAgency",
};

export default async function StudentProductsPage() {
  const products = await getProducts();

  return <ProductsCatalogue products={products} />;
}
