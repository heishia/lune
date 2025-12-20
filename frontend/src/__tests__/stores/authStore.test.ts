/**
 * Auth Store 테스트
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

// API 함수 모킹
vi.mock('../../utils/api', () => ({
  getToken: vi.fn(() => null),
  getRefreshToken: vi.fn(() => null),
  getUserInfo: vi.fn(() => null),
  setToken: vi.fn(),
  setRefreshToken: vi.fn(),
  setUserInfo: vi.fn(),
  removeToken: vi.fn(),
  removeRefreshToken: vi.fn(),
  removeUserInfo: vi.fn(),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  });

  describe('login', () => {
    it('should set user and tokens on login', () => {
      const testUser = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: false,
      };
      const testToken = 'test-access-token';
      const testRefreshToken = 'test-refresh-token';

      useAuthStore.getState().login(testUser, testToken, testRefreshToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(testUser);
      expect(state.token).toBe(testToken);
      expect(state.refreshToken).toBe(testRefreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isAdmin).toBe(false);
    });

    it('should set isAdmin to true for admin users', () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        is_admin: true,
      };

      useAuthStore.getState().login(adminUser, 'token', 'refresh');

      const state = useAuthStore.getState();
      expect(state.isAdmin).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user and tokens on logout', () => {
      // 먼저 로그인
      useAuthStore.getState().login(
        { id: '1', email: 'test@example.com', name: 'Test', is_admin: false },
        'token',
        'refresh'
      );

      // 로그아웃
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      // 먼저 로그인
      useAuthStore.getState().login(
        { id: '1', email: 'test@example.com', name: 'Test', is_admin: false },
        'token',
        'refresh'
      );

      // 사용자 정보 업데이트
      useAuthStore.getState().updateUser({ name: 'Updated Name' });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.email).toBe('test@example.com'); // 기존 값 유지
    });
  });
});

