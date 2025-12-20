import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { FeaturedSection } from "./components/FeaturedSection";
import { CategorySection } from "./components/CategorySection";
import { ProductGrid } from "./components/ProductGrid";
import { InstagramFeed } from "./components/InstagramFeed";
import { CategoryPage } from "./components/CategoryPage";
import { ProductDetail } from "./components/ProductDetail";
import { SearchModal } from "./components/SearchModal";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { CartModal } from "./components/CartModal";
import { AdminPage } from "./components/AdminPage";
import { AccountPage } from "./components/AccountPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { EventDetailPage } from "./components/EventDetailPage";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";

// Zustand stores
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import { useUIStore } from "./stores/uiStore";

// 레이아웃 컴포넌트 - 헤더와 공통 모달이 포함된 레이아웃
function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { items, isOpen: isCartOpen, closeCart, updateQuantity, removeItem } = useCartStore();
  const { isSearchOpen, closeSearch } = useUIStore();

  const handleCategoryClick = (category: string) => {
    navigate(`/category/${category}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <>
      <Header
        onCategoryClick={handleCategoryClick}
        onLogoClick={() => navigate("/")}
        onSearchClick={() => useUIStore.getState().openSearch()}
        onLoginClick={() => navigate("/login")}
        onAccountClick={() => navigate("/account")}
        onCartClick={() => useCartStore.getState().openCart()}
        cartItemsCount={items.length}
        userEmail={user?.email || ""}
      />
      {children}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onProductClick={handleProductClick}
      />
      <CartModal
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={items}
        onUpdateQuantity={(productId, quantity) => updateQuantity(productId, quantity)}
        onRemoveItem={(productId) => removeItem(productId)}
        onCheckout={handleCheckout}
      />
      <Toaster position="top-center" />
    </>
  );
}

// 홈 페이지 컴포넌트
function HomePage() {
  const navigate = useNavigate();

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/category/${category}`);
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mt-48 mobile-mt-24">
        <FeaturedSection />
      </div>
      <CategorySection />
      <ProductGrid
        onProductClick={handleProductClick}
        onViewMoreClick={() => handleCategoryClick("BEST")}
      />
      <InstagramFeed />
    </div>
  );
}

// 카테고리 페이지 래퍼
function CategoryPageWrapper() {
  const navigate = useNavigate();
  const { category } = useLocation().pathname.split("/").reduce(
    (acc, part, index, arr) => {
      if (part === "category" && arr[index + 1]) {
        return { category: decodeURIComponent(arr[index + 1]) };
      }
      return acc;
    },
    { category: "" }
  );

  // URL에서 카테고리 추출
  const pathParts = location.pathname.split("/");
  const categoryFromPath = pathParts[pathParts.indexOf("category") + 1] || "";

  return (
    <CategoryPage
      category={decodeURIComponent(categoryFromPath)}
      onProductClick={(productId) => navigate(`/product/${productId}`)}
      onBack={() => navigate("/")}
    />
  );
}

// 상품 상세 페이지 래퍼
function ProductDetailWrapper() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { token } = useAuthStore();

  // URL에서 상품 ID 추출
  const pathParts = location.pathname.split("/");
  const productId = parseInt(pathParts[pathParts.indexOf("product") + 1] || "0", 10);

  const handleAddToCart = (productId: number, quantity: number, color: string, size: string) => {
    addItem({ productId, quantity, color, size });
  };

  return (
    <ProductDetail
      productId={productId}
      onBack={() => navigate(-1)}
      onAddToCart={handleAddToCart}
      accessToken={token || ""}
    />
  );
}

// 이벤트 상세 페이지 래퍼
function EventDetailWrapper() {
  const navigate = useNavigate();

  // URL에서 이벤트 ID 추출
  const pathParts = location.pathname.split("/");
  const eventId = pathParts[pathParts.indexOf("event") + 1] || "";

  return (
    <EventDetailPage
      eventId={eventId}
      onBack={() => navigate("/")}
    />
  );
}

// 로그인 페이지 래퍼
function LoginPageWrapper() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = (email: string, token: string) => {
    // 실제 로그인 로직은 LoginPage 컴포넌트에서 처리
    // 여기서는 상태만 업데이트
  };

  return (
    <LoginPage
      onLogin={handleLogin}
      onBack={() => navigate("/")}
      onSignupClick={() => navigate("/signup")}
      onAdminLogin={() => navigate("/admin")}
    />
  );
}

// 회원가입 페이지 래퍼
function SignupPageWrapper() {
  const navigate = useNavigate();

  return (
    <SignupPage
      onSignup={() => {}}
      onBack={() => navigate("/")}
      onLoginClick={() => navigate("/login")}
    />
  );
}

