import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { CartItem } from "../types/cart";
import { getProduct, Product } from "../utils/api";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout?: () => void;
}

export function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartModalProps) {
  const [products, setProducts] = useState<Map<number, Product>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
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
      fetchProducts();
    }
  }, [isOpen, cartItems]);

  const total = cartItems.reduce((sum, item) => {
    const product = products.get(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mobile-max-w-95vw max-h-[85vh] bg-brand-cream border-brand-warm-taupe/30 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-brand-terra-cotta tracking-wider flex items-center gap-2 mobile-text-sm">
            <ShoppingBag className="w-5 h-5 mobile-w-4 mobile-h-4" />
            SHOPPING CART ({cartItems.length})
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage items in your shopping cart
          </DialogDescription>
        </DialogHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <ShoppingBag className="w-16 h-16 text-brand-warm-taupe/30 mx-auto mb-4" />
              <p className="text-brand-warm-taupe text-sm">장바구니가 비어있습니다</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {loading ? (
                <div className="text-center py-8 text-brand-warm-taupe text-sm">로딩 중...</div>
              ) : (
                cartItems.map((item) => {
                  const product = products.get(item.productId);
                  if (!product) return null;

                return (
                  <div
                    key={`${item.productId}-${item.color}-${item.size}`}
                    className="flex gap-4 mobile-flex-col mobile-gap-3 bg-white p-4 mobile-p-3 rounded-lg border border-brand-warm-taupe/20"
                  >
                    <div className="w-24 h-24 mobile-w-full mobile-h-48 bg-brand-warm-taupe/10 rounded overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2 mobile-mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm mobile-text-xs text-brand-terra-cotta mb-1">
                            {product.name}
                          </h3>
                          <div className="text-xs mobile-text-10px text-brand-warm-taupe space-x-2 mobile-space-x-1">
                            <span>Color: {item.color}</span>
                            <span>Size: {item.size}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          className="text-brand-warm-taupe hover:text-brand-terra-cotta transition-colors mobile-ml-2"
                        >
                          <X className="w-4 h-4 mobile-w-5 mobile-h-5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-3 mobile-flex-col mobile-items-start mobile-gap-3">
                        <div className="flex items-center gap-2 bg-brand-cream rounded">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 mobile-w-9 mobile-h-9 flex items-center justify-center border border-brand-warm-taupe/30 text-brand-warm-taupe hover:border-brand-terra-cotta hover:text-brand-terra-cotta transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3 mobile-w-4 mobile-h-4" />
                          </button>
                          <span className="w-8 mobile-w-10 text-center text-sm mobile-text-base text-brand-terra-cotta">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 mobile-w-9 mobile-h-9 flex items-center justify-center border border-brand-warm-taupe/30 text-brand-warm-taupe hover:border-brand-terra-cotta hover:text-brand-terra-cotta transition-colors"
                          >
                            <Plus className="w-3 h-3 mobile-w-4 mobile-h-4" />
                          </button>
                        </div>

                        <div className="text-right mobile-text-left mobile-w-full">
                          <div className="text-brand-terra-cotta text-sm mobile-text-base mobile-font-medium">
                            {(product.price * item.quantity).toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-brand-warm-taupe/20 pt-4 mobile-pt-3 space-y-4 mobile-space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-brand-warm-taupe tracking-wider mobile-text-sm">TOTAL</span>
                <span className="text-xl mobile-text-lg text-brand-terra-cotta">
                  {total.toLocaleString()}원
                </span>
              </div>

              <div className="flex gap-2 mobile-flex-col">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-brand-warm-taupe/30 text-brand-terra-cotta hover:bg-brand-warm-taupe/10 mobile-py-3 mobile-h-14"
                >
                  계속 쇼핑하기
                </Button>
                <Button
                  className="flex-1 bg-brand-terra-cotta text-brand-cream hover:bg-brand-warm-taupe mobile-py-3 mobile-h-14"
                  onClick={onCheckout}
                >
                  주문하기
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}