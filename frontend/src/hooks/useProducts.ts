import { useState, useEffect, useCallback } from 'react';
import { productAPI, Product } from '../services/api';
import { Slots } from '../types';
import { parseFilterPrompt } from '../utils';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // 保存完整的商品列表
  const [productsLoading, setProductsLoading] = useState(false);
  const [filterPrompt, setFilterPrompt] = useState("");
  const [slotsPrompt, setSlotsPrompt] = useState<Slots>({ category: null, color: null, priceMax: null });
  const [activeFilters, setActiveFilters] = useState<any[]>([]); // 添加筛选条件状态
  const [loading, setLoading] = useState(false);
  const [lastSearchInterest, setLastSearchInterest] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
      setAllProducts(response.products); // 同时保存完整列表
      setIsInitialized(true);
    } catch (error) {
      console.error('加载产品失败:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [mergedSlots.category, mergedSlots.color, mergedSlots.priceMax]);

  // 智能搜索 - 用户输入什么就搜索什么，同时带上筛选条件
  const handleSmartSearch = useCallback(async (searchQuery?: string, filters?: any[]) => {
    const query = searchQuery || filterPrompt;
    const currentFilters = filters || activeFilters;
    
    if (!query.trim() && currentFilters.length === 0) {
      // 如果搜索为空且没有筛选条件，显示全部商品
      setProducts(allProducts);
      return;
    }
    
    try {
      setLoading(true);
      
      // 构建搜索参数，包含搜索词和筛选条件
      const searchParams: any = {
        limit: 100
      };
      
      // 添加搜索词
      if (query.trim()) {
        searchParams.search = query.trim();
      }
      
      // 添加筛选条件
      currentFilters.forEach(filter => {
        if (filter.type === 'category') {
          searchParams.category = filter.value;
        } else if (filter.type === 'color') {
          searchParams.color = filter.value;
        } else if (filter.type === 'price') {
          // 价格筛选条件，默认为最大值
          searchParams.maxPrice = filter.value;
        }
        // 注意：brand和rating条件已经在App.tsx中处理为搜索关键字，这里不再重复处理
      });
      
      
      // 调用后端搜索API
      const response = await productAPI.getProducts(searchParams);
      
      // 更新产品列表为搜索结果
      setProducts(response.products);
      
      // 记录搜索兴趣，用于AI助手感知
      if (query.trim()) {
        setLastSearchInterest(query.trim());
        localStorage.setItem('lastSearchInterest', query.trim());
        localStorage.setItem('lastSearchTime', new Date().toISOString());
        // 清除已通知记录，允许新的搜索词被通知
        localStorage.removeItem('lastNotifiedSearch');
      }
      
    } catch (error) {
      console.error('智能搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filterPrompt, allProducts, activeFilters]);

  // 清空所有筛选器
  const clearAllFilters = useCallback(async () => {
    setFilterPrompt("");
    setSlotsPrompt({ category: null, color: null, priceMax: null });
    setActiveFilters([]); // 清空筛选条件
    // 显示全部商品
    setProducts(allProducts);
  }, [allProducts]);

  // 只清除搜索文本，保留筛选条件
  const clearSearchOnly = useCallback(async () => {
    setFilterPrompt("");
    // 显示全部商品
    setProducts(allProducts);
  }, [allProducts]);

  // 处理筛选条件变化
  const handleFilterChange = useCallback((filters: any[]) => {
    setActiveFilters(filters);
  }, []);

  // 初始化时加载产品
  useEffect(() => {
    if (!isInitialized) {
      loadProducts();
    }
  }, [isInitialized, loadProducts]);

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
    activeFilters,
    loading,
    mergedSlots,
    lastSearchInterest,
    setFilterPrompt,
    setSlotsPrompt,
    loadProducts,
    handleSmartSearch,
    handleFilterChange,
    clearAllFilters,
    clearSearchOnly,
    getSearchInterest,
    clearSearchInterest
  };
}
