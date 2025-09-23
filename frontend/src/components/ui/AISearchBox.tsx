import React, { useState, useRef } from 'react';

interface AISearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onVoiceInput?: () => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function AISearchBox({
  value,
  onChange,
  onSearch,
  onVoiceInput,
  loading = false,
  placeholder = "用自然语言描述你的需求...",
  className = ""
}: AISearchBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // AI搜索建议
  const aiSuggestions = [
    "我想要一双红色的运动鞋，价格在500-1000之间",
    "帮我找一些适合夏天的连衣裙",
    "推荐一些性价比高的蓝牙耳机",
    "我想要一个适合送礼的护肤品套装",
    "帮我找一些适合办公的笔记本电脑",
    "推荐一些适合健身的运动装备"
  ];

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // 显示建议
    if (newValue.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理焦点
  const handleFocus = () => {
    setIsFocused(true);
    if (value.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // 延迟隐藏建议，允许点击建议
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setShowSuggestions(false);
      }
    }, 200);
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 处理搜索
  const handleSearch = async () => {
    if (!value.trim()) return;
    
    setIsAnalyzing(true);
    try {
      await onSearch();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`relative z-20 ${className}`}>
      {/* 主搜索框 */}
      <div className="relative">
        {/* 背景光效 */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-orange-500/20 blur-sm transition-opacity duration-300 pointer-events-none ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* 搜索框容器 */}
        <div className={`relative bg-gray-900/80 backdrop-blur-md border-2 rounded-2xl transition-all duration-300 ${
          isFocused 
            ? 'border-orange-500/50 shadow-lg shadow-orange-500/20' 
            : 'border-gray-700/50 hover:border-gray-600/50'
        }`}>
          {/* 输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full bg-transparent px-6 py-4 pr-32 text-white placeholder-gray-400 focus:outline-none text-sm"
            disabled={loading || isAnalyzing}
          />
          
          {/* 右侧按钮组 */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* 语音输入按钮 */}
            {onVoiceInput && (
              <button
                onClick={onVoiceInput}
                className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors rounded-lg hover:bg-gray-800/50"
                disabled={loading || isAnalyzing}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {/* 清空按钮 */}
            {value.trim() && (
              <button
                onClick={() => onChange('')}
                className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors rounded-lg hover:bg-gray-800/50"
                disabled={loading || isAnalyzing}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* AI搜索按钮 */}
            <button
              onClick={handleSearch}
              disabled={!value.trim() || loading || isAnalyzing}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-xs font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-orange-500/25 flex items-center gap-1"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>分析中</span>
                </>
              ) : loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>搜索中</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>搜索</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI建议下拉框 */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-xl z-[9999] max-h-80 overflow-y-auto"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">AI搜索建议</span>
            </div>
            
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 group border border-transparent hover:border-orange-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {suggestion}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-700/50">
              <p className="text-xs text-gray-400 text-center">
                💡 支持描述颜色、价格、用途、品牌等需求
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
