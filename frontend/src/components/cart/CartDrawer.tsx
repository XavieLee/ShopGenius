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
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t shadow-2xl p-4 pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Cart ({cartCount})</div>
          <button 
            className="text-sm text-gray-600 underline" 
            onClick={onClearCart}
          >
            清空
          </button>
        </div>
        <div className="max-h-60 overflow-auto divide-y">
          {cart.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center">
              购物车是空的.
            </div>
          ) : (
            cart.map((it) => (
              <div key={it.productId} className="py-2 flex items-center gap-3">
                <img 
                  src={it.image} 
                  alt={it.name} 
                  className="w-12 h-12 rounded object-cover border" 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{it.name}</div>
                  <div className="text-xs text-gray-600">
                    {currency(it.price)} · {it.quantity} pcs
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="rounded-full w-7 h-7 border" 
                    onClick={() => onUpdateQuantity(it.productId, it.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm">{it.quantity}</span>
                  <button 
                    className="rounded-full w-7 h-7 border" 
                    onClick={() => onUpdateQuantity(it.productId, it.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button 
                  className="ml-2 text-xs text-gray-500 underline" 
                  onClick={() => onRemoveFromCart(it.productId)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="font-semibold">Total: {currency(cartTotal)}</div>
          <button 
            className="rounded-xl bg-black text-white px-4 py-2 text-sm" 
            onClick={() => alert("小助理稍后联系您下单哦~")}
          >
            结算
          </button>
        </div>
      </div>
    </div>
  );
}
