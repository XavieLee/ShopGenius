import React, { useState } from 'react';
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

// 筛选条件标签
export function SlotChips({ slots, onRemove, onQuickSet }: { 
  slots: Slots; 
  onRemove: (k: keyof Slots) => void; 
  onQuickSet: (k: keyof Slots, v: any) => void; 
}) { 
  const chips: Array<{k: keyof Slots; label: string; v: any}> = []; 
  if(slots.category) chips.push({k:"category", label:`Category: ${slots.category}`, v:slots.category}); 
  if(slots.color) chips.push({k:"color", label:`Color: ${slots.color}`, v:slots.color}); 
  if(slots.priceMax != null) chips.push({k:"priceMax", label:`≤ $${slots.priceMax}`, v:slots.priceMax}); 
  
  return (
    <div className="flex flex-wrap gap-2">
      {!chips.length && (
        <span className="text-xs text-gray-500">No active filters. Use the controls below.</span>
      )}
      {chips.map((c,i) => (
        <span key={i} className="text-xs bg-white border rounded-full pl-3 pr-1 py-1 flex items-center gap-2">
          {c.label}
          <button 
            className="rounded-full w-5 h-5 border text-[11px]" 
            onClick={() => onRemove(c.k)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  ); 
}

// 快速选择器
export function QuickSelect({ label, value, options, onChange }: { 
  label: string; 
  value: any; 
  options: Array<{label: string; value: any}>; 
  onChange: (v: any) => void; 
}) { 
  return (
    <label className="text-xs flex items-center gap-2 border rounded-xl px-2 py-1 bg-white">
      <span className="text-gray-600">{label}</span>
      <select 
        className="text-xs outline-none" 
        value={value === null ? "__ANY__" : String(value)} 
        onChange={(e) => {
          const v = e.target.value; 
          onChange(v === "__ANY__" ? null : (isNaN(Number(v)) ? v : Number(v))); 
        }}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value === null ? "__ANY__" : String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2H1v2h3l3.6 7.59-1.35 2.44A2 2 0 0 0 8 18h12v-2H8l1.16-2z"/>
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
    <div className="p-3 border-t bg-white flex items-center gap-2">
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
        placeholder="Type a message…" 
        className="flex-1 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
      />
      <button 
        onClick={handleSend} 
        className="rounded-xl bg-black text-white px-4 py-2 text-sm"
      >
        Send
      </button>
    </div>
  );
}
