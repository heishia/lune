import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart, ChevronLeft } from "lucide-react";
import { getProducts, Product } from "../utils/api";

interface CategoryPageProps {
  category: string;
  onProductClick: (productId: number) => void;
  onBack: () => void;
}

export function CategoryPage({ category, onProductClick, onBack }: CategoryPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let response;
        
        if (category === "All") {
          response = await getProducts({});
        } else if (category === "BEST") {
          response = await getProducts({});
          setProducts(response.products.filter(p => p.is_best));
          setLoading(false);
          return;
        } else if (category === "NEW") {
          response = await getProducts({});
          setProducts(response.products.filter(p => p.is_new));
          setLoading(false);
          return;
        } else {
          response = await getProducts({ category });
        }
        
        setProducts(response.products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const getCategoryTitle = (cat: string) => {
    const titles: { [key: string]: string } = {
      "All": "ALL ITEMS",
      "BEST": "BEST SELLERS",
      "NEW": "NEW ARRIVALS",
      "TOP": "TOPS",
      "BOTTOM": "BOTTOMS",
      "ONEPIECE": "ONE PIECE",
      "SET": "MATCHING SETS",
      "SHOES": "SHOES",
      "BAG & ACC": "BAGS & ACCESSORIES",
    };
    return titles[cat] || cat;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-brand-warm-taupe/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 max-[500px]:px-3 py-6 max-[500px]:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-brand-terra-cotta hover:text-brand-warm-taupe transition-colors mb-4 max-[500px]:mb-3"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm tracking-wider">BACK TO HOME</span>
          </button>
          
          <div className="text-center">
            <div className="inline-block border-t border-b border-brand-warm-taupe/40 py-2 px-12 max-[500px]:px-6">
              <h1 className="text-sm tracking-[0.3em] text-brand-terra-cotta">
                {getCategoryTitle(category)}
              </h1>
            </div>
            <p className="text-xs text-brand-warm-taupe mt-4 max-[500px]:mt-3 tracking-wider">
              {products.length} ITEMS
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 max-[500px]:px-3 py-12 max-[500px]:py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-brand-warm-taupe tracking-wider">로딩 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-warm-taupe tracking-wider">
              No products available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-[500px]:grid-cols-1 gap-6 max-[500px]:gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer max-[500px]:flex max-[500px]:gap-4 max-[500px]:items-start"
                onClick={() => onProductClick(product.id)}
              >
                <div className="relative mb-3 max-[500px]:mb-0 max-[500px]:w-24 max-[500px]:flex-shrink-0 bg-brand-warm-taupe/10 rounded-lg overflow-hidden aspect-square max-[500px]:aspect-square">
                  <ImageWithFallback
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Tags */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && (
                      <div className="bg-brand-terra-cotta text-brand-cream px-2 py-0.5 text-[10px] tracking-wider">
                        NEW
                      </div>
                    )}
                    {product.is_best && (
                      <div className="bg-brand-warm-taupe text-brand-cream px-2 py-0.5 text-[10px] tracking-wider">
                        BEST
                      </div>
                    )}
                    {product.original_price && (
                      <div className="bg-brand-terra-cotta text-brand-cream px-2 py-0.5 text-[10px] tracking-wider">
                        SALE
                      </div>
                    )}
                  </div>

                  {/* Like Button */}
                  <button
                    className="absolute top-2 right-2 w-8 h-8 bg-brand-cream rounded-full flex items-center justify-center hover:bg-brand-warm-taupe/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 좋아요 기능 추가 가능
                    }}
                  >
                    <Heart className="w-4 h-4 text-brand-terra-cotta" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="text-center max-[500px]:text-left max-[500px]:flex-1">
                  <h3 className="text-[11px] tracking-wide mb-1.5 text-brand-terra-cotta group-hover:text-brand-warm-taupe transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-center max-[500px]:justify-start gap-2">
                    {product.original_price && (
                      <span className="text-[10px] text-brand-warm-taupe/60 line-through">
                        {product.original_price.toLocaleString()} won
                      </span>
                    )}
                    <span className="text-xs text-brand-terra-cotta">
                      {product.price.toLocaleString()} won
                    </span>
                  </div>
                  
                  {/* Color Options Preview */}
                  <div className="flex justify-center gap-1 mt-2">
                    {product.colors.slice(0, 3).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full border border-brand-warm-taupe/30"
                        style={{
                          backgroundColor:
                            color === "Beige" ? "#8C7B6C" :
                            color === "Cream" ? "#F5EFE7" :
                            color === "Taupe" ? "#8C7B6C" :
                            color === "White" ? "#FFFFFF" :
                            color === "Black" ? "#000000" :
                            color === "Brown" ? "#894646" :
                            color === "Ivory" ? "#FFFFF0" :
                            color === "Camel" ? "#C19A6B" :
                            color === "Nude" ? "#E3BC9A" :
                            color === "Pearl" ? "#F0EAD6" :
                            "#8C7B6C",
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}