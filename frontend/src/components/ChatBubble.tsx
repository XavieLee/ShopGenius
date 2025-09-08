import React, { useState, useEffect } from 'react';
import cls from 'classnames';

interface ChatBubbleProps {
  message: string;
  isAI?: boolean;
  isTyping?: boolean;
  onComplete?: () => void;
  delay?: number;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isAI = true, 
  isTyping = false, 
  onComplete,
  delay = 0 
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      if (isTyping) {
        let index = 0;
        const typeInterval = setInterval(() => {
          if (index < message.length) {
            setDisplayedMessage(message.slice(0, index + 1));
            index++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => onComplete?.(), 1000);
          }
        }, 50);
        
        return () => clearInterval(typeInterval);
      } else {
        setDisplayedMessage(message);
        setTimeout(() => onComplete?.(), 2000);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [message, isTyping, onComplete, delay]);

  if (!isVisible) return null;

  return (
    <div className={cls(
      "flex mb-4 animate-slide-in",
      isAI ? "justify-start" : "justify-end"
    )}>
      <div className={cls(
        "max-w-xs px-4 py-3 rounded-2xl shadow-lg",
        isAI 
          ? "bg-white border border-gray-200" 
          : "bg-blue-500 text-white"
      )}>
        <p className="text-sm">
          {displayedMessage}
          {isTyping && displayedMessage.length < message.length && (
            <span className="animate-pulse ml-1">|</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
