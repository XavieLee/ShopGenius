import React from 'react';
import { Product, Slots, CATEGORIES, COLORS } from '../../types';
import { parseFilterPrompt } from '../../utils';
import { SlotChips, QuickSelect, IconButton } from '../ui';

interface ShopPageProps {
  products: Product[];
  productsLoading: boolean;
  filterPrompt: string;
  slotsPrompt: Slots;
  loading: boolean;
  justAddedId: string | null;
  onFilterPromptChange: (value: string) => void;
  onSlotsPromptChange: (slots: Slots) => void;
  onSmartSearch: () => void;
  onClearFilters: () => void;
  onAddToCart: (product: Product) => void;
}

export function ShopPage({
  products,
  productsLoading,
  filterPrompt,
  slotsPrompt,
  loading,
  justAddedId,
  onFilterPromptChange,
  onSlotsPromptChange,
  onSmartSearch,
  onClearFilters,
  onAddToCart
}: ShopPageProps) {
  const parsedFromPrompt = parseFilterPrompt(filterPrompt);
  const mergedSlots: Slots = {
    category: slotsPrompt.category ?? parsedFromPrompt.category ?? null,
    color: slotsPrompt.color ?? parsedFromPrompt.color ?? null,
    priceMax: slotsPrompt.priceMax ?? parsedFromPrompt.priceMax ?? null,
  };

  return (
    <section className="bg-black min-h-screen">
      {/* 搜索栏 - 深色主题 */}
      <div className="bg-black px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              value={filterPrompt} 
              onChange={(e) => onFilterPromptChange(e.target.value)} 
              placeholder="搜索商品、品牌、店铺" 
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2.5 pr-12 focus:outline-none focus:bg-gray-800 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-400 text-sm backdrop-blur-sm" 
            />
            <button 
              onClick={onSmartSearch} 
              disabled={loading}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-orange-500/25"
            >
              {loading ? '...' : '搜索'}
            </button>
          </div>
          <button 
            onClick={() => {
              onFilterPromptChange("");
              onSmartSearch();
            }} 
            className="text-gray-400 hover:text-orange-400 transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-800/50"
          >
            清除
          </button>
        </div>
      </div>

      {/* 筛选栏 - 深色主题 */}
      <div className="bg-black border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">筛选</h3>
            <button 
              onClick={onClearFilters} 
              className="text-xs text-gray-400 hover:text-orange-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-gray-800/50"
            >
              重置
            </button>
          </div>
          
          {/* 已选择的筛选条件 */}
          <div className="mb-3">
            <SlotChips 
              slots={mergedSlots} 
              onRemove={(k) => onSlotsPromptChange({...slotsPrompt, [k]: null})} 
              onQuickSet={(k,v) => onSlotsPromptChange({...slotsPrompt, [k]: v})} 
            />
          </div>
          
          {/* 筛选选项 - 横向布局 */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="flex-shrink-0">
              <QuickSelect 
                label="分类" 
                value={slotsPrompt.category} 
                onChange={(v) => onSlotsPromptChange({...slotsPrompt, category: v})} 
                options={[
                  {label:"全部分类", value:null}, 
                  ...CATEGORIES.map((c) => ({label:c, value:c}))
                ]} 
              />
            </div>
            
            <div className="flex-shrink-0">
              <QuickSelect 
                label="颜色" 
                value={slotsPrompt.color} 
                onChange={(v) => onSlotsPromptChange({...slotsPrompt, color: v})} 
                options={[
                  {label:"全部颜色", value:null}, 
                  ...COLORS.map((c) => ({label:c, value:c}))
                ]} 
              />
            </div>
            
            <div className="flex-shrink-0">
              <QuickSelect 
                label="价格" 
                value={slotsPrompt.priceMax} 
                onChange={(v) => onSlotsPromptChange({...slotsPrompt, priceMax: v})} 
                options={[
                  {label:"不限价格", value:null},
                  {label:"¥100以下", value:100},
                  {label:"¥500以下", value:500},
                  {label:"¥1000以下", value:1000},
                  {label:"¥5000以下", value:5000}
                ]} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 解析结果提示 */}
      {filterPrompt && (
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
          <div className="text-xs text-gray-300">
            <span className="font-medium">智能解析:</span> {JSON.stringify(parsedFromPrompt)}
          </div>
        </div>
      )}

      {/* 产品网格 */}
      <div className="px-4 py-4">
        <div id="grid" className="grid grid-cols-2 gap-3 pb-4">
        {productsLoading ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            Loading products...
          </div>
        ) : products.length > 0 ? (
          products.map((p) => (
            <article key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* 商品图片 */}
              <div className="relative">
                <img src={p.image} alt={p.name} className="w-full h-40 object-cover" />
                {/* 折扣徽章 */}
                {p.originalPrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    省 {Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100)}%
                  </div>
                )}
              </div>
              
              {/* 商品信息 */}
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-medium leading-tight text-sm text-gray-900 mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{p.category} · {p.color}</p>
                
                {/* 价格信息 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-red-600">
                    ¥{Number(p.price).toFixed(2)}
                  </span>
                  {p.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ¥{Number(p.originalPrice).toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* 销量和评分 */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>已售 {Number(p.reviews || 0) > 1000 ? `${(Number(p.reviews || 0) / 1000).toFixed(1)}K+` : `${p.reviews || 0}+`}</span>
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(Number(p.rating) || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1">({p.reviews || 0})</span>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="mt-auto flex items-center justify-between">
                  <button 
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors" 
                    onClick={() => alert("Compare flow TBD")}
                  >
                    + 对比
                  </button>
                  <button 
                    onClick={() => onAddToCart(p)}
                    className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center text-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm mb-1">未找到相关商品</p>
              <p className="text-gray-500 text-xs">请尝试调整筛选条件</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
