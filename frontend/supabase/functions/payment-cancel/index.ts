/**
 * Supabase Edge Function: 결제 취소/환불
 * 
 * 토스페이먼츠 결제 취소를 안전하게 처리합니다.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentCancelRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number; // 부분 취소 시
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TOSS_SECRET_KEY) {
      throw new Error("TOSS_SECRET_KEY is not configured");
    }

    const { paymentKey, cancelReason, cancelAmount }: PaymentCancelRequest = await req.json();

    if (!paymentKey || !cancelReason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: paymentKey, cancelReason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 토스페이먼츠 결제 취소 API 호출
    const cancelBody: any = { cancelReason };
    if (cancelAmount) {
      cancelBody.cancelAmount = cancelAmount;
    }

    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(TOSS_SECRET_KEY + ":")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cancelBody),
      }
    );

    const cancelResult = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error("Toss cancel error:", cancelResult);
      return new Response(
        JSON.stringify({ 
          error: "결제 취소에 실패했습니다.",
          detail: cancelResult,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 주문 상태 업데이트
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      await supabase
        .from("orders")
        .update({
          payment_status: "cancelled",
          status: "cancelled",
          cancel_reason: cancelReason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("payment_key", paymentKey);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "결제가 취소되었습니다.",
        cancel: cancelResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment cancel error:", error);
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다.", detail: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


