import React from 'react';
import cls from 'classnames';
import { ChatMsg, Product } from '../../types';
import { MarkdownMessage } from './MarkdownMessage';

interface EnhancedChatMessageProps {
  message: ChatMsg;
  onAddToCart: (product: Product) => void;
  justAddedId: string | null;
  isStreaming?: boolean; // 是否是正在流式传输的消息
  streamingMessageId?: string | null; // 当前流式传输的消息ID
}

export function EnhancedChatMessage({ 
  message, 
  onAddToCart, 
  justAddedId,
  isStreaming = false,
  streamingMessageId
}: EnhancedChatMessageProps) {
  const { role, text, products, product, timestamp, id } = message;
  
  // 检查当前消息是否是正在流式传输的消息
  const isCurrentlyStreaming = isStreaming && id === streamingMessageId;

  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* 文本消息行 */}
      {text && (
        <div className={cls("flex", role === "user" ? "justify-end" : "justify-start")}>
          {role === "assistant" && (
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 self-end">
              <img 
                src="/girl.gif" 
                alt="AI助手" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="inline-block" style={{ maxWidth: '75%' }}>
            <div className={cls("rounded-2xl px-4 py-3 shadow-sm", 
              role === "user" 
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                : "bg-gray-800 text-white"
            )}>
              <div>
                {/* 如果是AI消息，使用Markdown渲染 */}
                {role === "assistant" ? (
                  <MarkdownMessage
                    content={text}
                    isStreaming={isCurrentlyStreaming}
                    className="prose prose-sm max-w-none dark:prose-invert"
                  />
                ) : (
                  <div className="leading-relaxed text-sm whitespace-pre-wrap">{text}</div>
                )}
              </div>
            </div>
            <div className={cls("text-xs mt-1 text-right",
              role === "user" 
                ? "text-blue-300" 
                : "text-gray-500"
            )}>
              {formatMessageTime(timestamp)}
            </div>
          </div>
        </div>
      )}
      
      {/* 商品卡片行 */}
      {(product || (products && products.length > 0)) && (
        <div className={cls("flex", role === "user" ? "justify-end" : "justify-start")}>
          {role === "assistant" && (
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 self-start">
              <img 
                src="/girl.gif" 
                alt="AI助手" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-3" style={{ maxWidth: '75%' }}>
            {/* 单个商品 */}
            {product && (
              <div className="bg-white rounded-2xl p-4 shadow-sm relative group">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={product.image_url || product.image || "/girl.gif"}
                      alt={product.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight">
                        {product.name}
                      </h3>
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
                        {product.originalPrice && (
                          <div className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-medium">
                            省 {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 flex-1 min-w-0">
                          <span className="whitespace-nowrap">已售 {Number(product.reviews || 0) > 1000 ? `${(Number(product.reviews || 0) / 1000).toFixed(1)}K+` : `${product.reviews || 0}+`}</span>
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
                        <button
                          onClick={() => onAddToCart(product)}
                          className="bg-black text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                  {formatMessageTime(timestamp)}
                </div>
              </div>
            )}

            {/* 多个商品 */}
            {products && products.map((product, productIdx) => (
              <div key={productIdx} className="bg-white rounded-2xl p-4 shadow-sm relative group">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={product.image_url || product.image || "/girl.gif"}
                      alt={product.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight">
                        {product.name}
                      </h3>
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
                        {product.originalPrice && (
                          <div className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-medium">
                            省 {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 flex-1 min-w-0">
                          <span className="whitespace-nowrap">已售 {Number(product.reviews || 0) > 1000 ? `${(Number(product.reviews || 0) / 1000).toFixed(1)}K+` : `${product.reviews || 0}+`}</span>
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
                        <button
                          onClick={() => onAddToCart(product)}
                          className="bg-black text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                  {formatMessageTime(timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
