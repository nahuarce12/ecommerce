import { create } from 'zustand'
import { Product } from '@/types'

interface UIState {
  selectedProduct: Product | null
  isCartOpen: boolean
  setSelectedProduct: (product: Product | null) => void
  toggleCart: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedProduct: null,
  isCartOpen: false,
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
}))
