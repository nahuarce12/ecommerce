import { create } from 'zustand'
import { Product } from '@/types'

type Filter = "NEW" | "CLOTHES" | "ACCESSORIES" | "ORDERS";

interface UIState {
  selectedProduct: Product | null
  isCartOpen: boolean
  selectedFilter: Filter
  setSelectedProduct: (product: Product | null) => void
  toggleCart: () => void
  setSelectedFilter: (filter: Filter) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedProduct: null,
  isCartOpen: false,
  selectedFilter: "NEW",
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
}))
