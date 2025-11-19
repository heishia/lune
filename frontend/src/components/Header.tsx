import { Menu, Search, User, ShoppingCart, X, Moon } from "lucide-react";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { CartItem } from "../types/cart";

const categories = [
  "BEST",
  "NEW",
  "TOP",
  "BOTTOM",
  "ONEPIECE",
  "SET",
  "SHOES",
  "BAG & ACC",
  "All"
];

interface HeaderProps {
  onCategoryClick?: (category: string) => void;
  onLogoClick?: () => void;
  onSearchClick?: () => void;
  onLoginClick?: () => void;
  onAccountClick?: () => void;
  onCartClick?: () => void;
  cartItemsCount?: number;
  userEmail?: string;
}

export function Header({ 
  onCategoryClick, 
  onLogoClick,
  onSearchClick,
  onLoginClick,
  onAccountClick,
  onCartClick,
  cartItemsCount = 0,
  userEmail
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (category: string) => {
    setIsMenuOpen(false);
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  const handleUserIconClick = () => {
    if (userEmail) {
      // 로그인 상태면 계정 페이지로
      if (onAccountClick) {
        onAccountClick();
      }
    } else {
      // 비로그인 상태면 로그인 페이지로
      if (onLoginClick) {
        onLoginClick();
      }
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-brand-warm-taupe/20 z-50">
        <div className="relative flex items-start justify-between px-4 mobile-px-3 pt-6 mobile-pt-4 pb-36 mobile-pb-24">
          {/* Left - Menu */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 mobile-p-1.5 hover:bg-brand-warm-taupe/10 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5 mobile-w-4 mobile-h-4 text-brand-terra-cotta" />
          </button>

          {/* Center - Logo */}
          <button 
            onClick={handleLogoClick}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <img src={logo} alt="LUNE" className="h-11 mobile-h-8 w-auto" />
          </button>

          {/* Right - Icons */}
          <div className="flex items-center gap-2 mobile-gap-1">
            <button 
              onClick={onSearchClick}
              className="p-2 mobile-p-1.5 hover:bg-brand-warm-taupe/10 rounded-md transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 mobile-w-3 mobile-h-3 text-brand-terra-cotta" />
            </button>
            <button 
              onClick={handleUserIconClick}
              className="p-2 mobile-p-1.5 hover:bg-brand-warm-taupe/10 rounded-md transition-colors relative"
              aria-label={userEmail ? "My Account" : "Login"}
            >
              {userEmail ? (
                <div className="relative">
                  <Moon className="w-4 h-4 mobile-w-3 mobile-h-3 text-brand-terra-cotta" fill="currentColor" />
                  {/* 빛나는 애니메이션 효과 */}
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <Moon className="w-4 h-4 mobile-w-3 mobile-h-3 text-brand-terra-cotta" fill="currentColor" />
                  </div>
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-4 h-4 mobile-w-3 mobile-h-3 rounded-full bg-brand-terra-cotta/20 blur-sm"></div>
                  </div>
                </div>
              ) : (
                <User className="w-4 h-4 mobile-w-3 mobile-h-3 text-brand-terra-cotta" />
              )}
            </button>
            <button 
              onClick={onCartClick}
              className="p-2 mobile-p-1.5 hover:bg-brand-warm-taupe/10 rounded-md transition-colors relative"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 mobile-w-3 mobile-h-3 text-brand-terra-cotta" />
              {cartItemsCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 mobile-w-3 mobile-h-3 bg-brand-terra-cotta text-brand-cream rounded-full flex items-center justify-center text-[10px] mobile-text-8">
                  {cartItemsCount > 9 ? "9+" : cartItemsCount}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] bg-white border-brand-warm-taupe/30">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-brand-terra-cotta tracking-[0.2em]">CATEGORIES</SheetTitle>
            <SheetDescription className="sr-only">Browse our product categories</SheetDescription>
          </SheetHeader>
          
          <nav className="flex flex-col gap-1">
            {categories.map((category) => (
              <button
                key={category}
                className="text-left px-4 py-3 text-brand-terra-cotta hover:bg-brand-warm-taupe/10 transition-colors tracking-wide"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}