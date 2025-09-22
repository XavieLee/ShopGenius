import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { ChatMsg, Product } from '../../types';
import { formatDateSeparator } from '../../utils';
import { EnhancedChatMessage } from './EnhancedChatMessage';
import { ChatInput } from '../ui';

interface ChatContainerProps {
  messages: ChatMsg[];
  typing: boolean;
  showHistoryHint: boolean;
  tab: string;
  onSend: (text: string) => void;
  onAddToCart: (product: Product) => void;
  justAddedId: string | null;
  onBack?: () => void;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
}

export function ChatContainer({ 
  messages, 
  typing, 
  showHistoryHint, 
  tab, 
  onSend, 
  onAddToCart, 
  justAddedId,
  onBack,
  isStreaming = false,
  streamingMessageId
}: ChatContainerProps) {
  const chatRef = useRef<HTMLDivElement | null>(null);

  // 检查是否需要显示日期分隔符
  const shouldShowDateSeparator = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    if (!currentMessage.timestamp || !previousMessage.timestamp) return false;
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // 自动滚动到底部
  const scrollToBottom = () => {
    // 只有在聊天页面激活时才滚动
    if (tab !== "assistant") {
      return;
    }
    
    if (chatRef.current) {
      const element = chatRef.current;
      // 强制滚动到底部
      element.scrollTop = element.scrollHeight;
    }
  };
  
  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 监听tab变化，当切换到聊天页面时滚动到底部
  useEffect(() => {
    if (tab === "assistant") {
      // 延迟一点时间确保DOM完全渲染
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [tab]);

  // Layout effect for immediate scrolling after DOM updates
  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Force scroll to bottom on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-black">
      {/* 返回按钮 */}
      {onBack && (
        <div className="px-4 py-3 border-b border-gray-800">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>返回</span>
          </button>
        </div>
      )}
      
      {/* 消息区域 - 可滚动 */}
      <div 
        ref={chatRef} 
        className="flex-1 overflow-auto p-4 space-y-4 bg-black" 
        style={{ 
          scrollBehavior: 'smooth'
        }}
      >
        {messages.map((m, idx) => (
          <div key={idx}>
            {/* 日期分隔符 */}
            {shouldShowDateSeparator(idx) && (
              <div className="flex justify-center my-4">
                <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                  {formatDateSeparator(m.timestamp)}
                </div>
              </div>
            )}
            
            {/* 消息内容 */}
            <EnhancedChatMessage 
              message={m} 
              onAddToCart={onAddToCart}
              justAddedId={justAddedId}
              isStreaming={isStreaming}
              streamingMessageId={streamingMessageId}
            />
          </div>
        ))}
        
        {/* 历史对话提示 - 只在初始加载历史消息时显示 */}
        {showHistoryHint && (
          <div className="text-center py-2">
            <div className="inline-flex items-center px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              以上是历史对话
            </div>
          </div>
        )}
        
        {typing && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 self-center">
              <img 
                src="/girl.gif" 
                alt="AI助手" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-gray-800 text-white rounded-2xl px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>AI正在思考中...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 输入框 - 固定在底部 */}
      <ChatInput onSend={onSend} />
    </div>
  );
}
