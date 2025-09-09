import { Product, AIPersona, CartItem, ChatMessage, ChatSession, Order } from '../services/api';

// 重新导出API类型
export type { 
  Product, 
  AIPersona, 
  CartItem, 
  ChatMessage, 
  ChatSession, 
  Order 
} from '../services/api';

// 筛选条件类型
export type Slots = { 
  category: string | null; 
  color: string | null; 
  priceMax: number | null; 
};

// 聊天消息类型
export type ChatMsg = { 
  role: "user" | "assistant"; 
  text?: string; 
  persona?: string; 
  chips?: string[]; 
  product?: Product;
  products?: Product[]; // 支持多个商品
  timestamp?: string;
};

// 应用标签页类型
export type TabType = "home" | "assistant" | "shop";

// 常量定义
export const CATEGORIES = ["Beauty", "Shoes", "Bags", "Electronics", "Sports", "Accessories"] as const;
export const COLORS = ["Red", "Blue", "Black", "White", "Green", "Brown"] as const;

// AI风格常量
export const PERSONAS = [
  { id: "friendly", label: "亲和" }, 
  { id: "rational", label: "理性" }, 
  { id: "luxury", label: "奢华" }
];
