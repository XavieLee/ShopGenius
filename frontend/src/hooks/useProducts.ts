import { useState, useEffect, useCallback } from 'react';
import { productAPI, aiAPI, Product } from '../services/api';
import { Slots } from '../types';
import { parseFilterPrompt } from '../utils';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [filterPrompt, setFilterPrompt] = useState("");
  const [slotsPrompt, setSlotsPrompt] = useState<Slots>({ category: null, color: null, priceMax: null });
  const [loading, setLoading] = useState(false);
  const [lastSearchInterest, setLastSearchInterest] = useState<string | null>(null);

  const parsedFromPrompt = parseFilterPrompt(filterPrompt);
  const mergedSlots: Slots = {
    category: slotsPrompt.category ?? parsedFromPrompt.category ?? null,
    color: slotsPrompt.color ?? parsedFromPrompt.color ?? null,
    priceMax: slotsPrompt.priceMax ?? parsedFromPrompt.priceMax ?? null,
  };

  // 加载产品列表
  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await productAPI.getProducts({
        category: mergedSlots.category || undefined,
        color: mergedSlots.color || undefined,
        maxPrice: mergedSlots.priceMax || undefined,
        limit: 20
      });
      setProducts(response.products);
    } catch (error) {
      console.error('加载产品失败:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [mergedSlots.category, mergedSlots.color, mergedSlots.priceMax]);

  // 智能搜索
  const handleSmartSearch = useCallback(async () => {
    if (!filterPrompt.trim()) return;
    
    try {
      setLoading(true);
      const response = await aiAPI.search(filterPrompt);
      
      // 更新产品列表
      setProducts(response.products);
      
      // 记录搜索兴趣，用于AI助手感知
      setLastSearchInterest(filterPrompt.trim());
      
      // 将搜索兴趣存储到localStorage，供AI助手使用
      localStorage.setItem('lastSearchInterest', filterPrompt.trim());
      localStorage.setItem('lastSearchTime', new Date().toISOString());
      
    } catch (error) {
      console.error('智能搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filterPrompt]);

  // 清空所有筛选器
  const clearAllFilters = useCallback(() => {
    setFilterPrompt("");
    setSlotsPrompt({ category: null, color: null, priceMax: null });
  }, []);

  // 当筛选条件变化时重新加载产品
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 获取搜索兴趣
  const getSearchInterest = useCallback(() => {
    return lastSearchInterest;
  }, [lastSearchInterest]);

  // 清除搜索兴趣
  const clearSearchInterest = useCallback(() => {
    setLastSearchInterest(null);
    localStorage.removeItem('lastSearchInterest');
    localStorage.removeItem('lastSearchTime');
  }, []);

  return {
    products,
    productsLoading,
    filterPrompt,
    slotsPrompt,
    loading,
    mergedSlots,
    lastSearchInterest,
    setFilterPrompt,
    setSlotsPrompt,
    loadProducts,
    handleSmartSearch,
    clearAllFilters,
    getSearchInterest,
    clearSearchInterest
  };
}
