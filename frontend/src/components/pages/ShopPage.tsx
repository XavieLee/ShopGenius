import React, { useState, useRef } from 'react';
import { Product, Slots, CATEGORIES, COLORS } from '../../types';
import { parseFilterPrompt } from '../../utils';
import { SlotChips, QuickSelect } from '../ui';

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
  onClearSearchOnly: () => void;
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
  onClearSearchOnly,
  onAddToCart
}: ShopPageProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSmartSearchHint, setShowSmartSearchHint] = useState(false);
  const [smartParseEnabled, setSmartParseEnabled] = useState(true);
  const [filterInput, setFilterInput] = useState('');
  const [isFilterFocused, setIsFilterFocused] = useState(false);
  const [showFilterHint, setShowFilterHint] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSearchListening, setIsSearchListening] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const filterHintRef = useRef<HTMLDivElement>(null);
  
  const parsedFromPrompt = parseFilterPrompt(filterPrompt);
  const mergedSlots: Slots = {
    category: slotsPrompt.category ?? parsedFromPrompt.category ?? null,
    color: slotsPrompt.color ?? parsedFromPrompt.color ?? null,
    priceMax: slotsPrompt.priceMax ?? parsedFromPrompt.priceMax ?? null,
  };

  // 智能搜索提示示例
  const smartSearchExamples = [
    "红色运动鞋，价格500以下",
    "适合夏天的连衣裙",
    "苹果手机配件",
    "性价比高的蓝牙耳机",
    "适合送礼的护肤品"
  ];

  // AI筛选提示示例
  const aiFilterExamples = [
    "只看5000块以下的",
    "筛选出黑色的",
    "按销量最高排序",
    "只要红色商品",
    "价格从低到高",
    "只看4星以上评价"
  ];

  // 处理搜索框焦点
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSmartSearchHint(true);
  };

  const handleSearchBlur = (e: React.FocusEvent) => {
    // 检查焦点是否移到了提示框内
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (hintRef.current && hintRef.current.contains(relatedTarget)) {
      return; // 如果焦点移到了提示框内，不关闭提示框
    }
    
    setIsSearchFocused(false);
    // 延迟隐藏提示，让用户有时间点击示例
    setTimeout(() => setShowSmartSearchHint(false), 200);
  };

  // 点击示例文本
  const handleExampleClick = (example: string) => {
    onFilterPromptChange(example);
    setShowSmartSearchHint(false);
    searchInputRef.current?.focus();
  };

  // 切换智能解析开关
  const handleSmartParseToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSmartParseEnabled(!smartParseEnabled);
  };

  // 处理筛选框焦点
  const handleFilterFocus = () => {
    setIsFilterFocused(true);
    setShowFilterHint(true);
  };

  const handleFilterBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (filterHintRef.current && filterHintRef.current.contains(relatedTarget)) {
      return;
    }
    
    setIsFilterFocused(false);
    setTimeout(() => setShowFilterHint(false), 200);
  };

  // 点击筛选示例
  const handleFilterExampleClick = (example: string) => {
    setFilterInput(example);
    setShowFilterHint(false);
    filterInputRef.current?.focus();
  };

  // 应用AI筛选
  const handleApplyAIFilter = () => {
    if (filterInput.trim()) {
      // 解析筛选条件并应用到slots
      const parsedFilter = parseFilterPrompt(filterInput);
      console.log('AI筛选输入:', filterInput);
      console.log('解析结果:', parsedFilter);
      
      const newSlots = {
        ...slotsPrompt,
        category: parsedFilter.category ?? slotsPrompt.category,
        color: parsedFilter.color ?? slotsPrompt.color,
        priceMax: parsedFilter.priceMax ?? slotsPrompt.priceMax,
      };
      
      console.log('新的筛选条件:', newSlots);
      onSlotsPromptChange(newSlots);
      setFilterInput('');
      // 触发搜索以更新结果
      onSmartSearch();
    }
  };

  // 语音输入功能（模拟）
  const handleVoiceInput = () => {
    setIsListening(true);
    // 模拟语音识别
    setTimeout(() => {
      const voiceResult = "只看5000块以下的";
      setFilterInput(voiceResult);
      setIsListening(false);
    }, 2000);
  };

  // 搜索语音输入功能（模拟）
  const handleSearchVoiceInput = () => {
    setIsSearchListening(true);
    // 模拟语音识别
    setTimeout(() => {
      const voiceResult = "红色运动鞋";
      onFilterPromptChange(voiceResult);
      setIsSearchListening(false);
    }, 2000);
  };

  return (
    <section className="bg-black min-h-screen">
      {/* 搜索栏 - 深色主题 */}
      <div className="bg-black px-4 py-3 border-b border-gray-800 relative">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              ref={searchInputRef}
              value={filterPrompt} 
              onChange={(e) => onFilterPromptChange(e.target.value)} 
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder={
                isSearchFocused 
                  ? (smartParseEnabled ? "用自然语言描述你的需求..." : "输入关键词搜索商品...")
                  : "搜索商品、品牌、店铺"
              } 
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2.5 pr-20 focus:outline-none focus:bg-gray-800 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-400 text-sm backdrop-blur-sm" 
            />
            <button 
              onClick={handleSearchVoiceInput}
              disabled={isSearchListening}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            >
              {isSearchListening ? (
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button 
              onClick={onSmartSearch} 
              disabled={loading}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-orange-500/25"
            >
              {loading ? '...' : '搜索'}
            </button>
          </div>
          <button 
            onClick={onClearSearchOnly}
            className="text-gray-400 hover:text-orange-400 transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-800/50"
          >
            清除
          </button>
        </div>

        {/* 智能搜索提示 */}
        {showSmartSearchHint && (
          <div 
            ref={hintRef}
            className="absolute top-full left-4 right-4 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-xl z-50"
            onMouseDown={(e) => e.preventDefault()} // 防止点击时失焦
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">搜索设置</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">智能解析</span>
                  <button
                    onClick={handleSmartParseToggle}
                    className={`w-8 h-4 rounded-full relative transition-all duration-200 ${
                      smartParseEnabled 
                        ? 'bg-orange-500' 
                        : 'bg-gray-600'
                    }`}
                  >
                    <div 
                      className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${
                        smartParseEnabled 
                          ? 'right-0.5' 
                          : 'left-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-gray-300 mb-3">
                  {smartParseEnabled ? "试试这些自然语言搜索：" : "试试这些关键词搜索："}
                </p>
                {smartParseEnabled ? (
                  smartSearchExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="w-full text-left p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gray-400 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{example}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  ["运动鞋", "连衣裙", "手机配件", "蓝牙耳机", "护肤品"].map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(keyword)}
                      className="w-full text-left p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gray-400 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{keyword}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 text-center">
                  {smartParseEnabled 
                    ? "支持描述颜色、价格、用途、品牌等需求" 
                    : "输入商品名称、品牌或类别关键词"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
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

          {/* AI筛选输入框 */}
          <div className="mb-3 relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input 
                  ref={filterInputRef}
                  value={filterInput} 
                  onChange={(e) => setFilterInput(e.target.value)} 
                  onFocus={handleFilterFocus}
                  onBlur={handleFilterBlur}
                  placeholder={isFilterFocused ? "用自然语言描述筛选条件..." : "AI筛选：如'只看5000块以下的'"} 
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 pr-20 focus:outline-none focus:bg-gray-800 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-400 text-sm backdrop-blur-sm" 
                />
                <button 
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
                >
                  {isListening ? (
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button 
                  onClick={handleApplyAIFilter} 
                  disabled={!filterInput.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-orange-500/25"
                >
                  应用
                </button>
              </div>
            </div>

            {/* AI筛选提示 */}
            {showFilterHint && (
              <div 
                ref={filterHintRef}
                className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-xl z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white">AI筛选助手</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-gray-300 mb-3">试试这些筛选指令：</p>
                    {aiFilterExamples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleFilterExampleClick(example)}
                        className="w-full text-left p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-gray-400 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{example}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-xs text-gray-400 text-center">
                      支持价格、颜色、排序、评分等筛选条件
                    </p>
                  </div>
                </div>
              </div>
            )}
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
      {filterPrompt && smartParseEnabled && (
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
