import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getProduct, getContentByReference, getProductReviews, getFavoriteCount, canReviewProduct, Product, Content, ContentBlock, Review } from "../utils/api";
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
  const [productContent, setProductContent] = useState<Content | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [reviewOrderItemId, setReviewOrderItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProduct(productId);
        console.log("Product data received:", data);
        console.log("Product name:", data.name);
        // product를 먼저 설정한 후 loading을 false로 설정하여 깜빡임 방지
        setProduct(data);
        if (data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        if (data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setLoading(false);
        toast.error("상품 정보를 불러올 수 없습니다");
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

  // 상품 상세 콘텐츠 불러오기
  useEffect(() => {
    const fetchProductContent = async () => {
      try {
        setContentLoading(true);
        const content = await getContentByReference("product", productId.toString());
        setProductContent(content);
      } catch (error) {
        console.error("Failed to fetch product content:", error);
        setProductContent(null);
      } finally {
        setContentLoading(false);
      }
    };

    if (productId) {
      fetchProductContent();
    }
  }, [productId]);

  // 후기 및 찜 개수 불러오기
  useEffect(() => {
    const fetchReviewsAndCounts = async () => {
      try {
        setReviewLoading(true);
        const reviewsData = await getProductReviews(productId, 4);
        setReviews(reviewsData.reviews);
        setReviewCount(reviewsData.total);
        
        // 찜 개수는 에러가 발생해도 무시 (테이블이 없을 수 있음)
        try {
          const favoriteData = await getFavoriteCount(productId);
          setFavoriteCount(favoriteData.count);
        } catch (error) {
          console.warn("Failed to fetch favorite count:", error);
          setFavoriteCount(0);
        }

        // 리뷰 작성 가능 여부 확인 (로그인한 경우만)
        if (accessToken) {
          try {
            const reviewCheck = await canReviewProduct(productId);
            setCanReview(reviewCheck.can_review);
            setReviewOrderItemId(reviewCheck.order_item_id);
          } catch (error) {
            console.warn("Failed to check review permission:", error);
            setCanReview(false);
            setReviewOrderItemId(null);
          }
        } else {
          setCanReview(false);
          setReviewOrderItemId(null);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        setReviews([]);
        setReviewCount(0);
        setFavoriteCount(0);
        setCanReview(false);
        setReviewOrderItemId(null);
      } finally {
        setReviewLoading(false);
      }
    };

    if (productId) {
      fetchReviewsAndCounts();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-warm-taupe tracking-wider mb-4">로딩 중...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-white pt-56 max-[500px]:pt-28">
      {/* Product Detail */}
      <div className="max-w-6xl mx-auto px-4 max-[500px]:px-3 pb-12 max-[500px]:pb-8">
        <div className="grid md:grid-cols-2 max-[500px]:flex max-[500px]:flex-col gap-12 max-[500px]:gap-8">
          {/* Product Image Gallery */}
          <div className="relative">
            {(() => {
              // images 배열이 있으면 사용, 없으면 image_url을 배열로
              const images: string[] = (product as any).images?.length > 0 
                ? (product as any).images 
                : [product.image_url];
              const currentImage = images[currentImageIndex] || product.image_url;

              return (
                <>
                  <div className="aspect-[3/4] max-[500px]:aspect-[4/5] bg-brand-warm-taupe/10 rounded-lg overflow-hidden relative">
                    <ImageWithFallback
                      src={currentImage}
                      alt={`${product.name} - ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 이미지 네비게이션 버튼 */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                        >
                          <ChevronLeft className="w-6 h-6 text-brand-terra-cotta" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                        >
                          <ChevronRight className="w-6 h-6 text-brand-terra-cotta" />
                        </button>
                        
                        {/* 이미지 인디케이터 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentImageIndex 
                                  ? "bg-brand-terra-cotta w-4" 
                                  : "bg-white/70 hover:bg-white"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 썸네일 이미지 리스트 */}
                  {images.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex 
                              ? "border-brand-terra-cotta" 
                              : "border-transparent hover:border-brand-warm-taupe/50"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} 썸네일 ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Tags */}
            <div className="absolute top-4 left-4 max-[500px]:top-2 max-[500px]:left-2 flex flex-col gap-2 max-[500px]:gap-1 z-10">
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
            {/* Product Name - 최상단에 표시 */}
            <div className="mb-8 max-[500px]:mb-6 pb-8 max-[500px]:pb-6 border-b border-brand-warm-taupe/20">
              <h1 className="text-3xl max-[500px]:text-2xl font-bold tracking-wider text-brand-terra-cotta mb-4 max-[500px]:mb-3" style={{ display: 'block', visibility: 'visible' }}>
                {product.name || "상품명 로딩 중..."}
              </h1>
              <p className="text-sm max-[500px]:text-xs text-brand-warm-taupe leading-relaxed">
                {product.description}
              </p>
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
            <div className="mb-6 max-[500px]:mb-4">
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

            {/* Price - 수량 아래로 이동, 구분선 제거 */}
            <div className="mb-4 max-[500px]:mb-3">
              <div className="flex items-center gap-3">
                {product.original_price && (
                  <span className="text-brand-warm-taupe/60 line-through text-sm">
                    {product.original_price.toLocaleString()} won
                  </span>
                )}
                <span className="text-xl text-brand-terra-cotta">
                  {product.price.toLocaleString()} won
                </span>
                {product.original_price && (
                  <span className="text-sm text-brand-terra-cotta">
                    {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 max-[500px]:flex-col">
              <button 
                onClick={() => {
                  if (!selectedColor || !selectedSize) {
                    toast.error("색상과 사이즈를 선택해주세요");
                    return;
                  }
                  onAddToCart(product.id, quantity, selectedColor, selectedSize);
                  toast.success("장바구니에 추가되었습니다!");
                }}
                className="bg-brand-terra-cotta text-brand-cream py-3 px-6 max-[500px]:py-4 max-[500px]:w-full hover:bg-brand-warm-taupe transition-colors flex items-center justify-center gap-2 tracking-wider text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                장바구니 담기
              </button>
              <div className="flex items-center gap-4">
                {/* Review Count - 리뷰 */}
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-brand-warm-taupe fill-brand-warm-taupe/30" />
                  <span className="text-sm text-brand-warm-taupe">리뷰 {reviewCount}</span>
                </div>
                {/* Favorite - 좋아요 */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className="transition-colors"
                  >
                    {favoriteLoading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-brand-terra-cotta border-t-transparent rounded-full" />
                    ) : (
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-brand-terra-cotta text-brand-terra-cotta" : "text-brand-warm-taupe"}`} />
                    )}
                  </button>
                  <span className="text-sm text-brand-warm-taupe">{favoriteCount}</span>
                </div>
              </div>
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

        {/* Reviews Section - 2x2 Grid */}
        {reviewLoading ? (
          <div className="mt-16 pt-8 border-t border-brand-warm-taupe/20">
            <div className="text-center text-brand-warm-taupe">
              후기를 불러오는 중...
            </div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="mt-16 pt-8 border-t border-brand-warm-taupe/20">
            <h2 className="text-lg tracking-wider text-brand-terra-cotta mb-8 text-center">
              REVIEWS
            </h2>
            <div className="grid grid-cols-2 gap-4 max-[500px]:grid-cols-1">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-brand-warm-taupe/20 rounded-lg p-4 hover:border-brand-warm-taupe/40 transition-colors"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-brand-terra-cotta">
                          {review.user_name}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "fill-brand-terra-cotta text-brand-terra-cotta"
                                  : "text-brand-warm-taupe/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-brand-warm-taupe/60">
                      {new Date(review.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Review Content */}
                  <p className="text-xs text-brand-warm-taupe leading-relaxed mb-3 line-clamp-3">
                    {review.content}
                  </p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {review.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review image ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded border border-brand-warm-taupe/20"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 상품 상세 설명 (에디터에서 작성한 콘텐츠) */}
        {contentLoading ? (
          <div className="mt-16 pt-8 border-t border-brand-warm-taupe/20">
            <div className="text-center text-brand-warm-taupe">
              상세 정보 불러오는 중...
            </div>
          </div>
        ) : productContent && productContent.blocks && productContent.blocks.length > 0 ? (
          <div className="mt-16 pt-8 border-t border-brand-warm-taupe/20">
            <h2 className="text-lg tracking-wider text-brand-terra-cotta mb-8 text-center">
              DETAIL
            </h2>
            <div className="max-w-3xl mx-auto">
              {productContent.blocks.map((block: ContentBlock, index: number) => (
                <div key={block.id || index} className="mb-6">
                  {/* 텍스트 블록 */}
                  {block.type === "text" && block.data?.text && (
                    <div className="text-sm text-brand-warm-taupe leading-relaxed whitespace-pre-wrap">
                      {block.data.text}
                    </div>
                  )}

                  {/* 이미지 블록 */}
                  {block.type === "image" && block.data?.url && (
                    <div className="space-y-2">
                      <img
                        src={block.data.url}
                        alt={block.data.caption || "상품 이미지"}
                        className="w-full rounded-lg"
                      />
                      {block.data.caption && (
                        <p className="text-xs text-brand-warm-taupe text-center">
                          {block.data.caption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 동영상 블록 */}
                  {block.type === "video" && block.data?.url && (
                    <div className="space-y-2">
                      <video
                        src={block.data.url}
                        controls
                        className="w-full rounded-lg"
                      />
                      {block.data.caption && (
                        <p className="text-xs text-brand-warm-taupe text-center">
                          {block.data.caption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 구분선 블록 */}
                  {block.type === "divider" && (
                    <hr className="my-8 border-brand-warm-taupe/30" />
                  )}

                  {/* 인용구 블록 */}
                  {block.type === "quote" && block.data?.text && (
                    <div className="border-l-4 border-brand-terra-cotta/50 pl-4 py-2 bg-brand-cream/30 rounded-r">
                      <p className="text-base italic text-brand-warm-taupe">
                        {block.data.text}
                      </p>
                      {block.data.author && (
                        <p className="text-sm text-brand-warm-taupe/70 mt-2">
                          - {block.data.author}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}