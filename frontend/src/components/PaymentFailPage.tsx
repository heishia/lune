/**
 * 결제 실패 페이지
 * 
 * 토스페이먼츠 결제 실패 시 리다이렉트되는 페이지입니다.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { extractPaymentError } from "../utils/payment";
import { XCircle } from "lucide-react";

export function PaymentFailPage() {
  const navigate = useNavigate();
  const [errorInfo, setErrorInfo] = useState<{
    code: string;
    message: string;
  }>({ code: "", message: "" });

  useEffect(() => {
    const { code, message } = extractPaymentError();
    setErrorInfo({
      code: code || "UNKNOWN",
      message: message || "알 수 없는 오류가 발생했습니다.",
    });
  }, []);

  // 에러 코드별 메시지
  const getErrorDescription = (code: string): string => {
    const errorMessages: Record<string, string> = {
      PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
      PAY_PROCESS_ABORTED: "결제 진행 중 오류가 발생했습니다.",
      REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다.",
      BELOW_MINIMUM_AMOUNT: "최소 결제 금액 미만입니다.",
      INVALID_CARD_EXPIRATION: "카드 유효기간이 만료되었습니다.",
      INVALID_STOPPED_CARD: "정지된 카드입니다.",
      EXCEED_MAX_CARD_INSTALLMENT_PLAN: "할부 개월 수가 초과되었습니다.",
      NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "할부가 지원되지 않는 카드입니다.",
      INVALID_CARD_NUMBER: "카드 번호가 올바르지 않습니다.",
      INVALID_CARD_PASSWORD: "카드 비밀번호가 올바르지 않습니다.",
    };
    return errorMessages[code] || "결제 처리 중 문제가 발생했습니다.";
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-medium text-gray-900 mb-4">
          결제에 실패했습니다
        </h1>
        
        <div className="bg-red-50 rounded-lg p-6 mb-8 text-left">
          <div className="mb-2">
            <span className="text-sm text-red-600">오류 코드</span>
            <p className="font-mono text-sm">{errorInfo.code}</p>
          </div>
          <div>
            <span className="text-sm text-red-600">오류 메시지</span>
            <p className="text-gray-700">{getErrorDescription(errorInfo.code)}</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          문제가 지속되면 고객센터로 문의해주세요.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/checkout")}
            className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
          >
            다시 결제하기
          </Button>
          <Button
            onClick={() => navigate("/cart")}
            variant="outline"
            className="w-full"
          >
            장바구니로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}



