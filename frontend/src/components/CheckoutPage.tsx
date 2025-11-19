import { useState, useEffect } from "react";
import { ChevronLeft, CreditCard, Smartphone, Building2, Tag, Coins } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";
import { CartItem } from "../types/cart";
import { getProduct, Product } from "../utils/api";

interface CheckoutPageProps {
  cartItems: CartItem[];
  onBack: () => void;
  onComplete: () => void;
  userInfo?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    addressDetail: string;
    zipCode: string;
  };
  userPoints?: number;
  userCoupons?: Array<{
    id: string;
    name: string;
    discount: number;
    minAmount: number;
  }>;
  onUpdateUserInfo?: (info: any) => void;
  savedCards?: Array<{
    id: number;
    cardNumber: string;
    cardName: string;
    isDefault: boolean;
  }>;
  linkedSimplePay?: {
    kakaopay: boolean;
    naverpay: boolean;
    tosspay: boolean;
    payco: boolean;
    samsungpay: boolean;
    applepay: boolean;
  };
}

export function CheckoutPage({
  cartItems,
  onBack,
  onComplete,
  userInfo,
  userPoints = 5000,
  userCoupons = [
    { id: "WELCOME10", name: "웰컴 쿠폰 10%", discount: 0.1, minAmount: 50000 },
    { id: "MONTH5", name: "이달의 쿠폰 5%", discount: 0.05, minAmount: 30000 },
    { id: "VIP15", name: "VIP 쿠폰 15%", discount: 0.15, minAmount: 100000 },
  ],
  onUpdateUserInfo,
  savedCards = [],
  linkedSimplePay = {
    kakaopay: false,
    naverpay: false,
    tosspay: false,
    payco: false,
    samsungpay: false,
    applepay: false,
  },
}: CheckoutPageProps) {
  // 주문자 정보
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState(userInfo?.phone || "");
  const [email, setEmail] = useState(userInfo?.email || "");

  // 배송지 정보
  const [zipCode, setZipCode] = useState(userInfo?.zipCode || "");
  const [address, setAddress] = useState(userInfo?.address || "");
  const [addressDetail, setAddressDetail] = useState(userInfo?.addressDetail || "");
  const [deliveryMessage, setDeliveryMessage] = useState("문 앞에 놓아주세요");
  const [saveAddress, setSaveAddress] = useState(false);

  // 결제 정보
  const [paymentMethod, setPaymentMethod] = useState<"card" | "simple" | "bank">("card");
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedSimplePay, setSelectedSimplePay] = useState("");
  const [bankName, setBankName] = useState("");
  const [depositorName, setDepositorName] = useState("");

  // 쿠폰 및 포인트
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [usePoints, setUsePoints] = useState(0);
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 상품 정보
  const [products, setProducts] = useState<Map<number, Product>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productMap = new Map<number, Product>();
        for (const item of cartItems) {
          if (!productMap.has(item.productId)) {
            try {
              const product = await getProduct(item.productId);
              productMap.set(item.productId, product);
            } catch (error) {
              console.error(`Failed to fetch product ${item.productId}:`, error);
            }
          }
        }
        setProducts(productMap);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (cartItems.length > 0) {
      fetchProducts();
    }
  }, [cartItems]);

  // 가격 계산
  const subtotal = cartItems.reduce((sum, item) => {
    const product = products.get(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shippingFee = subtotal >= 50000 ? 0 : 3000;

  // 쿠폰 할인
  const appliedCoupon = userCoupons.find((c) => c.id === selectedCoupon);
  const couponDiscount =
    appliedCoupon && subtotal >= appliedCoupon.minAmount
      ? Math.floor(subtotal * appliedCoupon.discount)
      : 0;

  // 포인트 할인 (최대 보유 포인트, 최대 상품금액의 50%)
  const maxPointsUsable = Math.min(userPoints, Math.floor(subtotal * 0.5));
  const pointsDiscount = Math.min(usePoints, maxPointsUsable);

  const totalAmount = subtotal + shippingFee - couponDiscount - pointsDiscount;

  // 전체 동의
  useEffect(() => {
    if (agreeTerms && agreePrivacy) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeTerms, agreePrivacy]);

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
  };

  const handlePayment = () => {
    // 유효성 검사
    if (!name || !phone || !email) {
      toast.error("주문자 정보를 모두 입력해주세요");
      return;
    }

    if (!zipCode || !address) {
      toast.error("배송지 정보를 입력해주세요");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      toast.error("필수 약관에 동의해주세요");
      return;
    }

    if (paymentMethod === "card" && !selectedCard) {
      toast.error("결제할 카드를 선택해주세요");
      return;
    }

    if (paymentMethod === "simple" && !selectedSimplePay) {
      toast.error("간편결제 수단을 선택해주세요");
      return;
    }

    if (paymentMethod === "bank" && (!bankName || !depositorName)) {
      toast.error("무통장 입금 정보를 입력해주세요");
      return;
    }

    // 배송지 정보 저장
    if (saveAddress && onUpdateUserInfo) {
      onUpdateUserInfo({
        name,
        phone,
        email,
        zipCode,
        address,
        addressDetail,
      });
    }

    // 결제 처리 (백엔드 연동 시 실제 결제 API 호출)
    toast.success("주문이 완료되었습니다!");
    onComplete();
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="bg-white border-b border-brand-warm-taupe/20 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-brand-terra-cotta hover:text-brand-warm-taupe transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm tracking-wider">BACK</span>
            </button>
            <img src={logo} alt="LUNE" className="h-8 w-auto" />
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 max-[500px]:px-3 py-12 max-[500px]:py-8">
        <h1 className="text-2xl max-[500px]:text-xl text-brand-terra-cotta tracking-wider mb-8 max-[500px]:mb-6">주문/결제</h1>

        <div className="grid lg:grid-cols-3 max-[500px]:grid-cols-1 gap-8 max-[500px]:gap-6">
          {/* Left Column - 주문 정보 */}
          <div className="lg:col-span-2 space-y-6 max-[500px]:space-y-4">
            {/* 주문 상품 */}
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm">
              <h2 className="text-sm tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">주문 상품</h2>
              <div className="space-y-3 max-[500px]:space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-brand-warm-taupe text-sm">로딩 중...</div>
                ) : (
                  cartItems.map((item) => {
                    const product = products.get(item.productId);
                    if (!product) return null;
                    return (
                      <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3 max-[500px]:gap-2">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 max-[500px]:w-16 max-[500px]:h-16 object-cover rounded"
                        />
                      <div className="flex-1">
                        <p className="text-sm max-[500px]:text-xs text-black">{product.name}</p>
                        <p className="text-xs max-[500px]:text-[10px] text-brand-warm-taupe mt-1">
                          {item.color} / {item.size} / {item.quantity}개
                        </p>
                        <p className="text-sm max-[500px]:text-xs text-brand-terra-cotta mt-1">
                          {(product.price * item.quantity).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </div>

            {/* 주문자 정보 */}
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm">
              <h2 className="text-sm tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">주문자 정보</h2>
              <div className="space-y-3 max-[500px]:space-y-2">
                <div>
                  <Label htmlFor="name" className="text-xs text-brand-warm-taupe">
                    이름
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 border-brand-warm-taupe/20"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs text-brand-warm-taupe">
                    전화번호
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 border-brand-warm-taupe/20"
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs text-brand-warm-taupe">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 border-brand-warm-taupe/20"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 배송지 정보 */}
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm">
              <h2 className="text-sm tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">배송지 정보</h2>
              <div className="space-y-3 max-[500px]:space-y-2">
                <div className="flex gap-2 max-[500px]:flex-col">
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="border-brand-warm-taupe/20 max-[500px]:h-12"
                    placeholder="우편번호"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-brand-warm-taupe/30 whitespace-nowrap max-[500px]:h-12 max-[500px]:w-full"
                    onClick={() => toast.info("주소 검색 기능은 준비 중입니다")}
                  >
                    주소검색
                  </Button>
                </div>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border-brand-warm-taupe/20"
                  placeholder="기본 주소"
                />
                <Input
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  className="border-brand-warm-taupe/20"
                  placeholder="상세 주소"
                />
                <Input
                  value={deliveryMessage}
                  onChange={(e) => setDeliveryMessage(e.target.value)}
                  className="border-brand-warm-taupe/20"
                  placeholder="배송 메시지"
                />
                <label className="flex items-center gap-2 cursor-pointer text-xs text-brand-warm-taupe">
                  <Checkbox checked={saveAddress} onCheckedChange={(c) => setSaveAddress(!!c)} />
                  <span>배송지를 마이페이지에 저장</span>
                </label>
              </div>
            </div>

            {/* 쿠폰 / 포인트 */}
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm">
              <h2 className="text-sm tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">
                할인 / 포인트
              </h2>
              <div className="space-y-4 max-[500px]:space-y-3">
                {/* 쿠폰 선택 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 max-[500px]:w-3 max-[500px]:h-3 text-brand-terra-cotta" />
                    <Label className="text-xs max-[500px]:text-[10px] text-brand-warm-taupe">쿠폰 선택</Label>
                  </div>
                  <select
                    value={selectedCoupon}
                    onChange={(e) => setSelectedCoupon(e.target.value)}
                    className="w-full px-3 py-2 max-[500px]:h-12 border border-brand-warm-taupe/20 rounded-sm text-sm max-[500px]:text-xs"
                  >
                    <option value="">쿠폰을 선택하세요</option>
                    {userCoupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.id}>
                        {coupon.name} (최소 {coupon.minAmount.toLocaleString()}원)
                      </option>
                    ))}
                  </select>
                  {appliedCoupon && subtotal < appliedCoupon.minAmount && (
                    <p className="text-xs text-red-500 mt-1">
                      최소 주문금액 {appliedCoupon.minAmount.toLocaleString()}원 이상부터 사용
                      가능합니다
                    </p>
                  )}
                </div>

                {/* 포인트 사용 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 max-[500px]:w-3 max-[500px]:h-3 text-brand-terra-cotta" />
                    <Label className="text-xs max-[500px]:text-[10px] text-brand-warm-taupe">
                      포인트 사용 (보유: {userPoints.toLocaleString()}P)
                    </Label>
                  </div>
                  <div className="flex gap-2 max-[500px]:flex-col">
                    <Input
                      type="number"
                      value={usePoints}
                      onChange={(e) => setUsePoints(Math.max(0, parseInt(e.target.value) || 0))}
                      className="border-brand-warm-taupe/20 max-[500px]:h-12"
                      placeholder="사용할 포인트"
                      max={maxPointsUsable}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-brand-warm-taupe/30 whitespace-nowrap max-[500px]:h-12 max-[500px]:w-full"
                      onClick={() => setUsePoints(maxPointsUsable)}
                    >
                      전액사용
                    </Button>
                  </div>
                  <p className="text-xs text-brand-warm-taupe mt-1">
                    최대 {maxPointsUsable.toLocaleString()}P 사용 가능 (상품금액의 50%)
                  </p>
                </div>
              </div>
            </div>

            {/* 결제 수단 */}
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm">
              <h2 className="text-sm tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">결제 수단</h2>
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                {/* 카드 결제 */}
                <div className="border border-brand-warm-taupe/20 rounded-md p-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4 text-brand-terra-cotta" />
                      <span className="text-sm">카드 결제</span>
                    </Label>
                  </div>
                  {paymentMethod === "card" && (
                    <div className="mt-3 pl-6">
                      <select
                        value={selectedCard}
                        onChange={(e) => setSelectedCard(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-warm-taupe/20 rounded-sm text-sm"
                      >
                        <option value="">카드를 선택하세요</option>
                        {savedCards.map((card) => (
                          <option key={card.id} value={card.cardNumber}>
                            {card.cardName} ({card.cardNumber.slice(-4)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 간편결제 */}
                <div className="border border-brand-warm-taupe/20 rounded-md p-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="simple" id="simple" />
                    <Label htmlFor="simple" className="flex items-center gap-2 cursor-pointer">
                      <Smartphone className="w-4 h-4 text-brand-terra-cotta" />
                      <span className="text-sm">간편결제</span>
                    </Label>
                  </div>
                  {paymentMethod === "simple" && (
                    <div className="mt-3 pl-6 max-[500px]:pl-4 grid grid-cols-3 max-[500px]:grid-cols-2 gap-2 max-[500px]:gap-1.5">
                      {["카카오페이", "네이버페이", "토스페이", "페이코", "삼성페이", "애플페이"].map(
                        (pay) => (
                          <button
                            key={pay}
                            onClick={() => setSelectedSimplePay(pay)}
                            className={`py-2 max-[500px]:py-2.5 px-3 max-[500px]:px-2 text-xs max-[500px]:text-[10px] rounded border transition-colors ${
                              selectedSimplePay === pay
                                ? "border-brand-terra-cotta bg-brand-terra-cotta text-white"
                                : "border-brand-warm-taupe/20 text-brand-warm-taupe hover:border-brand-terra-cotta"
                            }`}
                            disabled={!linkedSimplePay[pay.toLowerCase()]}
                          >
                            {pay}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* 무통장 입금 */}
                <div className="border border-brand-warm-taupe/20 rounded-md p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="w-4 h-4 text-brand-terra-cotta" />
                      <span className="text-sm">무통장 입금</span>
                    </Label>
                  </div>
                  {paymentMethod === "bank" && (
                    <div className="mt-3 pl-6 space-y-2">
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-warm-taupe/20 rounded-sm text-sm"
                      >
                        <option value="">입금 은행 선택</option>
                        <option value="kb">KB국민은행</option>
                        <option value="shinhan">신한은행</option>
                        <option value="woori">우리은행</option>
                        <option value="hana">하나은행</option>
                        <option value="nh">NH농협</option>
                      </select>
                      <Input
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder="입금자명"
                        className="border-brand-warm-taupe/20"
                      />
                      <p className="text-xs text-brand-warm-taupe">
                        입금 계좌: 123-456-789012 (예금주: LUNE)
                      </p>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* 약관 동의 */}
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm">
              <div className="space-y-3 max-[500px]:space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={agreeAll} onCheckedChange={handleAgreeAll} />
                  <span className="text-sm text-black">전체 동의</span>
                </label>
                <div className="border-t border-brand-warm-taupe/10 pt-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={agreeTerms} onCheckedChange={(c) => setAgreeTerms(!!c)} />
                    <span className="text-xs text-brand-warm-taupe">
                      [필수] 구매조건 및 결제대행 서비스 약관 동의
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={agreePrivacy}
                      onCheckedChange={(c) => setAgreePrivacy(!!c)}
                    />
                    <span className="text-xs text-brand-warm-taupe">
                      [필수] 개인정보 제3자 제공 동의
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 결제 금액 */}
          <div className="lg:col-span-1 max-[500px]:order-first">
            <div className="bg-white rounded-lg p-6 max-[500px]:p-4 shadow-sm sticky top-24 max-[500px]:sticky max-[500px]:top-0 max-[500px]:relative">
              <h2 className="text-sm tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">결제 금액</h2>
              <div className="space-y-3 max-[500px]:space-y-2 text-sm max-[500px]:text-xs">
                <div className="flex justify-between text-brand-warm-taupe">
                  <span>상품금액</span>
                  <span>{subtotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-brand-warm-taupe">
                  <span>배송비</span>
                  <span>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString()}원`}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-brand-terra-cotta">
                    <span>쿠폰 할인</span>
                    <span>-{couponDiscount.toLocaleString()}원</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-brand-terra-cotta">
                    <span>포인트 사용</span>
                    <span>-{pointsDiscount.toLocaleString()}P</span>
                  </div>
                )}
                <div className="border-t border-brand-warm-taupe/20 pt-3 flex justify-between text-black">
                  <span className="font-medium">최종 결제금액</span>
                  <span className="text-lg text-brand-terra-cotta font-medium">
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full mt-6 max-[500px]:mt-4 bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe h-12 max-[500px]:h-14 flex items-center justify-center text-sm max-[500px]:text-base"
              >
                {totalAmount.toLocaleString()}원 결제하기
              </Button>

              <p className="text-xs text-brand-warm-taupe text-center mt-4">
                {shippingFee > 0 && "50,000원 이상 구매 시 무료배송"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}