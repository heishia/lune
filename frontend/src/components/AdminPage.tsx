import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, LogOut, Image as ImageIcon, Instagram, Package, Calendar, Gift, Megaphone, MessageSquare, FileText, Upload, Eye } from "lucide-react";
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
import { EditorPage } from "./EditorPage";
import { 
  getKakaoSettings, 
  updateKakaoSettings, 
  getMarketingUsers, 
  sendKakaoMessage, 
  getAdminOrders,
  updateOrderStatus,
  getContentByReference,
  uploadImage,
  type MarketingUser,
  type AdminOrder,
  type Content,
} from "../utils/api";

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
const COLOR_OPTIONS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#1a1a1a" },
  { name: "Beige", hex: "#D4C4B0" },
  { name: "Gray", hex: "#9CA3AF" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Brown", hex: "#8B5A2B" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Pink", hex: "#F8B4C4" },
  { name: "Blue", hex: "#4A90D9" },
  { name: "Green", hex: "#6B8E6B" },
];

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

  // 카카오톡 설정 상태
  const [kakaoAccessToken, setKakaoAccessToken] = useState("");
  const [kakaoAuthUrl, setKakaoAuthUrl] = useState("");
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [marketingUsers, setMarketingUsers] = useState<MarketingUser[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // 주문 관리 상태
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusChanges, setOrderStatusChanges] = useState<Record<string, string>>({});

  // 에디터 페이지 상태
  const [showEditor, setShowEditor] = useState(false);
  const [editorProductId, setEditorProductId] = useState<number | null>(null);
  const [editorProductName, setEditorProductName] = useState("");
  const [editorContentId, setEditorContentId] = useState<string | null>(null);
  const [hasProductContent, setHasProductContent] = useState(false);
  const [checkingContent, setCheckingContent] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    images: [] as string[],  // 여러 이미지 URL 배열
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

  // 카카오톡 설정 초기 로드
  useEffect(() => {
    fetchKakaoSettings();
    fetchMarketingUsers();
    fetchOrders();
  }, []);

  // 주문 목록 조회
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await getAdminOrders({ limit: 50 });
      setOrders(response.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("주문 목록을 불러오는데 실패했습니다");
    } finally {
      setOrdersLoading(false);
    }
  };

  // 주문 상태 변경
  const handleUpdateOrderStatus = async (orderId: string) => {
    const newStatus = orderStatusChanges[orderId];
    if (!newStatus) {
      toast.error("변경할 상태를 선택하세요");
      return;
    }

    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success("주문 상태가 업데이트되었습니다");
      fetchOrders();
      setOrderStatusChanges((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "주문 상태 변경에 실패했습니다");
    }
  };

  // 상태 코드를 한글로 변환
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "결제대기",
      paid: "결제완료",
      preparing: "상품준비중",
      shipped: "배송중",
      delivered: "배송완료",
      cancelled: "취소됨",
      refunded: "환불됨",
    };
    return statusMap[status] || status;
  };

  // 상품 추가/수정 다이얼로그 열기
  const handleOpenDialog = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      // images 배열이 있으면 사용, 없으면 image_url을 배열로 변환
      const productImages = (product as any).images || (product.image_url ? [product.image_url] : []);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.original_price || 0,
        category: product.category,
        colors: product.colors.join(", "),
        sizes: product.sizes,
        image_url: product.image_url,
        images: productImages,
        stock_quantity: product.stock_quantity,
        is_new: product.is_new,
        is_best: product.is_best,
      });
      // 해당 상품에 연결된 콘텐츠가 있는지 확인
      checkProductContent(product.id);
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
        images: [],
        stock_quantity: 0,
        is_new: false,
        is_best: false,
      });
      setHasProductContent(false);
      setEditorContentId(null);
    }
    setIsDialogOpen(true);
  };

  // 상품에 연결된 콘텐츠 확인
  const checkProductContent = async (productId: number) => {
    try {
      setCheckingContent(true);
      const content = await getContentByReference("product", productId.toString());
      if (content) {
        setHasProductContent(true);
        setEditorContentId(content.id);
      } else {
        setHasProductContent(false);
        setEditorContentId(null);
      }
    } catch (error) {
      setHasProductContent(false);
      setEditorContentId(null);
    } finally {
      setCheckingContent(false);
    }
  };

  // 상품 이미지 업로드 핸들러 (여러 이미지 추가)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      toast.info("이미지 업로드 중...");
      
      const uploadPromises = Array.from(files).map((file) => uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.url);
      
      setFormData((prev) => {
        const updatedImages = [...prev.images, ...newUrls];
        // 첫 번째 이미지를 대표 이미지로 설정 (대표 이미지가 없는 경우)
        const mainImage = prev.image_url || updatedImages[0] || "";
        return { ...prev, images: updatedImages, image_url: mainImage };
      });
      toast.success(`${newUrls.length}개의 이미지가 업로드되었습니다.`);
    } catch (error: any) {
      toast.error(error.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // 대표 이미지로 설정
  const setAsMainImage = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, image_url: imageUrl }));
    toast.success("대표 이미지로 설정되었습니다.");
  };

  // 이미지 삭제
  const removeImage = (imageUrl: string) => {
    setFormData((prev) => {
      const updatedImages = prev.images.filter((img) => img !== imageUrl);
      // 삭제된 이미지가 대표 이미지였다면 첫 번째 이미지로 변경
      const newMainImage = prev.image_url === imageUrl 
        ? (updatedImages[0] || "") 
        : prev.image_url;
      return { ...prev, images: updatedImages, image_url: newMainImage };
    });
  };

  // 상품 저장 (추가 또는 수정)
  const handleSaveProduct = async () => {
    try {
      // 대표 이미지가 없으면 첫 번째 이미지 사용
      const mainImage = formData.image_url || formData.images[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800";
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price > 0 ? formData.original_price : null,
        category: formData.category,
        colors: formData.colors.split(",").map((c) => c.trim()).filter((c) => c),
        sizes: formData.sizes,
        image_url: mainImage,
        images: formData.images.length > 0 ? formData.images : [mainImage],
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success(editingProduct ? "상품이 수정되었습니다" : "상품이 등록되었습니다");
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(`상품 저장에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
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

  // 색상 토글
  const toggleColor = (colorName: string) => {
    setFormData((prev) => {
      const currentColors = prev.colors
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
      const newColors = currentColors.includes(colorName)
        ? currentColors.filter((c) => c !== colorName)
        : [...currentColors, colorName];
      return { ...prev, colors: newColors.join(", ") };
    });
  };

  // 카카오톡 설정 조회
  const fetchKakaoSettings = async () => {
    try {
      setKakaoLoading(true);
      const settings = await getKakaoSettings();
      setKakaoAccessToken(settings.access_token || "");
      setKakaoAuthUrl(settings.auth_url || "");
    } catch (error) {
      console.error("Error fetching Kakao settings:", error);
      toast.error("카카오톡 설정을 불러오는데 실패했습니다");
    } finally {
      setKakaoLoading(false);
    }
  };

  // 카카오톡 OAuth 인가 페이지 열기
  const handleKakaoAuth = () => {
    if (kakaoAuthUrl) {
      window.open(kakaoAuthUrl, "_blank", "width=500,height=600");
      toast.info("카카오톡 로그인 페이지가 열렸습니다. 로그인 후 인가 코드를 받아주세요.");
    } else {
      toast.error("카카오톡 인가 URL을 불러올 수 없습니다. REST API 키와 리다이렉트 URI를 확인해주세요.");
    }
  };

  // 마케팅 동의 사용자 목록 조회
  const fetchMarketingUsers = async () => {
    try {
      const response = await getMarketingUsers();
      setMarketingUsers(response.users || []);
    } catch (error) {
      console.error("Error fetching marketing users:", error);
      toast.error("마케팅 동의 사용자 목록을 불러오는데 실패했습니다");
    }
  };

  // 카카오톡 액세스 토큰 저장
  const handleSaveKakaoToken = async () => {
    if (!kakaoAccessToken.trim()) {
      toast.error("액세스 토큰을 입력해주세요");
      return;
    }

    try {
      setKakaoLoading(true);
      await updateKakaoSettings(kakaoAccessToken);
      toast.success("카카오톡 액세스 토큰이 저장되었습니다");
    } catch (error: any) {
      console.error("Error saving Kakao token:", error);
      toast.error(error.message || "액세스 토큰 저장에 실패했습니다");
    } finally {
      setKakaoLoading(false);
    }
  };

  // 카카오톡 메시지 전송
  const handleSendKakaoMessage = async () => {
    if (!messageText.trim()) {
      toast.error("메시지를 입력해주세요");
      return;
    }

    if (marketingUsers.length === 0) {
      toast.error("마케팅 동의한 사용자가 없습니다");
      return;
    }

    if (!confirm(`마케팅 동의한 ${marketingUsers.length}명에게 메시지를 전송하시겠습니까?`)) {
      return;
    }

    try {
      setSendingMessage(true);
      const response = await sendKakaoMessage(messageText);
      if (response.success) {
        toast.success(response.message);
        setMessageText("");
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error("Error sending Kakao message:", error);
      toast.error(error.message || "메시지 전송에 실패했습니다");
    } finally {
      setSendingMessage(false);
    }
  };

  // 에디터 페이지 표시
  if (showEditor) {
    return (
      <EditorPage
        contentId={editorContentId || undefined}
        contentType="product"
        referenceId={editorProductId?.toString()}
        initialTitle={`${editorProductName} 상세 설명`}
        onSave={(content) => {
          toast.success("상세 설명이 저장되었습니다");
          setShowEditor(false);
          // 저장 후 콘텐츠 상태 업데이트
          setHasProductContent(true);
          setEditorContentId(content.id);
          // 모달 다시 열기
          if (editorProductId) {
            setIsDialogOpen(true);
          }
          setEditorProductId(null);
        }}
        onBack={() => {
          setShowEditor(false);
          setEditorProductId(null);
          // 모달 다시 열기
          if (editingProduct) {
            setIsDialogOpen(true);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="bg-white border-b border-brand-warm-taupe/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          {/* 왼쪽: 로고 (작게) */}
          <div className="flex-shrink-0 w-32">
            <img src={logo} alt="LUNE" className="h-6 w-auto" />
          </div>
          
          {/* 중앙: 관리자 페이지 텍스트 */}
          <div className="flex-1 text-center">
            <span className="text-brand-terra-cotta font-medium tracking-wide">관리자 페이지</span>
          </div>
          
          {/* 오른쪽: 돌아가기 버튼 */}
          <div className="flex-shrink-0 w-32 flex justify-end">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="border-brand-terra-cotta text-brand-terra-cotta hover:bg-brand-terra-cotta hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-1" />
              돌아가기
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-6xl grid-cols-6 mb-6">
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
            <TabsTrigger value="kakao">
              <MessageSquare className="w-4 h-4 mr-2" />
              카카오톡 메시지
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
              <Button
                onClick={fetchOrders}
                variant="outline"
                className="border-brand-warm-taupe/30"
              >
                새로고침
              </Button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-20 text-brand-warm-taupe">로딩 중...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 text-brand-warm-taupe">주문 내역이 없습니다</div>
            ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">주문번호</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead className="w-24">고객명</TableHead>
                    <TableHead className="text-right w-28">금액</TableHead>
                    <TableHead className="w-32">주문일시</TableHead>
                    <TableHead className="w-36">배송상태</TableHead>
                    <TableHead className="w-24">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                      <TableCell>
                        {order.items.length > 0 ? (
                          <div className="flex items-center gap-2">
                            {order.items[0].product_image && (
                              <img
                                src={order.items[0].product_image}
                                alt={order.items[0].product_name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="text-sm">{order.items[0].product_name}</div>
                              <div className="text-xs text-brand-warm-taupe">
                                {order.items[0].color} / {order.items[0].size}
                                {order.items.length > 1 && ` 외 ${order.items.length - 1}건`}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-brand-warm-taupe text-sm">상품 정보 없음</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{order.user_name || order.recipient_name}</TableCell>
                      <TableCell className="text-right text-brand-terra-cotta">
                        {order.final_amount.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-xs text-brand-warm-taupe">
                        {order.created_at.split("T")[0]}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={orderStatusChanges[order.id] || order.status}
                          onValueChange={(value: string) => setOrderStatusChanges((prev) => ({ ...prev, [order.id]: value }))}
                        >
                          <SelectTrigger className="h-9 text-xs border-brand-warm-taupe/30">
                            <SelectValue>{getStatusLabel(orderStatusChanges[order.id] || order.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">결제대기</SelectItem>
                            <SelectItem value="paid">결제완료</SelectItem>
                            <SelectItem value="preparing">상품준비중</SelectItem>
                            <SelectItem value="shipped">배송중</SelectItem>
                            <SelectItem value="delivered">배송완료</SelectItem>
                            <SelectItem value="cancelled">취소</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10"
                          onClick={() => handleUpdateOrderStatus(order.id)}
                          disabled={!orderStatusChanges[order.id] || orderStatusChanges[order.id] === order.status}
                        >
                          저장
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </TabsContent>

          {/* 배너 관리 탭 */}
          <TabsContent value="banners">
            <BannerManagement />
          </TabsContent>

          {/* 쿠폰&포인트 관리 탭 */}
          <TabsContent value="coupons">
            <CouponPointManagement />
          </TabsContent>

          {/* 카카오톡 메시지 탭 */}
          <TabsContent value="kakao" className="space-y-6">
            <div className="space-y-6">
              {/* 카카오톡 액세스 토큰 설정 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-brand-terra-cotta mb-4">카카오톡 액세스 토큰 설정</h2>
                <div className="space-y-4">
                  {kakaoAccessToken ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                        <span className="text-green-700 text-sm">✓ 액세스 토큰이 설정되어 있습니다</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={fetchKakaoSettings}
                          disabled={kakaoLoading}
                          variant="outline"
                          className="border-brand-warm-taupe/30"
                        >
                          설정 새로고침
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-brand-terra-cotta">
                        OAuth 인가를 통해 토큰 발급받기
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleKakaoAuth}
                          disabled={kakaoLoading || !kakaoAuthUrl}
                          className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe flex-1"
                        >
                          카카오톡 로그인으로 토큰 발급받기
                        </Button>
                        <Button
                          onClick={fetchKakaoSettings}
                          disabled={kakaoLoading}
                          variant="outline"
                          className="border-brand-warm-taupe/30"
                        >
                          새로고침
                        </Button>
                      </div>
                      <p className="text-xs text-brand-warm-taupe">
                        카카오톡 로그인을 통해 자동으로 액세스 토큰을 발급받습니다.
                        <br />
                        또는 아래에서 수동으로 토큰을 입력할 수 있습니다.
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-brand-warm-taupe/20 pt-4">
                    <Label htmlFor="kakao-token" className="text-brand-terra-cotta">
                      수동으로 액세스 토큰 입력 (선택사항)
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="kakao-token"
                        type="password"
                        value={kakaoAccessToken}
                        onChange={(e) => setKakaoAccessToken(e.target.value)}
                        placeholder="카카오톡 액세스 토큰을 직접 입력하세요"
                        className="border-brand-warm-taupe/30 flex-1"
                      />
                      <Button
                        onClick={handleSaveKakaoToken}
                        disabled={kakaoLoading}
                        variant="outline"
                        className="border-brand-warm-taupe/30"
                      >
                        {kakaoLoading ? "저장 중..." : "저장"}
                      </Button>
                    </div>
                    <p className="text-xs text-brand-warm-taupe mt-1">
                      카카오톡 개발자 콘솔에서 직접 발급받은 액세스 토큰을 입력할 수 있습니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 마케팅 동의 사용자 목록 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-brand-terra-cotta">마케팅 동의 사용자</h2>
                  <Button
                    onClick={fetchMarketingUsers}
                    variant="outline"
                    className="border-brand-warm-taupe/30"
                  >
                    목록 새로고침
                  </Button>
                </div>
                {marketingUsers.length === 0 ? (
                  <div className="text-center py-8 text-brand-warm-taupe">
                    마케팅 동의한 사용자가 없습니다
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>전화번호</TableHead>
                          <TableHead>가입일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketingUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell className="text-xs text-brand-warm-taupe">
                              {new Date(user.created_at).toLocaleDateString("ko-KR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-sm text-brand-warm-taupe">
                      총 {marketingUsers.length}명의 사용자가 마케팅 메시지 수신에 동의했습니다
                    </div>
                  </div>
                )}
              </div>

              {/* 메시지 전송 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-brand-terra-cotta mb-4">메시지 전송</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-brand-terra-cotta">
                      메시지 내용
                    </Label>
                    <Textarea
                      id="message"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="전송할 메시지를 입력하세요"
                      className="border-brand-warm-taupe/30 min-h-32"
                      rows={6}
                    />
                    <p className="text-xs text-brand-warm-taupe">
                      위 목록의 마케팅 동의 사용자들에게 메시지가 전송됩니다
                    </p>
                  </div>
                  <Button
                    onClick={handleSendKakaoMessage}
                    disabled={sendingMessage || !messageText.trim() || marketingUsers.length === 0}
                    className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
                  >
                    {sendingMessage ? "전송 중..." : `메시지 보내기 (${marketingUsers.length}명)`}
                  </Button>
                </div>
              </div>
            </div>
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

            {/* 판매 가격 */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-brand-terra-cotta">
                판매 가격
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: e.target.value === "" ? 0 : parseInt(e.target.value),
                  }))
                }
                placeholder="가격을 입력하세요"
                className="border-brand-warm-taupe/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
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

            {/* 상품 이미지 */}
            <div className="space-y-2">
              <Label className="text-brand-terra-cotta">상품 이미지</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-brand-warm-taupe/30 text-brand-terra-cotta hover:bg-brand-terra-cotta hover:text-white"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? "업로드 중..." : "이미지 추가"}
                </Button>
              </div>
              
              {/* 이미지 그리드 */}
              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {formData.images.map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                        formData.image_url === imageUrl 
                          ? "border-brand-terra-cotta" 
                          : "border-brand-warm-taupe/30"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`상품 이미지 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* 대표 이미지 표시 */}
                      {formData.image_url === imageUrl && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-brand-terra-cotta text-white text-[10px] rounded">
                          대표
                        </div>
                      )}
                      {/* 호버 시 액션 버튼 */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {formData.image_url !== imageUrl && (
                          <button
                            type="button"
                            onClick={() => setAsMainImage(imageUrl)}
                            className="p-1.5 bg-white text-brand-terra-cotta rounded hover:bg-brand-cream"
                            title="대표 이미지로 설정"
                          >
                            <ImageIcon className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(imageUrl)}
                          className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                          title="이미지 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-brand-warm-taupe">
                여러 이미지를 업로드하고, 클릭하여 대표 이미지를 지정하세요. 대표 이미지는 썸네일과 첫 번째로 표시됩니다.
              </p>
            </div>

            {/* 에디터로 편집하기 버튼 */}
            <div className="space-y-2">
              <Label className="text-brand-terra-cotta">상세 설명</Label>
              {checkingContent ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-brand-warm-taupe/30"
                  disabled
                >
                  확인 중...
                </Button>
              ) : hasProductContent && editingProduct ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                  onClick={() => {
                    setEditorProductId(editingProduct.id);
                    setEditorProductName(formData.name || "상품");
                    setIsDialogOpen(false);
                    setShowEditor(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  상세 설명 보기/수정
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-brand-terra-cotta text-brand-terra-cotta hover:bg-brand-terra-cotta hover:text-white"
                  onClick={() => {
                    setEditorProductId(editingProduct?.id || null);
                    setEditorProductName(formData.name || "새 상품");
                    setIsDialogOpen(false);
                    setShowEditor(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  상세 설명 생성하기
                </Button>
              )}
              <p className="text-xs text-brand-warm-taupe">
                {hasProductContent && editingProduct
                  ? "저장된 상세 설명이 있습니다. 클릭하여 보거나 수정하세요."
                  : "상품 상세 페이지에 표시될 설명을 에디터에서 작성합니다"}
              </p>
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
              <Label className="text-brand-terra-cotta">색상</Label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((color) => {
                  const isSelected = formData.colors
                    .split(",")
                    .map((c) => c.trim())
                    .includes(color.name);
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => toggleColor(color.name)}
                      className={`relative w-8 h-8 rounded-full transition-all ${
                        isSelected
                          ? "ring-2 ring-brand-terra-cotta ring-offset-2"
                          : "ring-1 ring-brand-warm-taupe/30"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                          style={{ color: color.name === "Black" || color.name === "Navy" || color.name === "Brown" ? "#fff" : "#333" }}>
                          v
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {formData.colors && (
                <p className="text-xs text-brand-warm-taupe mt-1">
                  선택됨: {formData.colors}
                </p>
              )}
            </div>

            {/* 옵션 */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_new}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData((prev) => ({ ...prev, is_new: !!checked }))
                  }
                />
                <span className="text-brand-terra-cotta text-sm">신상품 (NEW)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_best}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
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