// 관리자 페이지 래퍼
function AdminPageWrapper() {
  const navigate = useNavigate();

  return <AdminPage onBack={() => navigate("/")} />;
}

// 계정 페이지 래퍼
function AccountPageWrapper() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 임시 상태 - 나중에 별도 store로 분리 가능
  const savedCards = [
    { id: 1, cardNumber: "1234-****-****-5678", cardName: "신한카드", isDefault: true },
    { id: 2, cardNumber: "9876-****-****-4321", cardName: "KB국민카드", isDefault: false },
  ];
  const linkedSimplePay = {
    kakaopay: true,
    naverpay: true,
    tosspay: false,
    payco: false,
    samsungpay: false,
    applepay: false,
  };
  const userInfo = {
    name: user?.name || "",
    phone: "010-1234-5678",
    email: user?.email || "",
    address: "",
    addressDetail: "",
    zipCode: "",
  };

  return (
    <AccountPage
      userEmail={user?.email || ""}
      onBack={() => navigate("/")}
      onLogout={handleLogout}
      accessToken={token || ""}
      onProductClick={(productId) => navigate(`/product/${productId}`)}
      onEventClick={(eventId) => navigate(`/event/${eventId}`)}
      savedCards={savedCards}
      onUpdateSavedCards={() => {}}
      linkedSimplePay={linkedSimplePay}
      onUpdateLinkedSimplePay={() => {}}
      userInfo={userInfo}
      onUpdateUserInfo={() => {}}
    />
  );
}

// 개인정보처리방침 페이지 래퍼
function PrivacyPolicyPageWrapper() {
  const navigate = useNavigate();

  return <PrivacyPolicyPage onBack={() => navigate(-1)} />;
}

// 결제 페이지 래퍼
function CheckoutPageWrapper() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();

  // 임시 상태
  const userPoints = 5000;
  const userCoupons = [
    { id: "WELCOME10", name: "웰컴 쿠폰 10%", discount: 0.1, minAmount: 50000 },
    { id: "MONTH5", name: "이달의 쿠폰 5%", discount: 0.05, minAmount: 30000 },
    { id: "VIP15", name: "VIP 쿠폰 15%", discount: 0.15, minAmount: 100000 },
  ];
  const savedCards = [
    { id: 1, cardNumber: "1234-****-****-5678", cardName: "신한카드", isDefault: true },
    { id: 2, cardNumber: "9876-****-****-4321", cardName: "KB국민카드", isDefault: false },
  ];
  const linkedSimplePay = {
    kakaopay: true,
    naverpay: true,
    tosspay: false,
    payco: false,
    samsungpay: false,
    applepay: false,
  };
  const userInfo = {
    name: user?.name || "",
    phone: "010-1234-5678",
    email: user?.email || "",
    address: "",
    addressDetail: "",
    zipCode: "",
  };

  const handleComplete = () => {
    clearCart();
    navigate("/");
  };

  return (
    <CheckoutPage
      cartItems={items}
      onBack={() => navigate("/")}
      onComplete={handleComplete}
      userInfo={userInfo}
      userPoints={userPoints}
      userCoupons={userCoupons}
      onUpdateUserInfo={() => {}}
      savedCards={savedCards}
      linkedSimplePay={linkedSimplePay}
    />
  );
}

// 메인 App 컴포넌트
export default function App() {
  const { initialize } = useAuthStore();

  // 앱 시작 시 인증 상태 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      {/* 헤더 없이 렌더링되는 페이지들 */}
      <Route path="/login" element={<><LoginPageWrapper /><Toaster position="top-center" /></>} />
      <Route path="/signup" element={<><SignupPageWrapper /><Toaster position="top-center" /></>} />
      <Route path="/admin" element={<><AdminPageWrapper /><Toaster position="top-center" /></>} />
      <Route path="/account" element={<><AccountPageWrapper /><Toaster position="top-center" /></>} />
      <Route path="/checkout" element={<><CheckoutPageWrapper /><Toaster position="top-center" /></>} />
      <Route path="/privacy-policy" element={<><PrivacyPolicyPageWrapper /><Toaster position="top-center" /></>} />

      {/* 헤더가 있는 페이지들 */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
      <Route
        path="/category/:category"
        element={
          <MainLayout>
            <CategoryPageWrapper />
          </MainLayout>
        }
      />
      <Route
        path="/product/:productId"
        element={
          <MainLayout>
            <ProductDetailWrapper />
          </MainLayout>
        }
      />
      <Route
        path="/event/:eventId"
        element={
          <MainLayout>
            <EventDetailWrapper />
          </MainLayout>
        }
      />
    </Routes>
  );
}
