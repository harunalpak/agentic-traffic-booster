import { create } from 'zustand';

interface UiState {
  // Modal states
  isProductModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedProductId: number | null;
  
  // Filters
  searchKeyword: string;
  selectedCategory: string | null;
  
  // Actions
  openProductModal: (productId?: number) => void;
  closeProductModal: () => void;
  openDeleteModal: (productId: number) => void;
  closeDeleteModal: () => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedCategory: (category: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  // Initial state
  isProductModalOpen: false,
  isDeleteModalOpen: false,
  selectedProductId: null,
  searchKeyword: '',
  selectedCategory: null,
  
  // Actions
  openProductModal: (productId?: number) =>
    set({ isProductModalOpen: true, selectedProductId: productId || null }),
  
  closeProductModal: () =>
    set({ isProductModalOpen: false, selectedProductId: null }),
  
  openDeleteModal: (productId: number) =>
    set({ isDeleteModalOpen: true, selectedProductId: productId }),
  
  closeDeleteModal: () =>
    set({ isDeleteModalOpen: false, selectedProductId: null }),
  
  setSearchKeyword: (keyword: string) =>
    set({ searchKeyword: keyword }),
  
  setSelectedCategory: (category: string | null) =>
    set({ selectedCategory: category }),
}));

