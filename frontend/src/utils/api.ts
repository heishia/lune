import { projectId, publicAnonKey } from './supabase/info';

// 개발 환경에서는 로컬 백엔드 사용, 프로덕션에서는 Supabase Edge Function 사용
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8000'
  : `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84`;

// 로컬 스토리지에서 토큰 가져오기
export function getToken(): string | null {
  return localStorage.getItem('lune_auth_token');
}

// 로컬 스토리지에 토큰 저장
export function setToken(token: string): void {
  localStorage.setItem('lune_auth_token', token);
}

// 로컬 스토리지에서 토큰 제거
export function removeToken(): void {
  localStorage.removeItem('lune_auth_token');
}

// 로컬 스토리지에서 사용자 정보 가져오기
export function getUserInfo(): { id: string; email: string; name: string } | null {
  const userStr = localStorage.getItem('lune_user_info');
  return userStr ? JSON.parse(userStr) : null;
}

// 로컬 스토리지에 사용자 정보 저장
export function setUserInfo(user: { id: string; email: string; name: string }): void {
  localStorage.setItem('lune_user_info', JSON.stringify(user));
}

// 로컬 스토리지에서 사용자 정보 제거
export function removeUserInfo(): void {
  localStorage.removeItem('lune_user_info');
}

// API 요청 헬퍼
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// Auth API (인증)
// ==========================================

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  marketingAgreed?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    is_admin?: boolean;
  };
  token: string;
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // 토큰과 사용자 정보 저장
  setToken(response.token);
  setUserInfo(response.user);
  
  return response;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // 토큰과 사용자 정보 저장
  setToken(response.token);
  setUserInfo(response.user);
  
  return response;
}

export function logout(): void {
  removeToken();
  removeUserInfo();
}

export async function getMe(): Promise<{ user: any }> {
  return apiRequest('/auth/me');
}

// ==========================================
// Products API (상품)
// ==========================================

export interface Product {
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
  view_count: number;
  created_at: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  total_pages: number;
}

export async function getProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set('category', params.category);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiRequest(`/products${query ? `?${query}` : ''}`);
}

export async function getProduct(id: number): Promise<Product & { reviews: any[]; reviewCount: number; averageRating: number }> {
  return apiRequest(`/products/${id}`);
}

// ==========================================
// Cart API (장바구니)
// ==========================================

export interface CartItem {
  id: string;
  product_id: number;
  quantity: number;
  color: string;
  size: string;
  created_at: string;
  products: Product;
}

export interface AddToCartData {
  productId: number;
  quantity: number;
  color: string;
  size: string;
}

export async function getCart(): Promise<{ items: CartItem[] }> {
  return apiRequest('/cart');
}

