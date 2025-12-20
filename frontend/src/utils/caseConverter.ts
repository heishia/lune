/**
 * snake_case/camelCase 자동 변환 유틸리티
 * 
 * 백엔드(Python): snake_case 사용
 * 프론트엔드(TypeScript): camelCase 사용
 */

// snake_case를 camelCase로 변환
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// camelCase를 snake_case로 변환
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// 객체의 키를 snake_case에서 camelCase로 변환
export function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamel(item)) as T;
  }
  
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = keysToCamel(obj[key]);
      return result;
    }, {} as Record<string, any>) as T;
  }
  
  return obj;
}

// 객체의 키를 camelCase에서 snake_case로 변환
export function keysToSnake<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnake(item)) as T;
  }
  
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {} as Record<string, any>) as T;
  }
  
  return obj;
}

/**
 * API 요청/응답 자동 변환 래퍼
 * 
 * 사용 예:
 * - 요청 시: keysToSnake(requestData) - camelCase -> snake_case
 * - 응답 시: keysToCamel(responseData) - snake_case -> camelCase
 */

// Date 객체 처리를 위한 ISO 문자열 변환
export function serializeForAPI(obj: any): any {
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeForAPI);
  }
  
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[key] = serializeForAPI(obj[key]);
      return result;
    }, {} as Record<string, any>);
  }
  
  return obj;
}

// API 요청 데이터 변환 (camelCase -> snake_case + Date 처리)
export function prepareForAPI<T>(obj: T): any {
  return keysToSnake(serializeForAPI(obj));
}

// API 응답 데이터 변환 (snake_case -> camelCase)
export function parseFromAPI<T>(obj: any): T {
  return keysToCamel<T>(obj);
}

