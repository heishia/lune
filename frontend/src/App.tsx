import { useState } from "react";
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
import { EventBannerData } from "./components/EventBanner";
import { CartItem } from "./types/cart";
import { Toaster } from "./components/ui/sonner";

type Page = 
  | { type: "home" }
  | { type: "category"; category: string }
  | { type: "product"; productId: number }
  | { type: "login" }
  | { type: "signup" }
  | { type: "admin" }
  | { type: "account" }
  | { type: "checkout" }
  | { type: "event"; eventId: string };

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>({ type: "home" });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");

  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState({
    name: "김루네",
    phone: "010-1234-5678",
    email: "",
    address: "",
    addressDetail: "",
    zipCode: "",
  });

  // 결제수단 상태
  const [savedCards, setSavedCards] = useState([
    { id: 1, cardNumber: "1234-****-****-5678", cardName: "신한카드", isDefault: true },
    { id: 2, cardNumber: "9876-****-****-4321", cardName: "KB국민카드", isDefault: false },
  ]);

  const [linkedSimplePay, setLinkedSimplePay] = useState({
    kakaopay: true,
    naverpay: true,
    tosspay: false,
    payco: false,
    samsungpay: false,
    applepay: false,
  });

  // 쿠폰 및 포인트
  const [userPoints, setUserPoints] = useState(5000);
  const [userCoupons] = useState([
    { id: "WELCOME10", name: "웰컴 쿠폰 10%", discount: 0.1, minAmount: 50000 },
    { id: "MONTH5", name: "이달의 쿠폰 5%", discount: 0.05, minAmount: 30000 },
    { id: "VIP15", name: "VIP 쿠폰 15%", discount: 0.15, minAmount: 100000 },
  ]);

  const handleCategoryClick = (category: string) => {
    setCurrentPage({ type: "category", category });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductClick = (productId: number) => {
    setCurrentPage({ type: "product", productId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToHome = () => {
    setCurrentPage({ type: "home" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPrevious = () => {
    if (currentPage.type === "product") {
      setCurrentPage({ type: "home" });
    } else {
      setCurrentPage({ type: "home" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (productId: number, quantity: number, color: string, size: string) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.productId === productId && item.color === color && item.size === size
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      return [...prev, { productId, quantity, color, size }];
    });
  };

  const handleUpdateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleLogin = (email: string, token: string) => {
    setUserEmail(email);
    setAccessToken(token);
  };

  const handleSignup = (email: string, name: string) => {
    setUserEmail(email);
    // 실제로는 백엔드에 회원가입 요청을 보내야 함
  };

  const handleLoginClick = () => {
    setCurrentPage({ type: "login" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignupClick = () => {
    setCurrentPage({ type: "signup" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdminClick = () => {
    setCurrentPage({ type: "admin" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAccountClick = () => {
    setCurrentPage({ type: "account" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    setUserEmail("");
    setCartItems([]);
    setAccessToken("");
  };

  const handleCheckoutClick = () => {
    setCurrentPage({ type: "checkout" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEventClick = (eventId: string) => {
    setCurrentPage({ type: "event", eventId });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 회원가입 페이지
  if (currentPage.type === "signup") {
    return (
      <>
        <SignupPage
          onSignup={handleSignup}
          onBack={handleBackToHome}
          onLoginClick={handleLoginClick}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 로그인 페이지
  if (currentPage.type === "login") {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onBack={handleBackToHome}
          onSignupClick={handleSignupClick}
          onAdminLogin={handleAdminClick}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 관리자 페이지
  if (currentPage.type === "admin") {
    return (
      <>
        <AdminPage
          onBack={handleBackToHome}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 계정 페이지
  if (currentPage.type === "account") {
    return (
      <>
        <AccountPage
          userEmail={userEmail}
          onBack={handleBackToHome}
          onLogout={handleLogout}
          accessToken={accessToken}
          onProductClick={handleProductClick}
          onEventClick={handleEventClick}
          savedCards={savedCards}
          onUpdateSavedCards={setSavedCards}
          linkedSimplePay={linkedSimplePay}
          onUpdateLinkedSimplePay={setLinkedSimplePay}
          userInfo={userInfo}
          onUpdateUserInfo={setUserInfo}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 결제 페이지
  if (currentPage.type === "checkout") {
    return (
      <>
        <CheckoutPage
          cartItems={cartItems}
          onBack={handleBackToHome}
          onComplete={() => {
            setCartItems([]);
            handleBackToHome();
          }}
          userInfo={userInfo}
          userPoints={userPoints}
          userCoupons={userCoupons}
          onUpdateUserInfo={setUserInfo}
          savedCards={savedCards}
          linkedSimplePay={linkedSimplePay}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 이벤트 상세 페이지
  if (currentPage.type === "event") {
    return (
      <>
        <Header 
          onCategoryClick={handleCategoryClick} 
          onLogoClick={handleBackToHome}
          onSearchClick={() => setIsSearchOpen(true)}
          onLoginClick={handleLoginClick}
          onAccountClick={handleAccountClick}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItems.length}
          userEmail={userEmail}
        />
        <EventDetailPage
          eventId={currentPage.eventId}
          onBack={handleBackToHome}
        />
        <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onProductClick={handleProductClick}
        />
        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setIsCartOpen(false);
            handleCheckoutClick();
          }}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 카테고리 페이지
  if (currentPage.type === "category") {
    return (
      <>
        <Header 
          onCategoryClick={handleCategoryClick} 
          onLogoClick={handleBackToHome}
          onSearchClick={() => setIsSearchOpen(true)}
          onLoginClick={handleLoginClick}
          onAccountClick={handleAccountClick}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItems.length}
          userEmail={userEmail}
        />
        <CategoryPage
          category={currentPage.category}
          onProductClick={handleProductClick}
          onBack={handleBackToHome}
        />
        <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onProductClick={handleProductClick}
        />
        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setIsCartOpen(false);
            handleCheckoutClick();
          }}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 상품 상세 페이지
  if (currentPage.type === "product") {
    return (
      <>
        <Header 
          onCategoryClick={handleCategoryClick} 
          onLogoClick={handleBackToHome}
          onSearchClick={() => setIsSearchOpen(true)}
          onLoginClick={handleLoginClick}
          onAccountClick={handleAccountClick}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItems.length}
          userEmail={userEmail}
        />
        <ProductDetail
          productId={currentPage.productId}
          onBack={handleBackToPrevious}
          onAddToCart={handleAddToCart}
          accessToken={accessToken}
        />
        <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onProductClick={handleProductClick}
        />
        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setIsCartOpen(false);
            handleCheckoutClick();
          }}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // 홈 페이지
  return (
    <div className="min-h-screen bg-brand-cream">
      <Header 
        onCategoryClick={handleCategoryClick} 
        onLogoClick={handleBackToHome}
        onSearchClick={() => setIsSearchOpen(true)}
        onLoginClick={handleLoginClick}
        onAccountClick={handleAccountClick}
        onCartClick={() => setIsCartOpen(true)}
        cartItemsCount={cartItems.length}
        userEmail={userEmail}
      />
      <div className="mt-48 mobile-mt-24">
        <FeaturedSection />
      </div>
      <CategorySection />
      <ProductGrid 
        onProductClick={handleProductClick} 
        onViewMoreClick={() => handleCategoryClick('BEST')}
      />
      <InstagramFeed />
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onProductClick={handleProductClick}
      />
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
      />
      <Toaster position="top-center" />
    </div>
  );
}