export async function addToCart(data: AddToCartData): Promise<{ item: CartItem }> {
  return apiRequest('/cart', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCartQuantity(cartId: string, quantity: number): Promise<{ item: CartItem }> {
  return apiRequest(`/cart/${cartId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(cartId: string): Promise<void> {
  await apiRequest(`/cart/${cartId}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<void> {
  await apiRequest('/cart', {
    method: 'DELETE',
  });
}

// ==========================================
// Orders API (주문)
// ==========================================

export interface OrderItem {
  productId: number;
  quantity: number;
  color: string;
  size: string;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  postalCode: string;
  address: string;
  addressDetail?: string;
  deliveryMessage?: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  discountAmount?: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee: number;
  final_amount: number;
  recipient_name: string;
  recipient_phone: string;
  postal_code: string;
  address: string;
  address_detail?: string;
  delivery_message?: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items?: any[];
}

export async function createOrder(data: CreateOrderData): Promise<{
  orderId: string;
  orderNumber: string;
  totalAmount: number;
}> {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);

  const query = queryParams.toString();
  return apiRequest(`/orders${query ? `?${query}` : ''}`);
}

export async function getOrder(orderId: string): Promise<Order> {
  return apiRequest(`/orders/${orderId}`);
}

export async function cancelOrder(orderId: string, reason: string): Promise<{ success: boolean }> {
  return apiRequest(`/orders/${orderId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

// ==========================================
// Admin Products API (관리자용 상품 관리)
// ==========================================

export async function createProduct(data: Omit<Product, 'id' | 'created_at' | 'view_count'>): Promise<{ product: Product }> {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<{ product: Product }> {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: number): Promise<{ success: boolean }> {
  return apiRequest(`/products/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// Kakao API (카카오톡 메시지)
// ==========================================

export interface KakaoSettings {
  access_token: string;
  has_token: boolean;
  auth_url?: string;
}

export interface MarketingUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  marketing_agreed: boolean;
  created_at: string;
}

export interface MarketingUsersResponse {
  users: MarketingUser[];
  total: number;
}

export interface SendMessageResponse {
  success: boolean;
  sent_count: number;
  failed_count: number;
  message: string;
}

export async function getKakaoSettings(): Promise<KakaoSettings> {
  return apiRequest('/kakao/settings');
}

export async function updateKakaoSettings(accessToken: string): Promise<KakaoSettings> {
  return apiRequest('/kakao/settings', {
    method: 'PUT',
    body: JSON.stringify({ access_token: accessToken }),
  });
}

export async function getMarketingUsers(): Promise<MarketingUsersResponse> {
  return apiRequest('/kakao/users');
}

export async function sendKakaoMessage(message: string): Promise<SendMessageResponse> {
  return apiRequest('/kakao/send', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// ==========================================
// Banners API (배너 관리)
// ==========================================

export interface BannerContentBlock {
  type: 'text' | 'image';
  content: string;
}

export interface Banner {
  id: string;
  title: string;
  banner_image: string;
  content_blocks: BannerContentBlock[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BannersResponse {
  banners: Banner[];
  total: number;
}

export async function getBanners(activeOnly: boolean = false): Promise<BannersResponse> {
  const query = activeOnly ? '?active_only=true' : '';
  return apiRequest(`/banners${query}`);
}

export async function getActiveBanners(): Promise<BannersResponse> {
  return apiRequest('/banners/active');
}

export async function getBanner(id: string): Promise<Banner> {
  return apiRequest(`/banners/${id}`);
}

export async function createBanner(data: {
  title: string;
  banner_image: string;
  content_blocks: BannerContentBlock[];
  is_active?: boolean;
  display_order?: number;
}): Promise<Banner> {
  return apiRequest('/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBanner(id: string, data: {
  title?: string;
  banner_image?: string;
  content_blocks?: BannerContentBlock[];
  is_active?: boolean;
  display_order?: number;
}): Promise<Banner> {
  return apiRequest(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBanner(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/banners/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// Admin Orders API (관리자용 주문 관리)
// ==========================================

export interface AdminOrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  color: string;
  size: string;
  price: number;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee: number;
  final_amount: number;
  recipient_name: string;
  recipient_phone: string;
  postal_code: string;
  address: string;
  address_detail?: string;
  delivery_message?: string;
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  courier?: string;
  created_at: string;
  items: AdminOrderItem[];
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  total_pages: number;
}

export async function getAdminOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AdminOrdersResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);

  const query = queryParams.toString();
  return apiRequest(`/admin/orders${query ? `?${query}` : ''}`);
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder> {
  return apiRequest(`/admin/orders/${orderId}`);
}

export async function updateOrderStatus(orderId: string, data: {
  status: string;
  tracking_number?: string;
  courier?: string;
}): Promise<AdminOrder> {
  return apiRequest(`/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==========================================
// Admin Users API (관리자용 사용자 관리)
// ==========================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  points: number;
  is_active: boolean;
  marketing_agreed: boolean;
  created_at: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export async function searchUsers(query: string): Promise<AdminUsersResponse> {
  return apiRequest(`/admin/users?query=${encodeURIComponent(query)}`);
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
  return apiRequest(`/admin/users/${userId}`);
}

// ==========================================
// Admin Points API (관리자용 포인트 관리)
// ==========================================

export interface PointHistory {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface PointHistoryResponse {
  history: PointHistory[];
  total: number;
}

export async function issuePoints(userId: string, data: {
  points: number;
  reason: string;
}): Promise<PointHistory> {
  return apiRequest(`/admin/users/${userId}/points`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPointHistory(userId?: string): Promise<PointHistoryResponse> {
  const query = userId ? `?user_id=${userId}` : '';
  return apiRequest(`/admin/points/history${query}`);
}

// ==========================================
// Coupons API (쿠폰 관리)
// ==========================================

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CouponsResponse {
  coupons: Coupon[];
  total: number;
}

export async function getCoupons(): Promise<CouponsResponse> {
  return apiRequest('/coupons');
}

export async function createCoupon(data: {
  code: string;
  name: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  is_active?: boolean;
}): Promise<Coupon> {
  return apiRequest('/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCoupon(couponId: string, data: Partial<Coupon>): Promise<Coupon> {
  return apiRequest(`/coupons/${couponId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCoupon(couponId: string): Promise<{ success: boolean }> {
  return apiRequest(`/coupons/${couponId}`, {
    method: 'DELETE',
  });
}

export async function issueCouponToUser(couponId: string, userId: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/coupons/${couponId}/issue/${userId}`, {
    method: 'POST',
  });
}

export interface UserCoupon {
  id: string;
  coupon_id: string;
  coupon_name: string;
  coupon_code: string;
  discount_type: string;
  discount_value: number;
  valid_until: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
}

export interface UserCouponsResponse {
  coupons: UserCoupon[];
  total: number;
}

export async function getMyCoupons(): Promise<UserCouponsResponse> {
  return apiRequest('/coupons/my');
}

// ==========================================
// Contents API (에디터 콘텐츠)
// ==========================================

export interface ContentBlock {
  id: string;
  type: string; // "text", "image", "heading", "divider", "quote"
  data: Record<string, any>;
}

export interface Content {
  id: string;
  title: string;
  content_type: string;
  reference_id?: string;
  blocks: ContentBlock[];
  thumbnail_url?: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentsResponse {
  contents: Content[];
  total: number;
}

export async function getContents(params?: {
  content_type?: string;
  reference_id?: string;
}): Promise<ContentsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.content_type) queryParams.set('content_type', params.content_type);
  if (params?.reference_id) queryParams.set('reference_id', params.reference_id);

  const query = queryParams.toString();
  return apiRequest(`/contents${query ? `?${query}` : ''}`);
}

export async function getContent(contentId: string): Promise<Content> {
  return apiRequest(`/contents/${contentId}`);
}

export async function getContentByReference(contentType: string, referenceId: string): Promise<Content | null> {
  return apiRequest(`/contents/by-reference/${contentType}/${referenceId}`);
}

export async function createContent(data: {
  title: string;
  content_type: string;
  reference_id?: string;
  blocks: ContentBlock[];
  thumbnail_url?: string;
  is_published?: boolean;
}): Promise<Content> {
  return apiRequest('/contents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContent(contentId: string, data: {
  title?: string;
  blocks?: ContentBlock[];
  thumbnail_url?: string;
  is_published?: boolean;
}): Promise<Content> {
  return apiRequest(`/contents/${contentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContent(contentId: string): Promise<{ success: boolean }> {
  return apiRequest(`/contents/${contentId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// 파일 업로드 API
// =============================================================================

export interface UploadResponse {
  url: string;
  filename: string;
  content_type: string;
  size: number;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || '이미지 업로드에 실패했습니다.');
  }

  return response.json();
}

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/uploads/video`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || '동영상 업로드에 실패했습니다.');
  }

  return response.json();
}