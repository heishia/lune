import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getProducts, Product } from "../utils/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductClick: (productId: number) => void;
}

export function SearchModal({ isOpen, onClose, onProductClick }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchAllProducts = async () => {
        try {
          setLoading(true);
          const response = await getProducts({ limit: 1000 });
          setAllProducts(response.products);
        } catch (error) {
          console.error("Failed to fetch products:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllProducts();
    }
  }, [isOpen]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = allProducts.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(query.toLowerCase())) ||
      product.category.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(results);
  };

  const handleProductClick = (productId: number) => {
    onProductClick(productId);
    onClose();
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-brand-cream border-brand-warm-taupe/30">
        <DialogHeader>
          <DialogTitle className="text-brand-terra-cotta tracking-wider">
            SEARCH PRODUCTS
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for products by name, category, or description
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-warm-taupe" />
          <Input
            type="text"
            placeholder="상품명, 카테고리로 검색하세요..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-white border-brand-warm-taupe/30 text-brand-terra-cotta placeholder:text-brand-warm-taupe/50"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8 text-brand-warm-taupe text-sm">
              로딩 중...
            </div>
          ) : searchQuery === "" ? (
            <div className="text-center py-8 text-brand-warm-taupe text-sm">
              검색어를 입력하세요
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-brand-warm-taupe text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-brand-warm-taupe/10 rounded-lg transition-colors text-left"
                >
                  <div className="w-16 h-16 bg-brand-warm-taupe/10 rounded overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm text-brand-terra-cotta mb-1 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.original_price && (
                        <span className="text-xs text-brand-warm-taupe/60 line-through">
                          {product.original_price.toLocaleString()}원
                        </span>
                      )}
                      <span className="text-sm text-brand-terra-cotta">
                        {product.price.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {product.category.slice(0, 2).map((cat, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-brand-warm-taupe bg-brand-warm-taupe/10 px-2 py-0.5 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}