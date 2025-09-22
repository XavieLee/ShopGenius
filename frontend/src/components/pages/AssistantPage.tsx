import React, { useState, useEffect } from 'react';
import { AIPersona, ChatMsg, Product, TabType, CartItem } from '../../types';
import { ChatContainer } from '../chat/ChatContainer';
import { productAPI } from '../../services/api';

interface AssistantPageProps {
  persona: string;
  messages: ChatMsg[];
  typing: boolean;
  showHistoryHint: boolean;
  tab: TabType;
  onSend: (text: string) => void;
  onAddToCart: (product: Product) => void;
  justAddedId: string | null;
  cart: CartItem[];
  isStreaming?: boolean;
  streamingMessageId?: string | null;
}

export function AssistantPage({
  persona,
  messages,
  typing,
  showHistoryHint,
  tab,
  onSend,
  onAddToCart,
  justAddedId,
  cart,
  isStreaming = false,
  streamingMessageId
}: AssistantPageProps) {
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'flash-sale' | 'weekly'>('flash-sale');
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [weeklyProducts, setWeeklyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取商品在购物车中的数量
  const getCartQuantity = (productId: string) => {
    const cartItem = cart.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // 加载商品数据
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const [flashSaleResponse, weeklyResponse] = await Promise.all([
          productAPI.getFlashSaleProducts(),
          productAPI.getWeeklyRecommendations()
        ]);
        
        setFlashSaleProducts(flashSaleResponse.products);
        setWeeklyProducts(weeklyResponse.products);
      } catch (error) {
        console.error('加载商品数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // 如果显示聊天界面，返回原来的聊天页面
  if (showChat) {
    return (
      <section className="flex flex-col h-full bg-black">
        <ChatContainer 
          messages={messages}
          typing={typing}
          showHistoryHint={showHistoryHint}
          tab={tab}
          onSend={onSend}
          onAddToCart={onAddToCart}
          justAddedId={justAddedId}
          onBack={() => setShowChat(false)}
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId}
        />
      </section>
    );
  }

  // 显示AI助手介绍页面
  return (
    <section className="flex flex-col h-full bg-black">
      {/* AI助手信息区域 - 按照设计稿样式 */}
      <div className="px-4 py-6 text-center">
        {/* AI头像 */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
          <img 
            src="/girl.gif" 
            alt="AI助手" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* AI名称 */}
        <h1 className="text-2xl font-bold text-white mb-2">小艺</h1>
        
        {/* 成就徽章 */}
        <div className="inline-flex items-center px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full mb-3">
          <span className="text-yellow-400 mr-1">🏆</span>
          <span className="text-yellow-400 text-sm">本月最佳AI购物导购</span>
        </div>
        
        {/* 标签 */}
        <div className="flex justify-center gap-2 mb-3">
          <span className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full">时尚敏锐</span>
          <span className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full">亲和专业</span>
          <span className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full">高效成交</span>
        </div>
        
        {/* 描述 */}
        <p className="text-gray-400 text-sm mb-4">专注奢侈品推荐,用专业眼光帮你挑选心仪好物。</p>
        
        {/* 数据统计 */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-white font-semibold">3.2K+单</div>
            <div className="text-gray-400 text-xs">月成交量</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">¥3.5M/月</div>
            <div className="text-gray-400 text-xs">GMV</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">99% 好评</div>
            <div className="text-gray-400 text-xs">好评率</div>
          </div>
        </div>
        
        {/* 开始对话按钮 */}
        <button 
          onClick={() => setShowChat(true)}
          className="mx-auto bg-gray-100 text-black py-2 px-6 rounded-full font-medium flex items-center justify-center gap-2 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          点击进行对话
        </button>
      </div>
      
      {/* 商品展示区域 */}
      <div className="flex flex-col h-full">
        {/* 悬浮的商品标签页 */}
        <div className="sticky top-0 z-10 bg-black px-4 py-2 border-b border-gray-800">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('flash-sale')}
              className={`relative text-base font-medium transition-colors ${
                activeTab === 'flash-sale' ? 'text-white' : 'text-gray-400'
              }`}
            >
              她的秒杀商品
              {activeTab === 'flash-sale' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('weekly')}
              className={`relative text-base font-medium transition-colors ${
                activeTab === 'weekly' ? 'text-white' : 'text-gray-400'
              }`}
            >
              她的本周推荐
              {activeTab === 'weekly' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white"></div>
              )}
            </button>
          </div>
        </div>
        
        {/* 商品卡片列表 */}
        <div className="flex-1 overflow-auto px-4 py-4">
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-8 h-8 mb-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                <p className="text-gray-400 text-sm">加载中...</p>
              </div>
            ) : (
              (activeTab === 'flash-sale' ? flashSaleProducts : weeklyProducts).map((product) => (
                <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-4">
                    {/* 商品图片 */}
                    <div className="flex-shrink-0">
                      <img 
                        src={product.image || "/girl.gif"} 
                        alt={product.name} 
                        className="w-24 h-24 rounded-lg object-cover" 
                      />
                    </div>
                    
                    {/* 商品信息 */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* 商品名称 */}
                        <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight">
                          {product.name}
                        </h3>
                        
                        {/* 价格信息和折扣徽章 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-600">
                              ¥{Number(product.price).toFixed(2)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ¥{Number(product.originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          {/* 折扣徽章 */}
                          {product.originalPrice && (
                            <div className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-medium">
                              省 {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                            </div>
                          )}
                        </div>
                        
                        {/* 销量和评分以及购物车按钮 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>已售 {Number(product.reviews || 0) > 1000 ? `${(Number(product.reviews || 0) / 1000).toFixed(1)}K+` : `${product.reviews || 0}+`}</span>
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(Number(product.rating) || 0)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="ml-1">({product.reviews || 0})</span>
                            </div>
                          </div>
                          
                          {/* 购物车按钮 */}
                          <div className="relative">
                            <button 
                              onClick={() => onAddToCart(product)}
                              className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                              </svg>
                            </button>
                            {getCartQuantity(product.id) > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center font-medium text-[10px] px-1">
                                {getCartQuantity(product.id)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* 如果没有商品数据 */}
            {!loading && (activeTab === 'flash-sale' ? flashSaleProducts : weeklyProducts).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm mb-1">
                  {activeTab === 'flash-sale' ? '暂无秒杀商品' : '暂无推荐商品'}
                </p>
                <p className="text-gray-500 text-xs">
                  {activeTab === 'flash-sale' ? '更多优惠商品即将上线' : '更多精选商品即将推荐'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
