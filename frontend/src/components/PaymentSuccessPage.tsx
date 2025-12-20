/**
 * 결제 성공 페이지
 * 
 * 토스페이먼츠 결제 완료 후 리다이렉트되는 페이지입니다.
 * 결제 승인 처리를 수행합니다.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { confirmPayment, extractPaymentParams } from "../utils/payment";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type PaymentStatus = "loading" | "success" | "error";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [error, setError] = useState<string>("");
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    async function processPayment() {
      const { paymentKey, orderId, amount } = extractPaymentParams();

      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setError("결제 정보가 올바르지 않습니다.");
        return;
      }

      setOrderInfo({ orderId, amount });

      // Edge Function을 통해 결제 승인
      const result = await confirmPayment(paymentKey, orderId, amount);

      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(result.error || "결제 승인에 실패했습니다.");
      }
    }

    processPayment();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-brand-terra-cotta mx-auto mb-4" />
          <p className="text-lg text-gray-600">결제를 처리하고 있습니다...</p>
          <p className="text-sm text-gray-400 mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-medium text-gray-900 mb-4">
            결제 처리 실패
          </h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/checkout")}
              className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
            >
              다시 결제하기
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-medium text-gray-900 mb-4">
          결제가 완료되었습니다
        </h1>
        
        {orderInfo && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">주문번호</span>
              <span className="font-medium">{orderInfo.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제금액</span>
              <span className="font-medium text-brand-terra-cotta">
                {orderInfo.amount.toLocaleString()}원
              </span>
            </div>
          </div>
        )}

        <p className="text-gray-600 mb-8">
          주문 내역은 마이페이지에서 확인하실 수 있습니다.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/account")}
            className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
          >
            주문 내역 확인
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            쇼핑 계속하기
          </Button>
        </div>
      </div>
    </div>
  );
}



