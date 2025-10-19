import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../../types'

interface CartState {
  items: CartItem[]
  
  addItem: (item: CartItem) => void
  removeItem: (tourId: string, tourDateId: string) => void
  updateQuantity: (tourId: string, tourDateId: string, participants: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existingIndex = state.items.findIndex(
          (i) => i.tour_id === item.tour_id && i.tour_date_id === item.tour_date_id
        )
        
        if (existingIndex >= 0) {
          const newItems = [...state.items]
          newItems[existingIndex] = item
          return { items: newItems }
        }
        
        return { items: [...state.items, item] }
      }),
      
      removeItem: (tourId, tourDateId) => set((state) => ({
        items: state.items.filter(
          (item) => !(item.tour_id === tourId && item.tour_date_id === tourDateId)
        ),
      })),
      
      updateQuantity: (tourId, tourDateId, participants) => set((state) => ({
        items: state.items.map((item) =>
          item.tour_id === tourId && item.tour_date_id === tourDateId
            ? { ...item, participants }
            : item
        ),
      })),
      
      clearCart: () => set({ items: [] }),
      
      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.price * item.participants, 0)
      },
      
      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.participants, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
