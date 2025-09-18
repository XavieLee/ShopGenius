import { Slots, CATEGORIES, COLORS } from '../types';

// 货币格式化
export function currency(n: number | string | null | undefined): string { 
  if (n === null || n === undefined) return '$0.00';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`; 
}

// 创建空的筛选条件
export function makeClearedSlots(): Slots { 
  return { category: null, color: null, priceMax: null }; 
}

// 解析自然语言筛选条件
export function parseFilterPrompt(s: string): Slots { 
  const lower = s.toLowerCase(); 
  
  // 颜色映射表（中文到英文）
  const colorMap: Record<string, string> = {
    '红色': 'Red',
    '蓝色': 'Blue', 
    '黑色': 'Black',
    '白色': 'White',
    '绿色': 'Green',
    '棕色': 'Brown',
    '红': 'Red',
    '蓝': 'Blue',
    '黑': 'Black', 
    '白': 'White',
    '绿': 'Green',
    '棕': 'Brown'
  };
  
  // 分类映射表（中文到英文）
  const categoryMap: Record<string, string> = {
    '美妆': 'Beauty',
    '鞋子': 'Shoes',
    '包包': 'Bags', 
    '电子产品': 'Electronics',
    '运动': 'Sports',
    '配饰': 'Accessories',
    '运动鞋': 'Shoes',
    '连衣裙': 'Beauty',
    '手机配件': 'Electronics',
    '蓝牙耳机': 'Electronics',
    '护肤品': 'Beauty'
  };
  
  // 解析颜色 - 支持中英文
  let color: string | null = null;
  for (const [chinese, english] of Object.entries(colorMap)) {
    if (lower.includes(chinese.toLowerCase())) {
      color = english;
      break;
    }
  }
  if (!color) {
    color = COLORS.find((c) => lower.includes(c.toLowerCase())) ?? null;
  }
  
  // 解析分类 - 支持中英文
  let category: string | null = null;
  for (const [chinese, english] of Object.entries(categoryMap)) {
    if (lower.includes(chinese.toLowerCase())) {
      category = english;
      break;
    }
  }
  if (!category) {
    category = CATEGORIES.find((c) => lower.includes(c.toLowerCase())) ?? null;
  }
  
  // 解析价格 - 支持中文表达
  let priceMax: number | null = null; 
  
  // 匹配 "5000块以下"、"5000元以下"、"5000以下" 等
  const priceMatch = lower.match(/(\d+)\s*(?:块|元|rmb|usd|\$)?\s*(?:以下|以内|以下)/) || 
                    lower.match(/(?:under|<=|≤)\s*(\d+)/) || 
                    lower.match(/(\d+)\s*(?:元|rmb|usd|\$)/);
  
  if (priceMatch) {
    priceMax = Number(priceMatch[1]); 
  }
  
  return { category, color, priceMax }; 
}

// AI风格语调
export function toneLine(persona: string): string { 
  switch(persona) { 
    case "friendly": return "I've got your back—let's find a great pick together!"; 
    case "luxury": return "Curating refined pieces just for you."; 
    default: return "Let's optimize for quality and value."; 
  } 
}

// 时间格式化工具函数
export function formatMessageTime(timestamp?: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
}

// 日期分隔符格式化
export function formatDateSeparator(timestamp?: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return '今天';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  }
}
