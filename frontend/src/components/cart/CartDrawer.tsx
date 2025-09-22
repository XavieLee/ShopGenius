import React from 'react';
import { CartItem } from '../../services/api';
import { currency } from '../../utils';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  onClose: () => void;
  onClearCart: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
}

export function CartDrawer({
  isOpen,
  cart,
  cartCount,
  cartTotal,
  onClose,
  onClearCart,
  onUpdateQuantity,
  onRemoveFromCart
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/25 pointer-events-auto" 
        onClick={onClose} 
      />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t shadow-2xl p-4 pointer-events-auto max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">购物车 ({cartCount})</div>
          <button 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors" 
            onClick={onClearCart}
          >
            清空
          </button>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">
              购物车是空的
            </div>
          ) : (
            cart.map((it) => (
              <div key={it.productId} className="py-3 flex items-center gap-3">
                <img 
                  src={it.image || it.image_url || "/girl.gif"} 
                  alt={it.name} 
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200" 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{it.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currency(it.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors" 
                    onClick={() => onUpdateQuantity(it.productId, it.quantity - 1)}
                  >
                    <span className="text-sm">−</span>
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-800">{it.quantity}</span>
                  <button 
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors" 
                    onClick={() => onUpdateQuantity(it.productId, it.quantity + 1)}
                  >
                    <span className="text-sm">+</span>
                  </button>
                </div>
                <button 
                  className="ml-3 text-xs text-red-500 hover:text-red-700 transition-colors" 
                  onClick={() => onRemoveFromCart(it.productId)}
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-lg">总计: {currency(cartTotal)}</div>
          <button 
            className="rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors" 
            onClick={() => alert("小助理稍后联系您下单哦~")}
          >
            结算
          </button>
        </div>
      </div>
    </div>
  );
}
