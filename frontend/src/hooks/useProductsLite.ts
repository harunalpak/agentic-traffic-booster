import { useQuery } from "@tanstack/react-query";
import { apiProducts } from "@/lib/api-client";
import type { Product } from "@/types/product";

export function useProductsLite(search?: string) {
  return useQuery<Product[]>({
    queryKey: ["products-lite", { search }],
    queryFn: async () => {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      return (await apiProducts.get(`/products${q}`)).data;
    },
  });
}

