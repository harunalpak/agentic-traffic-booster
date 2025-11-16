export interface Product {
  id: number;
  title: string;
  description?: string;
  bullets?: string[];
  imageUrl?: string;
  productUrl?: string;
  price: number;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  title: string;
  description?: string;
  bullets?: string[];
  imageUrl?: string;
  productUrl?: string;
  price: number;
  tags?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface PresignedUrlResponse {
  presignedUrl: string;
}

// Lite version for pickers/dropdowns
export interface ProductLite {
  id: number;
  title: string;
  imageUrl?: string;
  productUrl?: string;
  price?: number;
}

