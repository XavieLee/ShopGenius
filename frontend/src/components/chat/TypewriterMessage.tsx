import React, { useState, useEffect, useRef } from 'react';
import cls from 'classnames';

interface TypewriterMessageProps {
  content: string;
  isStreaming: boolean;
  speed?: number; // 打字速度，毫秒
  onComplete?: () => void;
  className?: string;
}

/**
 * 支持打字机效果的消息组件（简化版）
 */
export function TypewriterMessage({
  content,
  isStreaming,
  speed = 20,
  onComplete,
  className
}: TypewriterMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 当内容变化时，更新显示
  useEffect(() => {
    if (!isStreaming) {
      // 流式结束，直接显示完整内容
      setDisplayedContent(content);
      setIsTyping(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onComplete?.();
      return;
    }

    // 流式进行中，直接显示当前内容（不需要打字机效果）
    setDisplayedContent(content);
    setIsTyping(true);
  }, [content, isStreaming, onComplete]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={cls('relative', className)}>
      <div>
        {displayedContent}
        {isTyping && (
          <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse">
            |
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 增强的聊天消息组件，支持打字机效果
 */
interface StreamingChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
  onComplete?: () => void;
}

export function StreamingChatMessage({
  role,
  content,
  isStreaming = false,
  timestamp,
  onComplete
}: StreamingChatMessageProps) {
  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cls("flex", role === "user" ? "justify-end" : "justify-start")}>
      {/* AI头像 */}
      {role === "assistant" && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 self-end">
          <img 
            src="/girl.gif" 
            alt="AI助手" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* 消息气泡 */}
      <div className="max-w-[85%] space-y-2">
        <div className={cls(
          "rounded-2xl px-4 py-2 relative group",
          role === "user" 
            ? "bg-white text-black" 
            : "bg-gray-800 text-white"
        )}>
          <div className="relative">
            <div className="pr-8">
              {role === "assistant" && isStreaming ? (
                <TypewriterMessage
                  content={content}
                  isStreaming={isStreaming}
                  speed={20}
                  onComplete={onComplete}
                />
              ) : (
                <div className="whitespace-pre-wrap">{content}</div>
              )}
            </div>
            
            {/* 时间戳 */}
            {timestamp && (
              <div className="absolute bottom-0 right-0 text-xs text-gray-400 opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                {formatMessageTime(timestamp)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
