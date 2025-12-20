import { create } from 'zustand';

// UI 상태 타입
interface UIState {
  isSearchOpen: boolean;
  isLoading: boolean;
  
  // Actions
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSearchOpen: false,
  isLoading: false,

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
}));

