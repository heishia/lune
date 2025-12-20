/**
 * API 에러 타입 정의
 * 
 * 백엔드의 DomainError와 일치하는 에러 코드 체계
 */

// API 에러 응답 타입
export interface APIError {
  error: string;       // 에러 메시지 (사용자에게 표시)
  code: string;        // 에러 코드 (프로그래매틱 처리용)
  detail?: string;     // 상세 정보 (디버그용)
}

// 에러 코드 상수
export const ErrorCodes = {
  // 일반
  DOMAIN_ERROR: 'domain_error',
  BAD_REQUEST: 'bad_request',
  VALIDATION_ERROR: 'validation_error',
  
  // 인증
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  TOKEN_EXPIRED: 'token_expired',
  INVALID_TOKEN: 'invalid_token',
  
  // 리소스
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  
  // 비즈니스 로직
  INSUFFICIENT_STOCK: 'insufficient_stock',
  PAYMENT_ERROR: 'payment_error',
  
  // 시스템
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  FILE_UPLOAD_ERROR: 'file_upload_error',
  INTERNAL_SERVER_ERROR: 'internal_server_error',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// HTTP 상태 코드와 에러 코드 매핑
export const HttpStatusToErrorCode: Record<number, ErrorCode> = {
  400: ErrorCodes.BAD_REQUEST,
  401: ErrorCodes.UNAUTHORIZED,
  402: ErrorCodes.PAYMENT_ERROR,
  403: ErrorCodes.FORBIDDEN,
  404: ErrorCodes.NOT_FOUND,
  409: ErrorCodes.CONFLICT,
  422: ErrorCodes.VALIDATION_ERROR,
  429: ErrorCodes.RATE_LIMIT_EXCEEDED,
  500: ErrorCodes.INTERNAL_SERVER_ERROR,
  503: ErrorCodes.SERVICE_UNAVAILABLE,
};

// 에러 코드별 기본 메시지
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.DOMAIN_ERROR]: '요청을 처리할 수 없습니다.',
  [ErrorCodes.BAD_REQUEST]: '잘못된 요청입니다.',
  [ErrorCodes.VALIDATION_ERROR]: '입력 정보를 확인해주세요.',
  [ErrorCodes.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ErrorCodes.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCodes.TOKEN_EXPIRED]: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCodes.INVALID_TOKEN]: '유효하지 않은 인증 정보입니다.',
  [ErrorCodes.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ErrorCodes.CONFLICT]: '이미 존재하는 정보입니다.',
  [ErrorCodes.INSUFFICIENT_STOCK]: '재고가 부족합니다.',
  [ErrorCodes.PAYMENT_ERROR]: '결제 처리 중 오류가 발생했습니다.',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',
  [ErrorCodes.FILE_UPLOAD_ERROR]: '파일 업로드에 실패했습니다.',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

// 에러 유틸리티 함수
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'code' in error
  );
}

export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.error || ErrorMessages[error.code as ErrorCode] || '오류가 발생했습니다.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

export function getErrorCode(error: unknown): ErrorCode | null {
  if (isAPIError(error)) {
    return error.code as ErrorCode;
  }
  return null;
}

// 특정 에러 코드인지 확인
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return getErrorCode(error) === code;
}

// 인증 에러인지 확인
export function isAuthError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === ErrorCodes.UNAUTHORIZED || 
         code === ErrorCodes.TOKEN_EXPIRED || 
         code === ErrorCodes.INVALID_TOKEN;
}

