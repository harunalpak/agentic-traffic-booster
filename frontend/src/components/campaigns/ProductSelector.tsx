"use client";

import { useState } from "react";
import { Search, Check } from "lucide-react";
import { useProductsLite } from "@/hooks/useProductsLite";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/product";

interface ProductSelectorProps {
  onSelect: (productId: number) => void;
  selectedId?: number | null;
}

export function ProductSelector({ onSelect, selectedId }: ProductSelectorProps) {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProductsLite(search);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : products && products.length > 0 ? (
          products.map((product: Product) => (
            <Card
              key={product.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedId === product.id && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(product.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${product.price?.toFixed(2) || "—"}
                  </p>
                </div>
                {selectedId === product.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No products found. Try a different search.
          </div>
        )}
      </div>
    </div>
  );
}

