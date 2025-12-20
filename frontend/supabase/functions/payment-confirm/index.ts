/**
 * Supabase Edge Function: 결제 승인
 * 
 * 토스페이먼츠 결제 승인을 안전하게 처리합니다.
 * 시크릿 키가 서버에서만 사용되므로 보안이 유지됩니다.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 허용된 Origin 목록 (화이트리스트)
const ALLOWED_ORIGINS = [
  "https://masionlune.com",
  "https://www.masionlune.com",
  // 개발 환경 (프로덕션에서는 제거 권장)
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

/**
 * Origin 검증 및 CORS 헤더 생성
 */
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0]; // 기본값은 프로덕션 도메인
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24시간 캐시
  };
}

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  // 기타 필드들...
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  
  // CORS preflight 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 환경변수에서 시크릿 키 가져오기 (Supabase Dashboard에서 설정)
    const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TOSS_SECRET_KEY) {
      throw new Error("TOSS_SECRET_KEY is not configured");
    }

    // 요청 본문 파싱
    const { paymentKey, orderId, amount }: PaymentConfirmRequest = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: paymentKey, orderId, amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(TOSS_SECRET_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const paymentResult: TossPaymentResponse = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error("Toss payment error:", paymentResult);
      return new Response(
        JSON.stringify({ 
          error: "결제 승인에 실패했습니다.",
          detail: paymentResult,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase 클라이언트 생성 (주문 상태 업데이트용)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // 주문 상태를 'paid'로 업데이트
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_key: paymentResult.paymentKey,
          paid_at: paymentResult.approvedAt,
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("order_number", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        // 결제는 성공했으므로 에러를 반환하지 않고 로그만 남김
      }
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          paymentKey: paymentResult.paymentKey,
          orderId: paymentResult.orderId,
          status: paymentResult.status,
          amount: paymentResult.totalAmount,
          method: paymentResult.method,
          approvedAt: paymentResult.approvedAt,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment confirm error:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다.", detail: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


