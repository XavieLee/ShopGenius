import React from 'react';
import cls from 'classnames';
import { ChatMsg, Product } from '../../types';
import { formatMessageTime } from '../../utils';
import { IconButton } from '../ui';

interface ChatMessageProps {
  message: ChatMsg;
  onAddToCart: (product: Product) => void;
  justAddedId: string | null;
}

export function ChatMessage({ message, onAddToCart, justAddedId }: ChatMessageProps) {
  const { role, text, products, product, timestamp } = message;

  return (
    <div className={cls("flex", role === "user" ? "justify-end" : "justify-start")}>
      {role === "assistant" && !product && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 self-end">
          <img 
            src="/girl.gif" 
            alt="AI助手" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="max-w-[90%] space-y-3">
        {/* 先显示AI的文本回复 */}
        {text && (
          <div className={cls("max-w-[85%] rounded-2xl px-4 py-2 relative group", 
            role === "user" ? "bg-black text-white" : "bg-gray-100"
          )}>
            <div className="relative">
              <div className="pr-8">
                {text}
              </div>
              <div className="absolute bottom-0 right-0 text-xs text-gray-500 opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                {formatMessageTime(timestamp)}
              </div>
            </div>
          </div>
        )}
        
        {/* 然后显示商品卡片 */}
        {(product || (products && products.length > 0)) && (
          <div className="space-y-3">
            {(products && products.length > 0 ? products : (product ? [product] : [])).map((product, productIdx) => (
              <div key={productIdx} className="rounded-2xl border overflow-hidden bg-white relative group">
                <div className="grid grid-cols-5 gap-0">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="col-span-2 w-full h-full object-cover" 
                  />
                  <div className="col-span-3 p-3">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.category} · {product.color}</div>
                    <div className="text-sm mt-1 line-clamp-2">{product.description}</div>
                    <div className="mt-2 font-semibold">{product.price}</div>
                    <div className="mt-3 flex gap-2 items-center">
                      <IconButton
                        label="Add to cart"
                        active={justAddedId === product.id}
                        onClick={() => onAddToCart(product)}
                      />
                      <button 
                        className="rounded-xl border px-3 py-1.5 text-sm" 
                        onClick={() => alert("Compare flow TBD")}
                      >
                        + Compare
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                  {formatMessageTime(timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
