import React, { useState } from 'react';
import { Product } from '../../types';
import { AISearchBox, AIFilterPanel } from '../ui';

interface FilterCondition {
  type: 'category' | 'color' | 'price' | 'brand' | 'rating';
  value: any;
  label: string;
}

interface EnhancedShopPageProps {
  products: Product[];
  productsLoading: boolean;
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onAISearch?: (query: string) => Promise<void>;
  onAIFilter?: (filters: FilterCondition[]) => Promise<void>;
}

export function EnhancedShopPage({
  products,
  productsLoading,
  onAddToCart,
  searchQuery,
  onSearchQueryChange,
  onAISearch,
  onAIFilter
}: EnhancedShopPageProps) {
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 处理AI搜索
  const handleAISearch = async (query: string) => {
    if (!query.trim()) return;
    
    // 更新搜索框状态
    onSearchQueryChange(query);
    
    setIsSearching(true);
    try {
      if (onAISearch) {
        await onAISearch(query);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 处理AI筛选
  const handleAIFilter = async (filters: FilterCondition[]) => {
    setActiveFilters(filters);
    setIsFiltering(true);
    try {
      if (onAIFilter) {
        await onAIFilter(filters);
      }
    } finally {
      setIsFiltering(false);
    }
  };

  // 清空所有筛选
  const clearAllFilters = async () => {
    setActiveFilters([]);
    onSearchQueryChange('');
    if (onAIFilter) {
      onAIFilter([]);
    }
    // 重新加载默认商品列表
    if (onAISearch) {
      await onAISearch('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* 页面头部 */}
        <div className="relative z-30 bg-black/50 backdrop-blur-md border-b border-gray-800/50">
          <div className="px-4 py-6">
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg text-sm text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>筛选</span>
              </button>
            </div>

            {/* AI搜索框 */}
            <AISearchBox
              value={searchQuery}
              onChange={onSearchQueryChange}
              onSearch={() => handleAISearch(searchQuery)}
              loading={isSearching}
              placeholder="AI智能搜索，如：我想要一双红色的运动鞋..."
              className="mb-4"
            />

            {/* 当前筛选条件显示 */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-1 mb-2">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-lg px-2 py-1"
                  >
                    <span className="text-xs text-orange-300">{filter.label}</span>
                    <button
                      onClick={() => {
                        const newFilters = activeFilters.filter((_, i) => i !== index);
                        handleAIFilter(newFilters);
                      }}
                      className="text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-400 hover:text-orange-400 transition-colors px-2 py-1 rounded hover:bg-gray-800/50"
                >
                  清空全部
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilterPanel && (
          <div className="px-4 py-1 border-b border-gray-800/50">
            <AIFilterPanel
              onFilterChange={handleAIFilter}
              onClearFilters={clearAllFilters}
            />
          </div>
        )}

        {/* 商品列表 */}
        <div className="relative z-10 px-4 py-6">
          {/* 加载状态 */}
          {(productsLoading || isSearching || isFiltering) && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400">
                  {isSearching ? 'AI搜索中...' : isFiltering ? 'AI筛选中...' : '加载商品中...'}
                </span>
              </div>
            </div>
          )}

          {/* 商品网格 */}
          {!productsLoading && !isSearching && !isFiltering && (
            <>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">没有找到商品</h3>
                  <p className="text-gray-400 mb-4">试试调整搜索条件或筛选条件</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    清空筛选
                  </button>
                </div>
              ) : (
                <>
                  {/* 结果统计 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">{products.length}</span>
                      <span className="text-xs text-gray-500">件商品</span>
                    </div>
                  </div>

                  {/* 商品网格 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
                      >
                        {/* 商品图片 */}
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={product.image_url || product.image || "/girl.gif"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          
                          {/* 添加到购物车按钮 */}
                          <button
                            onClick={() => onAddToCart(product)}
                            className="absolute bottom-3 right-3 w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                            </svg>
                          </button>
                        </div>

                        {/* 商品信息 */}
                        <div className="p-3">
                          <h3 className="font-medium text-white text-xs mb-2 line-clamp-2 group-hover:text-orange-300 transition-colors">
                            {product.name}
                          </h3>
                          
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-2.5 h-2.5 ${
                                    i < Math.floor(Number(product.rating) || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-600'
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {product.reviews || 0}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-white">
                                ¥{product.price}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-xs text-gray-500 line-through">
                                  ¥{product.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
