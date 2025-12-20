/**
 * 토스페이먼츠 결제 유틸리티
 * 
 * 결제 위젯 초기화 및 결제 처리를 담당합니다.
 */

// 토스페이먼츠 SDK 타입 정의
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

interface TossPaymentsInstance {
  requestPayment: (
    method: PaymentMethod,
    options: PaymentOptions
  ) => Promise<PaymentResponse>;
  widgets: (options: { customerKey: string }) => TossWidgets;
}

interface TossWidgets {
  setAmount: (options: { currency: string; value: number }) => Promise<void>;
  renderPaymentMethods: (options: {
    selector: string;
    variantKey?: string;
  }) => Promise<void>;
  renderAgreement: (options: { selector: string; variantKey?: string }) => Promise<void>;
  requestPayment: (options: PaymentRequestOptions) => Promise<void>;
}

type PaymentMethod = "카드" | "가상계좌" | "계좌이체" | "휴대폰" | "문화상품권" | "토스페이";

interface PaymentOptions {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  customerMobilePhone?: string;
  successUrl: string;
  failUrl: string;
}

interface PaymentRequestOptions {
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  customerMobilePhone?: string;
  successUrl: string;
  failUrl: string;
}

interface PaymentResponse {
  paymentKey: string;
  orderId: string;
  amount: number;
}

// 환경 변수에서 클라이언트 키 가져오기
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || "";

// Supabase Edge Function URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

/**
 * 토스페이먼츠 SDK 스크립트 로드
 */
export async function loadTossPaymentsSDK(): Promise<void> {
  if (window.TossPayments) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load TossPayments SDK"));
    document.head.appendChild(script);
  });
}

/**
 * 토스페이먼츠 위젯 SDK 로드
 */
export async function loadTossWidgetsSDK(): Promise<void> {
  if (window.TossPayments) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment-widget";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load TossPayments Widget SDK"));
    document.head.appendChild(script);
  });
}

/**
 * 결제 요청 (일반 결제)
 */
export async function requestPayment(options: {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  method?: PaymentMethod;
}): Promise<void> {
  await loadTossPaymentsSDK();

  if (!TOSS_CLIENT_KEY) {
    throw new Error("VITE_TOSS_CLIENT_KEY is not configured");
  }

  if (!window.TossPayments) {
    throw new Error("TossPayments SDK is not loaded");
  }

  const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
  const baseUrl = window.location.origin;

  await tossPayments.requestPayment(options.method || "카드", {
    amount: options.amount,
    orderId: options.orderId,
    orderName: options.orderName,
    customerName: options.customerName,
    customerEmail: options.customerEmail,
    customerMobilePhone: options.customerPhone,
    successUrl: `${baseUrl}/payment/success`,
    failUrl: `${baseUrl}/payment/fail`,
  });
}

/**
 * 결제 승인 (Edge Function 호출)
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{
  success: boolean;
  payment?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "결제 승인에 실패했습니다.",
      };
    }

    return {
      success: true,
      payment: result.payment,
    };
  } catch (error) {
    console.error("Payment confirm error:", error);
    return {
      success: false,
      error: "결제 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 결제 취소 (Edge Function 호출)
 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        cancelReason,
        cancelAmount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "결제 취소에 실패했습니다.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Payment cancel error:", error);
    return {
      success: false,
      error: "결제 취소 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 결제 성공 URL에서 파라미터 추출
 */
export function extractPaymentParams(): {
  paymentKey: string | null;
  orderId: string | null;
  amount: number | null;
} {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    paymentKey: urlParams.get("paymentKey"),
    orderId: urlParams.get("orderId"),
    amount: urlParams.get("amount") ? parseInt(urlParams.get("amount")!, 10) : null,
  };
}

/**
 * 결제 실패 URL에서 에러 정보 추출
 */
export function extractPaymentError(): {
  code: string | null;
  message: string | null;
  orderId: string | null;
} {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    code: urlParams.get("code"),
    message: urlParams.get("message"),
    orderId: urlParams.get("orderId"),
  };
}



