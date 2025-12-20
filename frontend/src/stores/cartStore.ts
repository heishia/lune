import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types/cart';

// 장바구니 상태 타입
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, color?: string, size?: string) => void;
  updateQuantity: (productId: number, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.color === newItem.color &&
              item.size === newItem.size
          );

          if (existingItemIndex >= 0) {
            // 이미 있는 상품이면 수량 증가
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }

          // 새 상품 추가
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId, color, size) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                (color === undefined || item.color === color) &&
                (size === undefined || item.size === size)
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, color, size) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, size);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId &&
            (color === undefined || item.color === color) &&
            (size === undefined || item.size === size)
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        // 실제로는 상품 가격 정보가 필요하므로 별도 계산 필요
        return 0;
      },
    }),
    {
      name: 'lune-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

