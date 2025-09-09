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
  // 应用状态
  const [tab, setTab] = useState<TabType>("home");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900">
      <div className="relative w-full h-screen bg-white flex flex-col">
        {/* 头部导航 */}
        <header className="p-3 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-lg">ShopGenius</div>
            <div className="ml-1 flex gap-1 rounded-full bg-gray-100 p-1">
              <button 
                onClick={() => setTab("home")} 
                className={cls("px-3 py-1.5 text-sm rounded-full", 
                  tab === "home" ? "bg-white shadow border" : "text-gray-600"
                )}
              >
                首页
              </button>
              <button 
                onClick={() => setTab("assistant")} 
                className={cls("px-3 py-1.5 text-sm rounded-full", 
                  tab === "assistant" ? "bg-white shadow border" : "text-gray-600"
                )}
              >
                导购
              </button>
              <button 
                onClick={() => setTab("shop")} 
                className={cls("px-3 py-1.5 text-sm rounded-full", 
                  tab === "shop" ? "bg-white shadow border" : "text-gray-600"
                )}
              >
                逛逛
              </button>
            </div>
          </div>
          <button 
            onClick={() => setCartOpen(true)} 
            className="relative rounded-full border px-3 py-1.5 text-sm bg-white flex items-center justify-center w-10 h-10"
          >
            <CartIcon />
            {cart.cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {cart.cartCount}
              </span>
            )}
          </button>
        </header>

        {/* 主要内容区域 */}
        <main className="flex-1 overflow-auto px-4 pt-4 pb-0">
          {tab === "home" ? (
            <AttractiveHomePage 
              onStartChat={() => setTab("assistant")}
              onSwitchToShop={() => setTab("shop")}
            />
          ) : tab === "assistant" ? (
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
