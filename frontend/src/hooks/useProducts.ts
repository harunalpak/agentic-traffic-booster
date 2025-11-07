import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Product, CreateProductDto, UpdateProductDto, PresignedUrlResponse } from '@/types/product';

// Fetch all products
export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products');
      return data;
    },
  });
};

// Fetch single product
export const useProduct = (id: number) => {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Search products
export const useSearchProducts = (keyword: string) => {
  return useQuery<Product[]>({
    queryKey: ['products', 'search', keyword],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>(`/products/search?keyword=${encodeURIComponent(keyword)}`);
      return data;
    },
    enabled: keyword.length >= 2,
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: CreateProductDto) => {
      const { data } = await apiClient.post<Product>('/products', product);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, product }: { id: number; product: UpdateProductDto }) => {
      const { data } = await apiClient.put<Product>(`/products/${id}`, product);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Get presigned URL for image upload
export const usePresignedUrl = () => {
  return useMutation({
    mutationFn: async ({ fileName, contentType }: { fileName: string; contentType?: string }) => {
      const { data } = await apiClient.post<PresignedUrlResponse>('/products/upload-url', {
        fileName,
        contentType: contentType || 'image/jpeg',
      });
      return data.presignedUrl;
    },
  });
};

