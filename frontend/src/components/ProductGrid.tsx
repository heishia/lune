import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart } from "lucide-react";
import { getBestProducts } from "../data/products";

interface ProductGridProps {
  onProductClick?: (productId: number) => void;
  onViewMoreClick?: () => void;
}

export function ProductGrid({ onProductClick, onViewMoreClick }: ProductGridProps) {
  const products = getBestProducts(5);

  return (
    <div className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-xs tracking-[0.3em] text-brand-terra-cotta font-bold text-[24px]">BEST</h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="group cursor-pointer"
              onClick={() => onProductClick?.(product.id)}
            >
              <div className="relative mb-3 bg-brand-warm-taupe/10 rounded-lg overflow-hidden aspect-square">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.originalPrice && (
                  <div className="absolute top-2 left-2 bg-brand-terra-cotta text-brand-cream px-2 py-0.5 text-[10px] tracking-wider">
                    SALE
                  </div>
                )}
                <button 
                  className="absolute top-2 right-2 w-8 h-8 bg-brand-cream rounded-full flex items-center justify-center hover:bg-brand-warm-taupe/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="w-4 h-4 text-brand-terra-cotta" />
                </button>
              </div>
              <div className="text-center">
                <h3 className="text-[11px] tracking-wide mb-1.5 text-brand-terra-cotta">
                  {product.name}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  {product.originalPrice && (
                    <span className="text-[10px] text-brand-warm-taupe/60 line-through">
                      {product.originalPrice.toLocaleString()} won
                    </span>
                  )}
                  <span className="text-xs text-brand-terra-cotta">{product.price.toLocaleString()} won</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="flex justify-center mt-8">
          <button 
            className="border border-brand-warm-taupe/40 px-8 py-2 text-xs tracking-widest hover:bg-brand-warm-taupe/10 transition-colors text-brand-terra-cotta"
            onClick={onViewMoreClick}
          >
            VIEW MORE
          </button>
        </div>
      </div>
    </div>
  );
}