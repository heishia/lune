import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, ShoppingCart, ChevronLeft } from "lucide-react";
import { getProduct, Product } from "../utils/api";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onAddToCart: (productId: number, quantity: number, color: string, size: string) => void;
  accessToken?: string;
}

export function ProductDetail({ productId, onBack, onAddToCart, accessToken }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProduct(productId);
        setProduct(data);
        if (data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        if (data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("상품 정보를 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // 찜 상태 확인
  useEffect(() => {
    if (accessToken && productId) {
      checkFavoriteStatus();
    }
  }, [productId, accessToken]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/favorites/${productId}/check`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!accessToken) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        // 찜 제거
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/favorites/${productId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          setIsFavorite(false);
          toast.success("찜 목록에서 제거되었습니다");
        } else {
          throw new Error("Failed to remove from favorites");
        }
      } else {
        // 찜 추가
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/favorites`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ productId }),
          }
        );

        if (response.ok) {
          setIsFavorite(true);
          toast.success("찜 목록에 추가되었습니다");
        } else {
          throw new Error("Failed to add to favorites");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("찜 기능을 사용할 수 없습니다");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-warm-taupe tracking-wider mb-4">Product not found</p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-warm-taupe tracking-wider mb-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  const getColorHex = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "Beige": "#8C7B6C",
      "Cream": "#F5EFE7",
      "Taupe": "#8C7B6C",
      "White": "#FFFFFF",
      "Black": "#000000",
      "Brown": "#894646",
      "Ivory": "#FFFFF0",
      "Camel": "#C19A6B",
      "Nude": "#E3BC9A",
      "Pearl": "#F0EAD6",
    };
    return colorMap[color] || "#8C7B6C";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-brand-warm-taupe/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 max-[500px]:px-3 py-6 max-[500px]:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-brand-terra-cotta hover:text-brand-warm-taupe transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm tracking-wider">BACK</span>
          </button>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-6xl mx-auto px-4 max-[500px]:px-3 py-12 max-[500px]:py-8">
        <div className="grid md:grid-cols-2 max-[500px]:flex max-[500px]:flex-col gap-12 max-[500px]:gap-8">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-[3/4] max-[500px]:aspect-[4/5] bg-brand-warm-taupe/10 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tags */}
            <div className="absolute top-4 left-4 max-[500px]:top-2 max-[500px]:left-2 flex flex-col gap-2 max-[500px]:gap-1">
              {product.is_new && (
                <div className="bg-brand-terra-cotta text-brand-cream px-3 py-1 max-[500px]:px-2 max-[500px]:py-0.5 text-xs max-[500px]:text-[10px] tracking-wider">
                  NEW
                </div>
              )}
              {product.is_best && (
                <div className="bg-brand-warm-taupe text-brand-cream px-3 py-1 max-[500px]:px-2 max-[500px]:py-0.5 text-xs max-[500px]:text-[10px] tracking-wider">
                  BEST
                </div>
              )}
              {product.original_price && (
                <div className="bg-brand-terra-cotta text-brand-cream px-3 py-1 max-[500px]:px-2 max-[500px]:py-0.5 text-xs max-[500px]:text-[10px] tracking-wider">
                  SALE
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6 max-[500px]:mb-4">
              <div className="flex gap-2 mb-3 max-[500px]:mb-2 flex-wrap">
                {product.category.map((cat, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] tracking-widest text-brand-warm-taupe"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl max-[500px]:text-xl tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3">
                {product.name}
              </h1>
              <p className="text-sm max-[500px]:text-xs text-brand-warm-taupe leading-relaxed mb-6 max-[500px]:mb-4">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div className="mb-8 max-[500px]:mb-6 pb-8 max-[500px]:pb-6 border-b border-brand-warm-taupe/20">
              <div className="flex items-center gap-3">
                {product.original_price && (
                  <span className="text-brand-warm-taupe/60 line-through">
                    {product.original_price.toLocaleString()} won
                  </span>
                )}
                <span className="text-2xl max-[500px]:text-xl text-brand-terra-cotta">
                  {product.price.toLocaleString()} won
                </span>
              </div>
              {product.original_price && (
                <div className="mt-2">
                  <span className="text-sm max-[500px]:text-xs text-brand-terra-cotta">
                    {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Color Selection */}
            <div className="mb-6 max-[500px]:mb-4">
              <h3 className="text-xs tracking-wider text-brand-terra-cotta mb-3 max-[500px]:mb-2">
                COLOR
              </h3>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 max-[500px]:w-12 max-[500px]:h-12 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? "border-brand-terra-cotta scale-110"
                        : "border-brand-warm-taupe/30 hover:border-brand-warm-taupe"
                    }`}
                    style={{ backgroundColor: getColorHex(color) }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-xs text-brand-warm-taupe mt-2">{selectedColor}</p>
            </div>

            {/* Size Selection */}
            <div className="mb-6 max-[500px]:mb-4">
              <h3 className="text-xs tracking-wider text-brand-terra-cotta mb-3 max-[500px]:mb-2">
                SIZE
              </h3>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 max-[500px]:px-5 max-[500px]:py-3 border text-xs tracking-wider transition-all ${
                      selectedSize === size
                        ? "border-brand-terra-cotta bg-brand-terra-cotta text-brand-cream"
                        : "border-brand-warm-taupe/30 text-brand-warm-taupe hover:border-brand-terra-cotta"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8 max-[500px]:mb-6">
              <h3 className="text-xs tracking-wider text-brand-terra-cotta mb-3 max-[500px]:mb-2">
                QUANTITY
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 max-[500px]:w-10 max-[500px]:h-10 border border-brand-warm-taupe/30 text-brand-warm-taupe hover:border-brand-terra-cotta hover:text-brand-terra-cotta transition-colors"
                >
                  -
                </button>
                <span className="w-12 max-[500px]:w-14 text-center text-brand-terra-cotta">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 max-[500px]:w-10 max-[500px]:h-10 border border-brand-warm-taupe/30 text-brand-warm-taupe hover:border-brand-terra-cotta hover:text-brand-terra-cotta transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 max-[500px]:flex-col mt-auto">
              <button 
                onClick={() => {
                  if (!selectedColor || !selectedSize) {
                    toast.error("색상과 사이즈를 선택해주세요");
                    return;
                  }
                  onAddToCart(product.id, quantity, selectedColor, selectedSize);
                  toast.success("장바구니에 추가되었습니다!");
                }}
                className="flex-1 bg-brand-terra-cotta text-brand-cream py-4 max-[500px]:py-5 hover:bg-brand-warm-taupe transition-colors flex items-center justify-center gap-2 tracking-wider text-sm max-[500px]:text-base"
              >
                <ShoppingCart className="w-5 h-5" />
                ADD TO CART
              </button>
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`w-14 h-14 max-[500px]:w-full max-[500px]:h-12 border transition-colors flex items-center justify-center ${
                  isFavorite
                    ? "border-brand-terra-cotta bg-brand-terra-cotta text-white"
                    : "border-brand-warm-taupe/30 text-brand-terra-cotta hover:bg-brand-warm-taupe/10"
                }`}
              >
                {favoriteLoading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                )}
              </button>
            </div>

            {/* Total Price */}
            <div className="mt-6 max-[500px]:mt-4 pt-6 max-[500px]:pt-4 border-t border-brand-warm-taupe/20">
              <div className="flex justify-between items-center">
                <span className="text-sm tracking-wider text-brand-warm-taupe">
                  TOTAL
                </span>
                <span className="text-xl max-[500px]:text-lg text-brand-terra-cotta">
                  {(product.price * quantity).toLocaleString()} won
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}