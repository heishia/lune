import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary
 * 
 * 자식 컴포넌트에서 발생한 JavaScript 에러를 잡아서
 * 에러 페이지를 표시합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 커스텀 fallback이 있으면 사용
      if (fallback) {
        return fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* 에러 아이콘 */}
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-brand-terra-cotta opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* 메시지 */}
            <h1 className="text-2xl font-medium text-gray-900 mb-4">
              문제가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-8">
              페이지를 불러오는 중 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>

            {/* 개발 모드에서 에러 상세 표시 */}
            {import.meta.env.DEV && error && (
              <div className="mb-8 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-700 break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-brand-terra-cotta text-brand-terra-cotta hover:bg-brand-terra-cotta/10"
              >
                다시 시도
              </Button>
              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                페이지 새로고침
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * 함수형 컴포넌트용 훅 스타일 래퍼
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;

