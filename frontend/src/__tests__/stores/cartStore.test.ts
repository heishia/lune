/**
 * Cart Store 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../../stores/cartStore';

describe('CartStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useCartStore.setState({
      items: [],
      isOpen: false,
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', () => {
      const item = {
        productId: 1,
        quantity: 2,
        color: 'Black',
        size: 'M',
      };

      useCartStore.getState().addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toEqual(item);
    });

    it('should increase quantity for existing item', () => {
      const item = {
        productId: 1,
        quantity: 2,
        color: 'Black',
        size: 'M',
      };

      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(4);
    });

    it('should add separate items for different colors', () => {
      const item1 = { productId: 1, quantity: 1, color: 'Black', size: 'M' };
      const item2 = { productId: 1, quantity: 1, color: 'White', size: 'M' };

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      useCartStore.setState({
        items: [{ productId: 1, quantity: 2, color: 'Black', size: 'M' }],
        isOpen: false,
      });

      useCartStore.getState().removeItem(1, 'Black', 'M');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity', () => {
      useCartStore.setState({
        items: [{ productId: 1, quantity: 2, color: 'Black', size: 'M' }],
        isOpen: false,
      });

      useCartStore.getState().updateQuantity(1, 5, 'Black', 'M');

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0 or less', () => {
      useCartStore.setState({
        items: [{ productId: 1, quantity: 2, color: 'Black', size: 'M' }],
        isOpen: false,
      });

      useCartStore.getState().updateQuantity(1, 0, 'Black', 'M');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items', () => {
      useCartStore.setState({
        items: [
          { productId: 1, quantity: 2, color: 'Black', size: 'M' },
          { productId: 2, quantity: 1, color: 'White', size: 'L' },
        ],
        isOpen: false,
      });

      useCartStore.getState().clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('cart modal', () => {
    it('should open cart', () => {
      useCartStore.getState().openCart();
      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it('should close cart', () => {
      useCartStore.setState({ items: [], isOpen: true });
      useCartStore.getState().closeCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });

    it('should toggle cart', () => {
      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isOpen).toBe(true);

      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });

  describe('getItemCount', () => {
    it('should return total item count', () => {
      useCartStore.setState({
        items: [
          { productId: 1, quantity: 2, color: 'Black', size: 'M' },
          { productId: 2, quantity: 3, color: 'White', size: 'L' },
        ],
        isOpen: false,
      });

      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(0);
    });
  });
});

