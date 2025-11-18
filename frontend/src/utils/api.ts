import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84`;

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
  totalPages: number;
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