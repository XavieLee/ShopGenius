import { useState, useEffect, useCallback } from 'react';
import { cartAPI, Product, CartItem } from '../services/api';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cartCount = cart.reduce((s, it) => s + it.quantity, 0);
  const cartTotal = cart.reduce((s, it) => {
    const price = typeof it.price === 'string' ? parseFloat(it.price) : it.price;
    return s + it.quantity * (isNaN(price) ? 0 : price);
  }, 0);

  // 加载购物车
  const loadCart = useCallback(async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.items);
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  }, []);

  // 添加到购物车
  const addToCart = useCallback(async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
      await loadCart();
      
      // 点击反馈
      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 900);
      setToast(`已添加 "${product.name}" 到购物车`);
      setTimeout(() => setToast(null), 1200);
    } catch (error) {
      console.error('添加到购物车失败:', error);
      setToast('添加到购物车失败');
      setTimeout(() => setToast(null), 1200);
    }
  }, [loadCart]);

  // 从购物车移除
  const removeFromCart = useCallback(async (productId: string) => {
    try {
      await cartAPI.removeFromCart(productId);
      await loadCart();
    } catch (error) {
      console.error('移除商品失败:', error);
    }
  }, [loadCart]);

  // 更新购物车商品数量
  const updateCartQuantity = useCallback(async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await cartAPI.removeFromCart(productId);
      } else {
        await cartAPI.updateCartItem(productId, quantity);
      }
      await loadCart();
    } catch (error) {
      console.error('更新购物车失败:', error);
    }
  }, [loadCart]);

  // 清空购物车
  const clearCart = useCallback(async () => {
    try {
      await cartAPI.clearCart();
      await loadCart();
    } catch (error) {
      console.error('清空购物车失败:', error);
    }
  }, [loadCart]);

  // 初始化时加载购物车
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    cart,
    cartCount,
    cartTotal,
    justAddedId,
    toast,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
  };
}
