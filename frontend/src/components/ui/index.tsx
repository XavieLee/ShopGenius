import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import cls from 'classnames';
import { AIPersona, PERSONAS } from '../../types';
import { Slots } from '../../types';

// AI风格切换器
export function PersonaSwitcher({ value, onChange, personas }: { 
  value: string; 
  onChange: (v: string) => void;
  personas?: AIPersona[];
}) { 
  const displayPersonas = personas && personas.length > 0 ? personas : PERSONAS;
  
  return (
    <div className="inline-flex gap-2">
      {displayPersonas.map((p) => (
        <button 
          key={p.id} 
          onClick={() => onChange(p.id)} 
          className={cls("px-3 py-1.5 text-xs rounded-full border", 
            value === p.id ? "bg-black text-white" : "bg-white"
          )} 
          title={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  ); 
}

// 筛选条件标签 - 优化设计
export function SlotChips({ slots, onRemove, onQuickSet }: { 
  slots: Slots; 
  onRemove: (k: keyof Slots) => void; 
  onQuickSet: (k: keyof Slots, v: any) => void; 
}) { 
  const chips: Array<{k: keyof Slots; label: string; v: any; icon: string}> = []; 
  if(slots.category) chips.push({k:"category", label:slots.category, v:slots.category, icon:"📂"}); 
  if(slots.color) chips.push({k:"color", label:slots.color, v:slots.color, icon:"🎨"}); 
  if(slots.priceMax != null) chips.push({k:"priceMax", label:`¥${slots.priceMax}以下`, v:slots.priceMax, icon:"💰"}); 
  
  return (
    <div className="flex flex-wrap gap-2">
      {!chips.length && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>暂无筛选条件</span>
        </div>
      )}
      {chips.map((c,i) => (
        <div key={i} className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-full px-3 py-1.5 text-xs text-orange-300 shadow-sm">
          <span className="text-sm">{c.icon}</span>
          <span className="font-medium">{c.label}</span>
          <button 
            className="ml-1 w-4 h-4 rounded-full bg-orange-500/20 hover:bg-orange-500/40 flex items-center justify-center text-orange-400 hover:text-orange-300 transition-all hover:scale-110" 
            onClick={() => onRemove(c.k)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  ); 
}

// 快速选择器 - 浮动下拉菜单
export function QuickSelect({ label, value, options, onChange }: { 
  label: string; 
  value: any; 
  options: Array<{label: string; value: any}>; 
  onChange: (v: any) => void; 
}) { 
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find(opt => opt.value === value) || options[0];
  
  const getIcon = (label: string) => {
    switch(label) {
      case '分类': return '📂';
      case '颜色': return '🎨';
      case '价格': return '💰';
      default: return '⚙️';
    }
  };

  // 计算下拉菜单位置
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 检查是否点击在下拉菜单容器内
      if (!target.closest('[data-dropdown-container]') && !target.closest('[data-dropdown-menu]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      updatePosition();
      // 使用 setTimeout 确保事件监听器在下一个事件循环中添加
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" data-dropdown-container>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-white transition-all min-w-[100px] backdrop-blur-sm shadow-sm hover:shadow-md hover:border-orange-500/30"
      >
        <span className="text-sm">{getIcon(label)}</span>
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-xs font-medium truncate">{selectedOption?.label}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && createPortal(
        <div 
          data-dropdown-menu
          className="fixed bg-gray-900/95 border border-gray-700/60 rounded-xl shadow-2xl z-[9999] max-h-48 overflow-y-auto backdrop-blur-md"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            minWidth: '200px'
          }}
        >
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Option clicked:', opt.label, opt.value);
                onChange(opt.value);
                setIsOpen(false);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-all first:rounded-t-xl last:rounded-b-xl ${
                opt.value === value 
                  ? 'bg-orange-500/20 text-orange-300 border-l-2 border-orange-500' 
                  : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{getIcon(label)}</span>
                <span>{opt.label}</span>
                {opt.value === value && (
                  <svg className="w-4 h-4 ml-auto text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  ); 
}

// 图标按钮
export function IconButton({ label, active, onClick }: { 
  label: string; 
  active?: boolean; 
  onClick: () => void; 
}) {
  return (
    <button 
      aria-label={label} 
      title={label} 
      onClick={onClick}
      className={cls("relative w-9 h-9 rounded-full border flex items-center justify-center transition-transform", 
        active ? "bg-black text-white scale-95" : "bg-white hover:scale-105"
      )}
    >
      {active ? <CheckIcon /> : <CartIcon />}
    </button>
  );
}

// 购物车图标
export function CartIcon() { 
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
    </svg>
  ); 
}

// 勾选图标
export function CheckIcon() { 
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
    </svg>
  ); 
}

// 聊天输入框
export function ChatInput({ onSend }: { onSend: (t: string) => void }) {
  const [val, setVal] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  
  const handleSend = () => {
    if (val.trim() && !isComposing) {
      onSend(val);
      setVal("");
    }
  };
  
  return (
    <div className="p-4 bg-black flex items-center gap-3">
      <div className="flex-1 relative">
        <input 
          value={val} 
          onChange={(e) => setVal(e.target.value)} 
          onKeyDown={(e) => { 
            if(e.key === "Enter" && !isComposing) { 
              e.preventDefault();
              handleSend();
            } 
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="和导购说:想要本周推荐里更基础百搭" 
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-gray-400"
        />
        <button 
          onClick={handleSend} 
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
