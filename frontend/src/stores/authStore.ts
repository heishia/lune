import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getToken, getRefreshToken, getUserInfo, setToken, setRefreshToken, setUserInfo, removeToken, removeRefreshToken, removeUserInfo } from '../utils/api';

// 사용자 정보 타입
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  postal_code?: string;
  address?: string;
  address_detail?: string;
  is_admin?: boolean;
  is_profile_complete?: boolean;  // 필수 정보 입력 완료 여부
}

// 인증 상태 타입
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  // Actions
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (token: string, refreshToken: string) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,

      login: (user, token, refreshToken) => {
        setToken(token);
        setRefreshToken(refreshToken);
        setUserInfo(user);
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isAdmin: user.is_admin || false,
        });
      },

      logout: () => {
        removeToken();
        removeRefreshToken();
        removeUserInfo();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setTokens: (token, refreshToken) => {
        setToken(token);
        setRefreshToken(refreshToken);
        set({ token, refreshToken });
      },

      // 앱 시작 시 로컬 스토리지에서 상태 복원
      initialize: () => {
        const token = getToken();
        const refreshToken = getRefreshToken();
        const userInfo = getUserInfo();
        
        if (token && userInfo) {
          set({
            user: userInfo as User,
            token,
            refreshToken,
            isAuthenticated: true,
            isAdmin: (userInfo as any).is_admin || false,
          });
        }
      },
    }),
    {
      name: 'lune-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);

