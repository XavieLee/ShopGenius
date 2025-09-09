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
  const color = COLORS.find((c) => lower.includes(c.toLowerCase())) ?? null; 
  const category = CATEGORIES.find((c) => lower.includes(c.toLowerCase())) ?? null; 
  let priceMax: number | null = null; 
  const m = lower.match(/(?:under|<=|≤)\s*(\d+)/) || lower.match(/(\d+)\s*(?:元|rmb|usd|\$)/); 
  if (m) priceMax = Number(m[1]); 
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
