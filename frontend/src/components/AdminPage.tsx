import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, LogOut, Image as ImageIcon, Instagram, Package, Calendar, Gift, Megaphone } from "lucide-react";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { InstagramSettings } from "./InstagramSettings";
import { EventBannerData } from "./EventBanner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { BannerManagement } from "./BannerManagement";
import { CouponPointManagement } from "./CouponPointManagement";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string[];
  colors: string[];
  sizes: string[];
  image_url: string;
  stock_quantity: number;
  is_new: boolean;
  is_best: boolean;
  is_active: boolean;
  created_at: string;
}

interface AdminPageProps {
  onBack: () => void;
}

const CATEGORIES = ["TOP", "BOTTOM", "ONEPIECE", "SET", "SHOES", "BAG & ACC"];
const SIZES = ["S", "M", "L", "XL", "230", "235", "240", "245", "250", "ONE SIZE"];

export function AdminPage({ onBack }: AdminPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Instagram 설정 상태
  const [instagramToken, setInstagramToken] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [hasInstagramToken, setHasInstagramToken] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    original_price: 0,
    category: [] as string[],
    colors: "",
    sizes: [] as string[],
    image_url: "",
    stock_quantity: 0,
    is_new: false,
    is_best: false,
  });

  // 상품 목록 조회
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterCategory !== "All") {
        queryParams.set("category", filterCategory);
      }
      queryParams.set("limit", "100");

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/products?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("상품 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterCategory]);

  // 상품 추가/수정 다이얼로그 열기
  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.original_price || 0,
        category: product.category,
        colors: product.colors.join(", "),
        sizes: product.sizes,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        is_new: product.is_new,
        is_best: product.is_best,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        original_price: 0,
        category: [],
        colors: "",
        sizes: [],
        image_url: "",
        stock_quantity: 0,
        is_new: false,
        is_best: false,
      });
    }
    setIsDialogOpen(true);
  };

  // 상품 저장 (추가 또는 수정)
  const handleSaveProduct = async () => {
    try {
      // 유효성 검사
      if (!formData.name || !formData.description || formData.price <= 0) {
        toast.error("필수 정보를 모두 입력해주세요");
        return;
      }

      if (formData.category.length === 0) {
        toast.error("카테고리를 최소 1개 선택해주세요");
        return;
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price > 0 ? formData.original_price : null,
        category: formData.category,
        colors: formData.colors.split(",").map((c) => c.trim()).filter((c) => c),
        sizes: formData.sizes,
        image_url: formData.image_url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
        stock_quantity: formData.stock_quantity,
        is_new: formData.is_new,
        is_best: formData.is_best,
        is_active: true,
      };

      const url = editingProduct
        ? `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/products/${editingProduct.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/products`;

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      toast.success(editingProduct ? "상품이 수정되었습니다" : "상품이 등록되었습니다");
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("상품 저장에 실패했습니다");
    }
  };

  // 상품 삭제
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("정말 이 상품을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast.success("상품이 삭제되었습니다");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("상품 삭제에 실패했습니다");
    }
  };

  // 카테고리 토글
  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }));
  };

  // 사이즈 토글
  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="bg-white border-b border-brand-warm-taupe/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="LUNE" className="h-10 w-auto" />
            <span className="text-brand-terra-cotta">관리자 페이지</span>
          </div>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-brand-terra-cotta text-brand-terra-cotta hover:bg-brand-terra-cotta hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-5 mb-6">
            <TabsTrigger value="products">상품 관리</TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              주문 관리
            </TabsTrigger>
            <TabsTrigger value="banners">
              <Megaphone className="w-4 h-4 mr-2" />
              배너 관리
            </TabsTrigger>
            <TabsTrigger value="coupons">
              <Gift className="w-4 h-4 mr-2" />
              쿠폰&포인트
            </TabsTrigger>
            <TabsTrigger value="instagram">
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </TabsTrigger>
          </TabsList>

          {/* 상품 관리 탭 */}
          <TabsContent value="products" className="space-y-6">
            {/* 상단 액션 바 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-brand-terra-cotta">상품 목록</h2>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48 border-brand-warm-taupe/30">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">전체</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                <Plus className="w-4 h-4 mr-2" />
                상품 추가
              </Button>
            </div>

            {/* 상품 테이블 */}
            {loading ? (
              <div className="text-center py-20 text-brand-warm-taupe">로딩 중...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-brand-warm-taupe">
                등록된 상품이 없습니다
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead className="w-24">이미지</TableHead>
                      <TableHead>상품명</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead className="text-right">가격</TableHead>
                      <TableHead className="text-center">재고</TableHead>
                      <TableHead className="text-center">NEW</TableHead>
                      <TableHead className="text-center">BEST</TableHead>
                      <TableHead className="text-right w-32">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{product.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {product.category.map((cat) => (
                              <span
                                key={cat}
                                className="px-2 py-1 bg-brand-cream text-brand-terra-cotta text-xs rounded"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.original_price && (
                            <div className="line-through text-brand-warm-taupe text-xs">
                              {product.original_price.toLocaleString()}원
                            </div>
                          )}
                          <div className="text-brand-terra-cotta">
                            {product.price.toLocaleString()}원
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {product.stock_quantity}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.is_new ? "✓" : ""}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.is_best ? "✓" : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(product)}
                              className="border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* 주문 관리 탭 */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-brand-terra-cotta">주문 관리</h2>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">주문번호</TableHead>
                    <TableHead className="w-24">이미지</TableHead>
                    <TableHead>상품명</TableHead>
                    <TableHead className="w-24">고객명</TableHead>
                    <TableHead className="text-center w-24">수량</TableHead>
                    <TableHead className="text-right w-28">금액</TableHead>
                    <TableHead className="w-32">주문일시</TableHead>
                    <TableHead className="w-32">배송상태</TableHead>
                    <TableHead className="w-32">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 임시 주문 데이터 */}
                  <TableRow>
                    <TableCell className="font-mono text-xs">20241118001</TableCell>
                    <TableCell>
                      <img
                        src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400"
                        alt="Cashmere Blend Knit"
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">Cashmere Blend Knit</div>
                        <div className="text-xs text-brand-warm-taupe">Beige / M</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">김루네</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      89,000원
                    </TableCell>
                    <TableCell className="text-xs text-brand-warm-taupe">
                      2024.11.15
                    </TableCell>
                    <TableCell>
                      <Select defaultValue="배송완료">
                        <SelectTrigger className="h-9 text-xs border-brand-warm-taupe/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="준비중">준비중</SelectItem>
                          <SelectItem value="배송중">배송중</SelectItem>
                          <SelectItem value="배송완료">배송완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10"
                        onClick={() => toast.success("주문 상태가 업데이트되었습니다")}
                      >
                        저장
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-mono text-xs">20241118002</TableCell>
                    <TableCell>
                      <img
                        src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400"
                        alt="Wide Leg Trousers"
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">Wide Leg Trousers</div>
                        <div className="text-xs text-brand-warm-taupe">Taupe / L</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">김루네</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      68,000원
                    </TableCell>
                    <TableCell className="text-xs text-brand-warm-taupe">
                      2024.11.16
                    </TableCell>
                    <TableCell>
                      <Select defaultValue="배송중">
                        <SelectTrigger className="h-9 text-xs border-brand-warm-taupe/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="준비중">준비중</SelectItem>
                          <SelectItem value="배송중">배송중</SelectItem>
                          <SelectItem value="배송완료">배송완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10"
                        onClick={() => toast.success("주문 상태가 업데이트되었습니다")}
                      >
                        저장
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-mono text-xs">20241118003</TableCell>
                    <TableCell>
                      <img
                        src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"
                        alt="Linen Blend Dress"
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">Linen Blend Dress</div>
                        <div className="text-xs text-brand-warm-taupe">Cream / S</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">김루네</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      125,000원
                    </TableCell>
                    <TableCell className="text-xs text-brand-warm-taupe">
                      2024.11.18
                    </TableCell>
                    <TableCell>
                      <Select defaultValue="준비중">
                        <SelectTrigger className="h-9 text-xs border-brand-warm-taupe/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="준비중">준비중</SelectItem>
                          <SelectItem value="배송중">배송중</SelectItem>
                          <SelectItem value="배송완료">배송완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10"
                        onClick={() => toast.success("주문 상태가 업데이트되었습니다")}
                      >
                        저장
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-brand-warm-taupe tracking-wide">
                💡 주문 관리 기능은 데이터베이스 연동 후 완전히 작동합니다. 
                현재는 임시 데이터로 표시되며, 실제 주문 데이터는 백엔드 구현 시 연동됩니다.
              </p>
            </div>
          </TabsContent>

          {/* 배너 관리 탭 */}
          <TabsContent value="banners">
            <BannerManagement />
          </TabsContent>

          {/* 쿠폰&포인트 관리 탭 */}
          <TabsContent value="coupons">
            <CouponPointManagement />
          </TabsContent>

          {/* Instagram 설정 탭 */}
          <TabsContent value="instagram">
            <InstagramSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* 상품 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand-terra-cotta">
              {editingProduct ? "상품 수정" : "상품 추가"}
            </DialogTitle>
            <DialogDescription>
              상품 정보를 입력하고 저장하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 상품명 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-brand-terra-cotta">
                상품명 *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="상품명을 입력하세요"
                className="border-brand-warm-taupe/30"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-brand-terra-cotta">
                상품 설명 *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="상품 설명을 입력하세요"
                className="border-brand-warm-taupe/30 min-h-24"
              />
            </div>

            {/* 가격 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-brand-terra-cotta">
                  판매 가격 *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="border-brand-warm-taupe/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="original_price" className="text-brand-terra-cotta">
                  정가 (선택)
                </Label>
                <Input
                  id="original_price"
                  type="number"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      original_price: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="border-brand-warm-taupe/30"
                />
              </div>
            </div>

            {/* 재고 */}
            <div className="space-y-2">
              <Label htmlFor="stock" className="text-brand-terra-cotta">
                재고 수량
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stock_quantity: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className="border-brand-warm-taupe/30"
              />
            </div>

            {/* 이미지 URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-brand-terra-cotta">
                이미지 URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://..."
                  className="border-brand-warm-taupe/30 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-brand-warm-taupe/30"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded mt-2"
                />
              )}
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label className="text-brand-terra-cotta">카테고리 *</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      formData.category.includes(cat)
                        ? "bg-brand-terra-cotta text-white"
                        : "bg-brand-cream text-brand-terra-cotta border border-brand-warm-taupe/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 사이즈 */}
            <div className="space-y-2">
              <Label className="text-brand-terra-cotta">사이즈</Label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      formData.sizes.includes(size)
                        ? "bg-brand-terra-cotta text-white"
                        : "bg-brand-cream text-brand-terra-cotta border border-brand-warm-taupe/30"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 색상 */}
            <div className="space-y-2">
              <Label htmlFor="colors" className="text-brand-terra-cotta">
                색상 (쉼표로 구분)
              </Label>
              <Input
                id="colors"
                value={formData.colors}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, colors: e.target.value }))
                }
                placeholder="예: Beige, Cream, Taupe"
                className="border-brand-warm-taupe/30"
              />
            </div>

            {/* 옵션 */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_new}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_new: !!checked }))
                  }
                />
                <span className="text-brand-terra-cotta text-sm">신상품 (NEW)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_best}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_best: !!checked }))
                  }
                />
                <span className="text-brand-terra-cotta text-sm">베스트 (BEST)</span>
              </label>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-brand-warm-taupe/30"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                {editingProduct ? "수정" : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}