import { useState, useEffect } from "react";
import { ChevronLeft, LogOut, Check, X, Package, Heart, CreditCard, Plus, Trash2, Smartphone, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getProduct, Product } from "../utils/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EventBanner, EventBannerData } from "./EventBanner";

interface AccountPageProps {
  userEmail: string;
  onBack: () => void;
  onLogout: () => void;
  accessToken?: string;
  onProductClick?: (productId: number) => void;
  onEventClick?: (eventId: string) => void;
  savedCards: Array<{
    id: number;
    cardNumber: string;
    cardName: string;
    isDefault: boolean;
  }>;
  onUpdateSavedCards: (cards: Array<{
    id: number;
    cardNumber: string;
    cardName: string;
    isDefault: boolean;
  }>) => void;
  linkedSimplePay: {
    kakaopay: boolean;
    naverpay: boolean;
    tosspay: boolean;
    payco: boolean;
    samsungpay: boolean;
    applepay: boolean;
  };
  onUpdateLinkedSimplePay: (payments: {
    kakaopay: boolean;
    naverpay: boolean;
    tosspay: boolean;
    payco: boolean;
    samsungpay: boolean;
    applepay: boolean;
  }) => void;
  userInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    addressDetail: string;
    zipCode: string;
  };
  onUpdateUserInfo: (info: {
    name: string;
    phone: string;
    email: string;
    address: string;
    addressDetail: string;
    zipCode: string;
  }) => void;
}

