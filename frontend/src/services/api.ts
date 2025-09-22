// API服务配置 - 自动检测环境
const getApiBaseUrl = () => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 自动检测：如果当前访问的是localhost，使用localhost；否则使用当前域名
  const currentHost = window.location.hostname;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001/api';
  } else {
    // 使用当前域名，假设后端在同一台服务器的3001端口
    return `http://${currentHost}:3001/api`;
  }
};

const getWsBaseUrl = () => {
  // 优先使用环境变量
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  
  // 自动检测：如果当前访问的是localhost，使用localhost；否则使用当前域名
  const currentHost = window.location.hostname;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001';
  } else {
    // 使用当前域名，假设后端在同一台服务器的3001端口
    return `http://${currentHost}:3001`;
  }
};

const API_BASE_URL = getApiBaseUrl();
const WS_BASE_URL = getWsBaseUrl();

// 调试信息
console.log('🔧 API配置信息:');
console.log('  - 当前域名:', window.location.hostname);
console.log('  - API地址:', API_BASE_URL);
console.log('  - WebSocket地址:', WS_BASE_URL);
console.log('  - 环境变量 REACT_APP_API_URL:', process.env.REACT_APP_API_URL || '未设置');
console.log('  - 环境变量 REACT_APP_WS_URL:', process.env.REACT_APP_WS_URL || '未设置');

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

  // 获取秒杀商品
  getFlashSaleProducts: () =>
    apiRequest<{
      products: Product[];
      total: number;
    }>('/products/flash-sale'),

  // 获取本周推荐商品
  getWeeklyRecommendations: () =>
    apiRequest<{
      products: Product[];
      total: number;
    }>('/products/weekly-recommendations'),
};

// AI相关API
export const aiAPI = {
  // 获取AI风格列表
  getPersonas: async () => {
    const response = await apiRequest<{success: boolean, data: AIPersona[]}>('/ai/persona/list');
    return response.data || [];
  },

  // 初始化用户AI风格
  initPersona: async (userId: string) => {
    const response = await apiRequest<{success: boolean, data: {
      personaId: string;
      persona: AIPersona;
      greeting: string;
    }}>(`/ai/persona/init?userId=${userId}`);
    return response.data;
  },

  // 切换AI风格
  switchPersona: async (userId: string, personaId: string) => {
    const response = await apiRequest<{success: boolean, data: {
      personaId: string;
      persona: AIPersona;
      greeting: string;
    }}>('/ai/persona/switch', {
      method: 'POST',
      body: JSON.stringify({ userId, personaId }),
    });
    return response.data;
  },

  // 创建聊天会话
  createSession: (userId: string, personaId: string) =>
    apiRequest<{
      sessionId: string;
      createdAt: string;
    }>('/ai/chat/session/create', {
      method: 'POST',
      body: JSON.stringify({ userId, personaId }),
    }),

  // 获取聊天历史
  getChatHistory: async (userId: string, limit: number = 10) => {
    const response = await apiRequest<{
      sessions: ChatSession[];
      messages: ChatMessage[];
    }>(`/ai/chat/history?userId=${userId}&limit=${limit}`);
    return response;
  },

  // 更新会话标题
  updateSessionTitle: (sessionId: string, title: string) =>
    apiRequest<{
      sessionId: string;
      title: string;
    }>(`/ai/chat/session/${sessionId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }),

  // 删除聊天会话
  deleteSession: (sessionId: string) =>
    apiRequest<null>(`/ai/chat/session/${sessionId}`, {
      method: 'DELETE',
    }),

  // AI聊天（Socket.IO连接）
  connectWebSocket: (userId: string, sessionId: string, personaId: string, onMessage: (message: any) => void) => {
    // 动态导入Socket.IO客户端
    const io = require('socket.io-client');
    const socket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      // 连接配置 - 减少资源消耗
      reconnection: true,           // 允许重连
      reconnectionAttempts: 3,      // 最多重试3次
      reconnectionDelay: 2000,      // 重连延迟2秒
      reconnectionDelayMax: 10000,  // 最大重连延迟10秒
      timeout: 10000,               // 连接超时10秒
      forceNew: false,              // 复用现有连接
      // 减少心跳频率
      pingTimeout: 60000,           // ping超时60秒
      pingInterval: 25000,          // ping间隔25秒
    });
    
    socket.on('connect', () => {
      console.log('Socket.IO连接已建立', socket.id);
      
      // 通知连接成功
      onMessage({ type: 'connected' });
      
      // 加入聊天会话
      socket.emit('join_chat', {
        userId,
        sessionId,
        personaId
      });
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('Socket.IO连接已断开:', reason);
      
      // 通知连接断开
      onMessage({ type: 'disconnected' });
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，不自动重连
        console.log('服务器主动断开连接，停止重连');
        socket.disconnect();
      }
    });
    
    socket.on('connect_error', (error: any) => {
      console.error('Socket.IO连接错误:', error.message);
    });
    
    socket.on('reconnect', (attemptNumber: number) => {
      console.log('Socket.IO重连成功，尝试次数:', attemptNumber);
    });
    
    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Socket.IO重连尝试:', attemptNumber);
    });
    
    socket.on('reconnect_error', (error: any) => {
      console.error('Socket.IO重连失败:', error.message);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('Socket.IO重连失败，已达到最大重试次数');
      // 通知连接失败
      onMessage({ type: 'failed' });
    });
    
    // 监听AI回复
    socket.on('ai_response', (data: any) => {
      onMessage({
        type: 'message',
        content: data.data.message,
        products: data.data.products
      });
    });
    
    // 监听打字指示器
    socket.on('typing_start', () => {
      onMessage({ type: 'typing' });
    });
    
    socket.on('typing_stop', () => {
      onMessage({ type: 'typing_stop' });
    });
    
    return socket;
  },

  // 发送聊天消息（通过Socket.IO）
  sendMessage: (socket: any, message: string) => {
    if (socket && socket.connected) {
      socket.emit('user_message', {
        content: message,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Socket.IO连接未就绪');
    }
  },

  // 旧版API（保持兼容性）
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
  price: number | string;
  originalPrice?: number | string;
  description: string;
  image: string;
  image_url?: string; // 数据库中的图片URL字段
  rating?: number | string;
  reviews?: number | string;
  stock?: number | string;
  features?: string[];
}

export interface AIPersona {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
  greeting: string;
  avatar?: string;
  isActive: boolean;
}

export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  lastMessageAt?: string;
  messageCount: number;
  personaId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sessionId: string;
  personaId?: string;
  products?: Product[];
  metadata?: any;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number | string;
  image: string;
  image_url?: string; // 数据库中的图片URL字段
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
