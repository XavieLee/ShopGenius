import React, { useState, useEffect } from "react";
import cls from "classnames";
import { TabType } from "./types";
import { useAI } from "./hooks/useAI";
import { useCart } from "./hooks/useCart";
import { useProducts } from "./hooks/useProducts";
import AttractiveHomePage from "./components/AttractiveHomePage";
import { AssistantPage } from "./components/pages/AssistantPage";
import { ShopPage } from "./components/pages/ShopPage";
import { CartDrawer } from "./components/cart/CartDrawer";
import { CartIcon } from "./components/ui";

/**
 * ShopGenius App - AI购物助手
 * 重构后的主应用组件，按功能模块拆分
 */

export default function App() {
  // 应用状态 - 默认显示导购页面
  const [tab, setTab] = useState<TabType>("assistant");
  const [cartOpen, setCartOpen] = useState(false);

  // 自定义Hooks
  const ai = useAI();
  const cart = useCart();
  const products = useProducts();

  // 初始化AI（只执行一次）
  useEffect(() => {
    if (!ai.aiInitializedRef.current) {
      ai.aiInitializedRef.current = true;
      ai.initializeAI();
    }
  }, []); // 移除ai依赖，避免重复初始化

  // 单独的清理effect，用于组件卸载时关闭WebSocket连接
  useEffect(() => {
    return () => {
      if (ai.wsConnection) {
        ai.wsConnection.disconnect();
      }
    };
  }, [ai.wsConnection]); // 只依赖wsConnection

  // 当切换到导购页面时，检查搜索兴趣
  useEffect(() => {
    if (tab === "assistant") {
      // 重置通知状态
      ai.resetSearchInterestNotification();
      // 延迟一点时间再检查，确保AI初始化完成
      setTimeout(() => {
        ai.checkAndNotifySearchInterest();
      }, 1000);
    }
  }, [tab, ai]);



  return (
    <div className="app-container min-h-screen bg-black text-white">
      <div className="relative w-full h-screen bg-black flex flex-col">
        {/* 头部导航 - 按照设计稿样式，适配手机端safe-area */}
        <header className="px-4 py-3 bg-black relative z-10" style={{ paddingTop: `max(12px, env(safe-area-inset-top))` }}>
          <div className="flex items-center justify-between">
            {/* 导航标签 */}
            <div className="flex gap-6 sm:gap-8">
              <button 
                onClick={() => setTab("assistant")} 
                className={cls("relative text-sm sm:text-base font-medium transition-colors", 
                  tab === "assistant" ? "text-white" : "text-gray-400"
                )}
              >
                导购
                {tab === "assistant" && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
              <button 
                onClick={() => setTab("shop")} 
                className={cls("relative text-sm sm:text-base font-medium transition-colors", 
                  tab === "shop" ? "text-white" : "text-gray-400"
                )}
              >
                逛逛
                {tab === "shop" && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
            </div>
            
            {/* 购物车图标 */}
            <button 
              onClick={() => setCartOpen(true)} 
              className="relative p-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              </svg>
              {cart.cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center font-medium text-[10px] px-1">
                  {cart.cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="flex-1 overflow-auto bg-black relative">
          {tab === "assistant" ? (
            <AssistantPage
              persona={ai.currentPersona?.id || "friendly"}
              aiPersonas={ai.aiPersonas}
              messages={ai.messages}
              typing={ai.typing}
              showHistoryHint={ai.showHistoryHint}
              tab={tab}
              onPersonaSwitch={ai.handlePersonaSwitch}
              onSend={ai.handleSend}
              onAddToCart={cart.addToCart}
              justAddedId={cart.justAddedId}
              cart={cart.cart}
            />
          ) : (
            <ShopPage
              products={products.products}
              productsLoading={products.productsLoading}
              filterPrompt={products.filterPrompt}
              slotsPrompt={products.slotsPrompt}
              loading={products.loading}
              justAddedId={cart.justAddedId}
              onFilterPromptChange={products.setFilterPrompt}
              onSlotsPromptChange={products.setSlotsPrompt}
              onSmartSearch={products.handleSmartSearch}
              onClearFilters={products.clearAllFilters}
              onAddToCart={cart.addToCart}
            />
          )}
        </main>


        {/* Toast提示 */}
        {cart.toast && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-30 bg-black text-white text-xs px-3 py-2 rounded-full shadow">
            {cart.toast}
          </div>
        )}

        {/* 购物车抽屉 */}
        <CartDrawer
          isOpen={cartOpen}
          cart={cart.cart}
          cartCount={cart.cartCount}
          cartTotal={cart.cartTotal}
          onClose={() => setCartOpen(false)}
          onClearCart={cart.clearCart}
          onUpdateQuantity={cart.updateCartQuantity}
          onRemoveFromCart={cart.removeFromCart}
        />
      </div>
    </div>
  );
}
