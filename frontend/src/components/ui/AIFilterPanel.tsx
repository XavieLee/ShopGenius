import React, { useState, useRef } from 'react';

interface FilterCondition {
  type: 'category' | 'color' | 'price' | 'brand' | 'rating';
  value: any;
  label: string;
}

interface AIFilterPanelProps {
  onFilterChange: (filters: FilterCondition[]) => void;
  onClearFilters: () => void;
  className?: string;
}

export function AIFilterPanel({
  onFilterChange,
  onClearFilters,
  className = ""
}: AIFilterPanelProps) {
  // const [isOpen, setIsOpen] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // AI筛选建议
  const aiFilterSuggestions = [
    "只看5000块以下的",
    "筛选出红色的商品",
    "只要Nike品牌的",
    "按销量最高排序",
    "只看4星以上评价",
    "价格从低到高排列",
    "只要运动类商品",
    "筛选出黑色的鞋子"
  ];

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterInput(value);
    
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理焦点
  const handleFocus = () => {
    if (filterInput.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setFilterInput(suggestion);
    setShowSuggestions(false);
    handleApplyFilter(suggestion);
  };

  // 应用AI筛选
  const handleApplyFilter = async (input = filterInput) => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // 模拟AI分析筛选条件
      const newFilter = await analyzeFilterInput(input);
      if (newFilter) {
        const updatedFilters = [...activeFilters, newFilter];
        setActiveFilters(updatedFilters);
        onFilterChange(updatedFilters);
        setFilterInput('');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 模拟AI分析筛选输入
  const analyzeFilterInput = async (input: string): Promise<FilterCondition | null> => {
    // 这里应该调用后端AI分析API
    // 现在用简单的规则模拟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (input.includes('红色')) {
      return { type: 'color', value: '红色', label: '红色' };
    } else if (input.includes('黑色')) {
      return { type: 'color', value: '黑色', label: '黑色' };
    } else if (input.includes('5000') || input.includes('5000块')) {
      return { type: 'price', value: 5000, label: '5000元以下' };
    } else if (input.includes('Nike')) {
      return { type: 'brand', value: 'Nike', label: 'Nike' };
    } else if (input.includes('运动')) {
      return { type: 'category', value: 'Sports', label: '运动' };
    } else if (input.includes('4星') || input.includes('4星以上')) {
      return { type: 'rating', value: 4, label: '4星以上' };
    }
    
    return null;
  };

  // 移除筛选条件
  const removeFilter = (index: number) => {
    const updatedFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // 清空所有筛选 - 现在通过输入框的x号来清空
  // const clearAllFilters = () => {
  //   setActiveFilters([]);
  //   setFilterInput(''); // 清空输入框
  //   setShowSuggestions(false); // 隐藏建议
  //   onFilterChange([]);
  //   onClearFilters();
  // };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilter();
    }
  };

  return (
    <div className={`relative z-20 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-2xl ${className}`}>
      {/* AI筛选输入框 */}
        <div className="relative p-2">
          <div className="relative">
            {/* 背景光效 */}
            <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 blur-sm transition-opacity duration-300 pointer-events-none ${
              isAnalyzing ? 'opacity-100' : 'opacity-0'
            }`} />
            
            <input
              ref={inputRef}
              type="text"
              value={filterInput}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              placeholder="AI智能筛选，如：5000元以下、Nike品牌..."
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 pr-16 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              disabled={isAnalyzing}
            />
            
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* 清空输入按钮 */}
              {filterInput.trim() && (
                <button
                  onClick={() => setFilterInput('')}
                  className="p-1 text-gray-400 hover:text-orange-400 transition-colors rounded hover:bg-gray-800/50"
                  disabled={isAnalyzing}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* 应用按钮 */}
              <button
                onClick={() => handleApplyFilter()}
                disabled={!filterInput.trim() || isAnalyzing}
                className="px-2 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded text-xs font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>分析中</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>应用</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI筛选建议 */}
          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl z-[9999]"
            >
              <div className="p-3">
                <div className="space-y-1">
                  {aiFilterSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm text-gray-300 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* 已应用的筛选条件 */}
      {activeFilters.length > 0 && (
        <div className="p-3 pt-0">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-lg px-2 py-1"
              >
                <span className="text-xs text-orange-300">{filter.label}</span>
                <button
                  onClick={() => removeFilter(index)}
                  className="text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
