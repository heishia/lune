/**
 * Case Converter 유틸리티 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  snakeToCamel,
  camelToSnake,
  keysToCamel,
  keysToSnake,
} from '../../utils/caseConverter';

describe('caseConverter', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('hello_world')).toBe('helloWorld');
      expect(snakeToCamel('user_id')).toBe('userId');
      expect(snakeToCamel('created_at')).toBe('createdAt');
    });

    it('should handle multiple underscores', () => {
      expect(snakeToCamel('is_email_verified')).toBe('isEmailVerified');
    });

    it('should not change single words', () => {
      expect(snakeToCamel('hello')).toBe('hello');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('helloWorld')).toBe('hello_world');
      expect(camelToSnake('userId')).toBe('user_id');
      expect(camelToSnake('createdAt')).toBe('created_at');
    });

    it('should handle multiple uppercase letters', () => {
      expect(camelToSnake('isEmailVerified')).toBe('is_email_verified');
    });

    it('should not change single words', () => {
      expect(camelToSnake('hello')).toBe('hello');
    });
  });

  describe('keysToCamel', () => {
    it('should convert object keys from snake_case to camelCase', () => {
      const input = {
        user_id: '123',
        created_at: '2024-01-01',
        is_active: true,
      };

      const result = keysToCamel<any>(input);

      expect(result).toEqual({
        userId: '123',
        createdAt: '2024-01-01',
        isActive: true,
      });
    });

    it('should handle nested objects', () => {
      const input = {
        user_data: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = keysToCamel<any>(input);

      expect(result).toEqual({
        userData: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });

    it('should handle arrays', () => {
      const input = [
        { user_id: '1', user_name: 'Alice' },
        { user_id: '2', user_name: 'Bob' },
      ];

      const result = keysToCamel<any>(input);

      expect(result).toEqual([
        { userId: '1', userName: 'Alice' },
        { userId: '2', userName: 'Bob' },
      ]);
    });

    it('should preserve non-object values', () => {
      expect(keysToCamel('hello')).toBe('hello');
      expect(keysToCamel(123)).toBe(123);
      expect(keysToCamel(null)).toBe(null);
    });
  });

  describe('keysToSnake', () => {
    it('should convert object keys from camelCase to snake_case', () => {
      const input = {
        userId: '123',
        createdAt: '2024-01-01',
        isActive: true,
      };

      const result = keysToSnake<any>(input);

      expect(result).toEqual({
        user_id: '123',
        created_at: '2024-01-01',
        is_active: true,
      });
    });

    it('should handle nested objects', () => {
      const input = {
        userData: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const result = keysToSnake<any>(input);

      expect(result).toEqual({
        user_data: {
          first_name: 'John',
          last_name: 'Doe',
        },
      });
    });
  });
});

