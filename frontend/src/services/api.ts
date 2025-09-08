// API服务配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 通用API请求函数
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API请求失败');
  }
  
  return data.data;
}

// 产品相关API
export const productAPI = {
  // 获取产品列表
  getProducts: (params?: {
    category?: string;
    color?: string;
    maxPrice?: number;
    minPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return apiRequest<{
      products: Product[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/products?${searchParams.toString()}`);
  },

  // 获取产品详情
  getProduct: (id: string) => 
    apiRequest<Product & { relatedProducts: Product[] }>(`/products/${id}`),

  // 搜索产品
  searchProducts: (query: string, filters?: {
    category?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const searchParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return apiRequest<{
      products: Product[];
      total: number;
      query: string;
    }>(`/products/search?${searchParams.toString()}`);
  },

  // 获取分类列表
  getCategories: () => 
    apiRequest<{
      categories: string[];
      colors: string[];
    }>('/products/categories/list'),
};

// AI相关API
export const aiAPI = {
  // AI聊天
  chat: (message: string, context?: any, persona?: string) =>
    apiRequest<{
      reply: string;
      products: Product[];
      parsedQuery: any;
      suggestions: string[];
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, persona }),
    }),

  // 智能搜索
  search: (query: string) =>
    apiRequest<{
      interpretation: string;
      products: Product[];
      total: number;
      filters: any;
    }>('/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // 获取推荐
  getRecommendations: (productId?: string) =>
    apiRequest<{
      recommended: Product[];
      reason: string;
    }>(`/ai/recommend${productId ? `/${productId}` : ''}`),
};

// 购物车相关API
export const cartAPI = {
  // 获取购物车
  getCart: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return apiRequest<{
      items: CartItem[];
      total: number;
      itemCount: number;
    }>(`/cart${params}`);
  },

  // 添加到购物车
  addToCart: (productId: string, quantity: number = 1, userId?: string) =>
    apiRequest<{
      productId: string;
      quantity: number;
    }>('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, userId }),
    }),

  // 更新购物车商品数量
  updateCartItem: (productId: string, quantity: number, userId?: string) =>
    apiRequest<{
      productId: string;
      quantity: number;
    }>(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, userId }),
    }),

  // 删除购物车商品
  removeFromCart: (productId: string, userId?: string) =>
    apiRequest<null>(`/cart/${productId}?userId=${userId || 'default'}`, {
      method: 'DELETE',
    }),

  // 清空购物车
  clearCart: (userId?: string) =>
    apiRequest<null>(`/cart?userId=${userId || 'default'}`, {
      method: 'DELETE',
    }),
};

// 订单相关API
export const orderAPI = {
  // 创建订单
  createOrder: (items: CartItem[], userId?: string, paymentMethod?: string) =>
    apiRequest<{
      orderId: string;
      total: number;
      status: string;
      paymentUrl: string;
    }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items, userId, paymentMethod }),
    }),

  // 处理支付
  processPayment: (orderId: string, paymentMethod?: string, paymentDetails?: any) =>
    apiRequest<{
      orderId: string;
      status: string;
      transactionId: string;
      paymentMethod: string;
    }>(`/orders/payment/process/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, paymentDetails }),
    }),

  // 获取订单列表
  getOrders: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return apiRequest<{
      orders: Order[];
      total: number;
    }>(`/orders${params}`);
  },

  // 获取订单详情
  getOrder: (orderId: string, userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return apiRequest<Order>(`/orders/${orderId}${params}`);
  },

  // 取消订单
  cancelOrder: (orderId: string, userId?: string) =>
    apiRequest<{
      orderId: string;
      status: string;
    }>(`/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    }),
};

// 类型定义
export interface Product {
  id: string;
  name: string;
  category: string;
  color: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  features?: string[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  addedAt?: string;
}

export interface Order {
  orderId: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'cancelled' | 'shipped' | 'delivered';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  paymentDetails?: any;
}

export default {
  productAPI,
  aiAPI,
  cartAPI,
  orderAPI,
};
