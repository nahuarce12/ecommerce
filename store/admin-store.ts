import { create } from 'zustand';
import { Product, Category } from '@/types';

interface AdminStore {
  // Dialog states
  productDialogOpen: boolean;
  categoryDialogOpen: boolean;
  deleteDialogOpen: boolean;
  
  // Selected items for editing
  selectedProduct: Product | null;
  selectedCategory: Category | null;
  
  // Bulk operations
  bulkSelectedIds: string[];
  
  // Filters and search
  searchQuery: string;
  categoryFilter: string | null;
  statusFilter: string | null;
  
  // Actions
  setProductDialogOpen: (open: boolean) => void;
  setCategoryDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedCategory: (category: Category | null) => void;
  toggleBulkSelect: (id: string) => void;
  clearBulkSelect: () => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setStatusFilter: (status: string | null) => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  productDialogOpen: false,
  categoryDialogOpen: false,
  deleteDialogOpen: false,
  selectedProduct: null,
  selectedCategory: null,
  bulkSelectedIds: [],
  searchQuery: '',
  categoryFilter: null,
  statusFilter: null,
  
  // Actions
  setProductDialogOpen: (open) => set({ productDialogOpen: open }),
  setCategoryDialogOpen: (open) => set({ categoryDialogOpen: open }),
  setDeleteDialogOpen: (open) => set({ deleteDialogOpen: open }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  toggleBulkSelect: (id) => {
    const { bulkSelectedIds } = get();
    if (bulkSelectedIds.includes(id)) {
      set({ bulkSelectedIds: bulkSelectedIds.filter(selectedId => selectedId !== id) });
    } else {
      set({ bulkSelectedIds: [...bulkSelectedIds, id] });
    }
  },
  
  clearBulkSelect: () => set({ bulkSelectedIds: [] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));