export function AccountPage({ 
  userEmail, 
  onBack, 
  onLogout, 
  accessToken, 
  onProductClick,
  onEventClick,
  savedCards: propSavedCards,
  onUpdateSavedCards,
  linkedSimplePay: propLinkedSimplePay,
  onUpdateLinkedSimplePay,
  userInfo: propUserInfo,
  onUpdateUserInfo,
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist" | "payment">("profile");
  
  // SNS 연동 정보 시뮬레이션 (실제로는 백엔드에서 가져와야 함)
  const [socialConnections, setSocialConnections] = useState({
    google: true,
    naver: false,
    kakao: false,
  });
  
  // 연동된 SNS에서 가져온 이름 (예시)
  const [name, setName] = useState(propUserInfo.name);
  const [phone, setPhone] = useState(propUserInfo.phone);
  const [email, setEmail] = useState(userEmail);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  
  // 배송지 정보
  const [address, setAddress] = useState(propUserInfo.address);
  const [addressDetail, setAddressDetail] = useState(propUserInfo.addressDetail);
  const [zipCode, setZipCode] = useState(propUserInfo.zipCode);
  
  // 찜한 상품 목록
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<Map<number, Product>>(new Map());
  
  // 결제수단 관리 (임시 데이터 - 실제로는 백엔드에서 가져와야 함)
  const [savedCards, setSavedCards] = useState(propSavedCards);
  
  const [linkedSimplePay, setLinkedSimplePay] = useState(propLinkedSimplePay);
  
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCVC, setNewCardCVC] = useState("");
  const [newCardName, setNewCardName] = useState("");
  
  // 주문 내역 (임시 데이터 - 실제로는 백엔드에서 가져와야 함)
  const [orders] = useState([
    {
      id: 1,
      orderNumber: "20241118001",
      date: "2024.11.15",
      productName: "Cashmere Blend Knit",
      productImage: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
      price: 89000,
      quantity: 1,
      status: "배송완료" as const,
      color: "Beige",
      size: "M"
    },
    {
      id: 2,
      orderNumber: "20241118002",
      date: "2024.11.16",
      productName: "Wide Leg Trousers",
      productImage: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
      price: 68000,
      quantity: 1,
      status: "배송중" as const,
      color: "Taupe",
      size: "L"
    },
    {
      id: 3,
      orderNumber: "20241118003",
      date: "2024.11.18",
      productName: "Linen Blend Dress",
      productImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
      price: 125000,
      quantity: 1,
      status: "준비중" as const,
      color: "Cream",
      size: "S"
    }
  ]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("회원정보가 수정되었습니다");
    onUpdateUserInfo({
      name,
      phone,
      email,
      address,
      addressDetail,
      zipCode,
    });
  };

  const handleLogoutClick = () => {
    onLogout();
    toast.success("로그아웃 되었습니다");
    onBack();
  };

  const handlePhoneVerification = () => {
    if (isPhoneVerified) {
      toast.info("이미 인증된 전화번호입니다");
    } else {
      // 실제로는 인증 프로세스를 시작해야 함
      toast.success("인증 요청이 전송되었습니다");
      setIsPhoneVerified(true);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || !newCardExpiry || !newCardCVC || !newCardName) {
      toast.error("모든 정보를 입력해주세요");
      return;
    }

    const newCard = {
      id: savedCards.length + 1,
      cardNumber: newCardNumber.slice(0, 4) + "-****-****-" + newCardNumber.slice(-4),
      cardName: newCardName,
      isDefault: savedCards.length === 0,
    };

    setSavedCards([...savedCards, newCard]);
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCVC("");
    setNewCardName("");
    setShowAddCard(false);
    toast.success("카드가 추가되었습니다");
    onUpdateSavedCards([...savedCards, newCard]);
  };

  const handleDeleteCard = (cardId: number) => {
    setSavedCards(savedCards.filter(card => card.id !== cardId));
    toast.success("카드가 삭제되었습니다");
    onUpdateSavedCards(savedCards.filter(card => card.id !== cardId));
  };

  const handleSetDefaultCard = (cardId: number) => {
    setSavedCards(savedCards.map(card => ({
      ...card,
      isDefault: card.id === cardId,
    })));
    toast.success("기본 카드가 설정되었습니다");
    onUpdateSavedCards(savedCards.map(card => ({
      ...card,
      isDefault: card.id === cardId,
    })));
  };

  const handleToggleSimplePay = (paymentMethod: keyof typeof linkedSimplePay) => {
    setLinkedSimplePay({
      ...linkedSimplePay,
      [paymentMethod]: !linkedSimplePay[paymentMethod],
    });
    
    if (!linkedSimplePay[paymentMethod]) {
      toast.success("간편결제가 연동되었습니다");
    } else {
      toast.success("간편결제 연동이 해제되었습니다");
    }
    onUpdateLinkedSimplePay({
      ...linkedSimplePay,
      [paymentMethod]: !linkedSimplePay[paymentMethod],
    });
  };

  useEffect(() => {
    if (accessToken) {
      setFavoritesLoading(true);
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/favorites`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setFavoriteIds(data.favorites || []);
        })
        .catch((error) => {
          console.error("Error fetching favorites:", error);
        })
        .finally(() => {
          setFavoritesLoading(false);
        });
    }
  }, [accessToken]);

  // 찜한 상품 정보 가져오기
  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (favoriteIds.length === 0) {
        setFavoriteProducts(new Map());
        return;
      }

      try {
        const productMap = new Map<number, Product>();
        for (const productId of favoriteIds) {
          try {
            const product = await getProduct(productId);
            productMap.set(productId, product);
          } catch (error) {
            console.error(`Failed to fetch product ${productId}:`, error);
          }
        }
        setFavoriteProducts(productMap);
      } catch (error) {
        console.error("Failed to fetch favorite products:", error);
      }
    };

    fetchFavoriteProducts();
  }, [favoriteIds]);

  // 이벤트 배너 상태
  const [showEventBanner, setShowEventBanner] = useState(true);
  const activeEvent: EventBannerData = {
    id: "winter-sale",
    title: "WINTER SALE 🎁 신규 회원 최대 30% 할인",
    bannerImage: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200",
    content: "겨울 특별 세일 진행 중!",
    startDate: "2024-11-18",
    endDate: "2024-12-31",
    isActive: true,
    createdAt: "2024-11-18",
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-brand-warm-taupe/20 z-50">
        <div className="relative flex items-center justify-center px-4 py-8">
          <button 
            onClick={onBack}
            className="absolute left-4 p-2 hover:bg-brand-warm-taupe/10 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-brand-terra-cotta" />
          </button>
          <img src={logo} alt="LUNE" className="h-8 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-28 mobile-pt-20 pb-20 mobile-pb-12 px-4 mobile-px-3">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-16 mobile-mb-12 mt-8 mobile-mt-4">
            <h1 className="text-brand-terra-cotta tracking-[0.3em] mobile-text-sm">MY ACCOUNT</h1>
          </div>

          {/* Tabs - Minimalist Style */}
          <div className="flex justify-center gap-8 mobile-gap-4 mobile-justify-start mobile-overflow-x-auto mobile-scrollbar-hide mb-16 mobile-mb-12 border-b border-brand-warm-taupe/10">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-4 mobile-pb-3 text-xs mobile-text-10px tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === "profile"
                  ? "text-brand-terra-cotta border-b-2 border-brand-terra-cotta"
                  : "text-black/40 hover:text-brand-terra-cotta"
              }`}
            >
              회원정보
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-4 mobile-pb-3 text-xs mobile-text-10px tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === "orders"
                  ? "text-brand-terra-cotta border-b-2 border-brand-terra-cotta"
                  : "text-black/40 hover:text-brand-terra-cotta"
              }`}
            >
              주문내역
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`pb-4 mobile-pb-3 text-xs mobile-text-10px tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === "wishlist"
                  ? "text-brand-terra-cotta border-b-2 border-brand-terra-cotta"
                  : "text-black/40 hover:text-brand-terra-cotta"
              }`}
            >
              찜한상품
            </button>
            <button
              onClick={() => setActiveTab("payment")}
              className={`pb-4 mobile-pb-3 text-xs mobile-text-10px tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === "payment"
                  ? "text-brand-terra-cotta border-b-2 border-brand-terra-cotta"
                  : "text-black/40 hover:text-brand-terra-cotta"
              }`}
            >
              결제수단
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-sm shadow-sm">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="p-8 mobile-p-4 md:p-12">
                {/* SNS 연동 정보 */}
                <div className="mb-8 mobile-mb-6 pb-8 mobile-pb-6 border-b border-brand-warm-taupe/10">
                  <Label className="text-black text-xs mobile-text-10px tracking-wider mb-4 mobile-mb-3 block">
                    SNS 연동 정보
                  </Label>
                  <div className="flex gap-3 mobile-gap-2 mobile-flex-wrap">
                    <div className={`flex items-center gap-2 px-4 mobile-px-3 py-2 mobile-py-1\.5 rounded-md border text-xs mobile-text-10px ${
                      socialConnections.google 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {socialConnections.google ? <Check className="w-3 h-3 mobile-w-2\.5 mobile-h-2\.5" /> : <X className="w-3 h-3 mobile-w-2\.5 mobile-h-2\.5" />}
                      Google
                    </div>
                    <div className={`flex items-center gap-2 px-4 mobile-px-3 py-2 mobile-py-1\.5 rounded-md border text-xs mobile-text-10px ${
                      socialConnections.naver 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {socialConnections.naver ? <Check className="w-3 h-3 mobile-w-2\.5 mobile-h-2\.5" /> : <X className="w-3 h-3 mobile-w-2\.5 mobile-h-2\.5" />}
                      Naver
                    </div>
                    <div className={`flex items-center gap-2 px-4 mobile-px-3 py-2 mobile-py-1\.5 rounded-md border text-xs mobile-text-10px ${
                      socialConnections.kakao 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {socialConnections.kakao ? <Check className="w-3 h-3 mobile-w-2\.5 mobile-h-2\.5" /> : <X className="w-3 h-3 mobile-w-2\.5 mobile-h-2\.5" />}
                      Kakao
                    </div>
                  </div>
                  <p className="text-xs text-black/40 tracking-wide mt-3">
                    연동된 SNS 계정으로 간편하게 로그인할 수 있습니다
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-8 mobile-space-y-6">
                  <div className="space-y-3 mobile-space-y-2">
                    <Label htmlFor="name" className="text-black text-xs mobile-text-10px tracking-wider">
                      이름
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white border-brand-warm-taupe/20 text-black h-12 mobile-h-14 rounded-sm focus:border-brand-terra-cotta"
                    />
                  </div>

                  <div className="space-y-3 mobile-space-y-2">
                    <Label htmlFor="email" className="text-black text-xs mobile-text-10px tracking-wider">
                      이메일
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-brand-cream/30 border-brand-warm-taupe/20 text-black/40 h-12 mobile-h-14 rounded-sm"
                    />
                    <p className="text-xs mobile-text-10px text-black/40 tracking-wide">이메일은 변경할 수 없습니다</p>
                  </div>

                  <div className="space-y-3 mobile-space-y-2">
                    <Label htmlFor="phone" className="text-black text-xs mobile-text-10px tracking-wider">
                      전화번호
                    </Label>
                    <div className="flex gap-2 mobile-flex-col">
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-white border-brand-warm-taupe/20 text-black h-12 mobile-h-14 rounded-sm focus:border-brand-terra-cotta flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handlePhoneVerification}
                        className={`h-12 mobile-h-14 px-6 mobile-w-full text-xs mobile-text-sm tracking-wider transition-colors whitespace-nowrap ${
                          isPhoneVerified
                            ? 'bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe'
                            : 'bg-[#BEA99C] text-white hover:bg-[#B09A8C]'
                        }`}
                      >
                        {isPhoneVerified ? '인증완료' : '인증하기'}
                      </Button>
                    </div>
                  </div>

                  {/* 배송지 정보 */}
                  <div className="pt-6 mobile-pt-4 pb-6 mobile-pb-4 border-t border-brand-warm-taupe/10">
                    <Label className="text-black text-xs mobile-text-10px tracking-wider mb-4 mobile-mb-3 block">
                      배송지 정보
                    </Label>
                    
                    <div className="space-y-3 mobile-space-y-2">
                      <div className="flex gap-2 mobile-flex-col">
                        <Input
                          id="zipCode"
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="우편번호"
                          className="bg-white border-brand-warm-taupe/20 text-black h-12 mobile-h-14 rounded-sm focus:border-brand-terra-cotta"
                        />
                        <Button
                          type="button"
                          onClick={() => toast.info("주소 검색 기능은 준비 중입니다")}
                          className="h-12 mobile-h-14 mobile-w-full px-6 text-xs mobile-text-sm tracking-wider bg-[#BEA99C] text-white hover:bg-[#B09A8C] whitespace-nowrap"
                        >
                          주소검색
                        </Button>
                      </div>
                      
                      <Input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="기본 주소"
                        className="bg-white border-brand-warm-taupe/20 text-black h-12 mobile-h-14 rounded-sm focus:border-brand-terra-cotta"
                      />
                      
                      <Input
                        id="addressDetail"
                        type="text"
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        placeholder="상세 주소"
                        className="bg-white border-brand-warm-taupe/20 text-black h-12 mobile-h-14 rounded-sm focus:border-brand-terra-cotta"
                      />
                    </div>
                  </div>

                  <div className="pt-6 mobile-pt-4 space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe h-12 mobile-h-14 rounded-sm tracking-wider text-xs mobile-text-sm transition-colors flex items-center justify-center"
                    >
                      변경사항 저장
                    </button>

                    <button
                      type="button"
                      onClick={() => toast.info("비밀번호 변경 기능은 준비 중입니다")}
                      className="w-full bg-[#BEA99C] text-white hover:bg-[#B09A8C] h-12 rounded-sm tracking-wider text-xs transition-colors flex items-center justify-center"
                    >
                      비밀번호 변경
                    </button>

                    <div className="pt-8">
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center gap-2 text-black/40 hover:text-brand-terra-cotta text-xs tracking-wider transition-colors py-3"
                      >
                        <LogOut className="w-3 h-3" />
                        로그아웃
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-24 px-8">
                    <div className="w-16 h-16 border border-brand-warm-taupe/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Package className="w-8 h-8 text-brand-warm-taupe/30" />
                    </div>
                    <p className="text-black/50 text-sm tracking-wider mb-2">주문 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-brand-warm-taupe/20 rounded-md p-4 hover:border-brand-terra-cotta/30 transition-colors"
                      >
                        <div className="flex gap-4">
                          {/* 상품 이미지 */}
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-20 h-20 object-cover rounded-sm"
                          />
                          
                          {/* 주문 정보 */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-black text-sm tracking-wide">{order.productName}</h3>
                                <p className="text-xs text-black/40 tracking-wide mt-1">
                                  주문번호: {order.orderNumber}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs tracking-wide ${
                                order.status === '배송완료' 
                                  ? 'bg-brand-terra-cotta/10 text-brand-terra-cotta'
                                  : order.status === '배송중'
                                  ? 'bg-[#BEA99C]/20 text-[#8C7B6C]'
                                  : 'bg-brand-cream text-brand-warm-taupe'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-black/60">
                              <span>{order.color}</span>
                              <span>·</span>
                              <span>{order.size}</span>
                              <span>·</span>
                              <span>{order.quantity}개</span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs text-black/40">{order.date}</span>
                              <span className="text-brand-terra-cotta tracking-wide">
                                {order.price.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="p-6">
                {favoritesLoading ? (
                  <div className="text-center py-24 px-8">
                    <div className="w-16 h-16 border border-brand-warm-taupe/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-brand-warm-taupe/30" />
                    </div>
                    <p className="text-black/50 text-sm tracking-wider mb-2">찜한 상품을 불러오는 중입니다</p>
                  </div>
                ) : favoriteIds.length === 0 ? (
                  <div className="text-center py-24 px-8">
                    <div className="w-16 h-16 border border-brand-warm-taupe/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-brand-warm-taupe/30" />
                    </div>
                    <p className="text-black/50 text-sm tracking-wider mb-2">찜한 상품이 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteIds.map((productId) => {
                      const product = favoriteProducts.get(productId);
                      if (!product) return (
                        <div key={productId} className="border border-brand-warm-taupe/20 rounded-md p-4">
                          <div className="text-center text-brand-warm-taupe text-sm">로딩 중...</div>
                        </div>
                      );
                      return (
                        <div
                          key={productId}
                          onClick={() => onProductClick?.(productId)}
                          className="border border-brand-warm-taupe/20 rounded-md p-4 hover:border-brand-terra-cotta/30 transition-colors cursor-pointer"
                        >
                          <div className="flex gap-4">
                            {/* 상품 이미지 */}
                            <ImageWithFallback
                              src={product.image_url}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-sm"
                            />
                            
                            {/* 상품 정보 */}
                            <div className="flex-1 space-y-2">
                              <div>
                                <h3 className="text-black text-sm tracking-wide">{product.name}</h3>
                                <p className="text-xs text-black/40 tracking-wide mt-1">
                                  {product.category.join(", ")}
                                </p>
                              </div>
                              
                              <div className="pt-2">
                                <span className="text-brand-terra-cotta tracking-wide">
                                  {product.price.toLocaleString()}원
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <div className="p-6">
                {/* 카드 결제 */}
                <div className="mb-8">
                  <Label className="text-black text-xs tracking-wider mb-4 block">
                    카드 결제
                  </Label>
                  <div className="space-y-4">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className={`flex items-center gap-4 px-4 py-2 rounded-md border ${
                          card.isDefault ? 'bg-brand-cream/30 border-brand-terra-cotta/30' : 'bg-white border-brand-warm-taupe/20'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-brand-terra-cotta" />
                        <div className="flex-1">
                          <p className="text-sm text-black tracking-wide">{card.cardName}</p>
                          <p className="text-xs text-black/40 tracking-wide">{card.cardNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {card.isDefault && (
                            <span className="text-xs text-brand-terra-cotta tracking-wider">기본카드</span>
                          )}
                          <Button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="h-8 px-4 text-xs tracking-wider bg-[#BEA99C] text-white hover:bg-[#B09A8C] whitespace-nowrap"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => setShowAddCard(true)}
                      className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe h-12 rounded-sm tracking-wider text-xs transition-colors flex items-center justify-center"
                    >
                      카드 추가
                    </Button>
                  </div>
                </div>

                {/* 간편결제 */}
                <div className="mb-8">
                  <Label className="text-black text-xs tracking-wider mb-4 block">
                    간편결제
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs ${
                      linkedSimplePay.kakaopay 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {linkedSimplePay.kakaopay ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      KakaoPay
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs ${
                      linkedSimplePay.naverpay 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {linkedSimplePay.naverpay ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      NaverPay
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs ${
                      linkedSimplePay.tosspay 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {linkedSimplePay.tosspay ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      TossPay
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs ${
                      linkedSimplePay.payco 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {linkedSimplePay.payco ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Payco
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs ${
                      linkedSimplePay.samsungpay 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {linkedSimplePay.samsungpay ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      SamsungPay
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs ${
                      linkedSimplePay.applepay 
                        ? 'bg-brand-cream/30 border-brand-terra-cotta/30 text-brand-terra-cotta' 
                        : 'bg-white border-brand-warm-taupe/20 text-black/40'
                    }`}>
                      {linkedSimplePay.applepay ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      ApplePay
                    </div>
                  </div>
                  <p className="text-xs text-black/40 tracking-wide mt-3">
                    연동된 간편결제 계정으로 간편하게 결제할 수 있습니다
                  </p>
                </div>

                {/* 카드 추가 모달 */}
                {showAddCard && (
                  <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-sm shadow-sm w-96">
                      <h2 className="text-brand-terra-cotta tracking-[0.3em] text-center mb-6">카드 추가</h2>
                      <form
                        onSubmit={handleAddCard}
                        className="space-y-4"
                      >
                        <div className="space-y-3">
                          <Label htmlFor="cardNumber" className="text-black text-xs tracking-wider">
                            카드번호
                          </Label>
                          <Input
                            id="cardNumber"
                            type="text"
                            value={newCardNumber}
                            onChange={(e) => setNewCardNumber(e.target.value)}
                            placeholder="1234-5678-9012-3456"
                            className="bg-white border-brand-warm-taupe/20 text-black h-12 rounded-sm focus:border-brand-terra-cotta"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="cardExpiry" className="text-black text-xs tracking-wider">
                            유효기간
                          </Label>
                          <Input
                            id="cardExpiry"
                            type="text"
                            value={newCardExpiry}
                            onChange={(e) => setNewCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="bg-white border-brand-warm-taupe/20 text-black h-12 rounded-sm focus:border-brand-terra-cotta"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="cardCVC" className="text-black text-xs tracking-wider">
                            CVC
                          </Label>
                          <Input
                            id="cardCVC"
                            type="text"
                            value={newCardCVC}
                            onChange={(e) => setNewCardCVC(e.target.value)}
                            placeholder="123"
                            className="bg-white border-brand-warm-taupe/20 text-black h-12 rounded-sm focus:border-brand-terra-cotta"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="cardName" className="text-black text-xs tracking-wider">
                            카드사명
                          </Label>
                          <Input
                            id="cardName"
                            type="text"
                            value={newCardName}
                            onChange={(e) => setNewCardName(e.target.value)}
                            placeholder="신한카드"
                            className="bg-white border-brand-warm-taupe/20 text-black h-12 rounded-sm focus:border-brand-terra-cotta"
                          />
                        </div>

                        <div className="pt-6 space-y-3">
                          <button
                            type="submit"
                            className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe h-12 rounded-sm tracking-wider text-xs transition-colors flex items-center justify-center"
                          >
                            카드 추가
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowAddCard(false)}
                            className="w-full bg-[#BEA99C] text-white hover:bg-[#B09A8C] h-12 rounded-sm tracking-wider text-xs transition-colors flex items-center justify-center"
                          >
                            취소
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이벤트 배너 */}
      {showEventBanner && activeEvent.isActive && onEventClick && (
        <EventBanner
          event={activeEvent}
          onClose={() => setShowEventBanner(false)}
          onClick={() => onEventClick(activeEvent.id)}
        />
      )}
    </div>
  );
}