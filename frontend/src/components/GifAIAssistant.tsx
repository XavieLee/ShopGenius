import React, { useState, useEffect } from 'react';
import cls from 'classnames';

interface GifAIAssistantProps {
  persona: string;
  isTyping?: boolean;
  onStartChat?: () => void;
}

const GifAIAssistant: React.FC<GifAIAssistantProps> = ({ persona, isTyping = false, onStartChat }) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // 欢迎消息配置
  const welcomeMessages = {
    friendly: '你好！我是你的专属购物顾问，很高兴为你服务！',
    rational: '您好！我是专业的购物顾问，将为您提供最理性的购物建议。',
    luxury: '欢迎！我是您的专属购物顾问，为您精选最优质的商品。'
  };

  // 动画循环
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 欢迎消息打字效果
  useEffect(() => {
    const message = welcomeMessages[persona as keyof typeof welcomeMessages] || welcomeMessages.friendly;
    let index = 0;
    setWelcomeMessage('');
    
    const typeInterval = setInterval(() => {
      if (index < message.length) {
        setWelcomeMessage(message.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setShowWelcome(false), 3000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [persona]);

  // 获取助手GIF动图
  const getAssistantGif = () => {
    return '/girl.gif';
  };

  // 获取引导文本
  const getGuideText = () => {
    const guides = {
      friendly: [
        '告诉我你想要什么，我来帮你找！',
        '有什么购物需求尽管说～',
        '让我为你推荐最棒的商品！'
      ],
      rational: [
        '请描述你的具体需求',
        '我会为你分析最性价比的选择',
        '基于数据为你推荐最佳商品'
      ],
      luxury: [
        '告诉我你的品味偏好',
        '为你精选最优质的商品',
        '享受专属的购物体验'
      ]
    };
    
    const guideList = guides[persona as keyof typeof guides] || guides.friendly;
    return guideList[animationPhase % guideList.length];
  };


  return (
    <div className="text-center py-8">
      {/* AI助手形象 */}
      <div className="relative mb-6">
        <div className="relative w-48 h-48 mx-auto">
          {/* 背景光环 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 animate-pulse-glow"></div>
          
          {/* 助手头像 */}
          <div className="relative w-44 h-44 mx-auto mt-2 rounded-full overflow-hidden border-4 border-white shadow-2xl">
            <img
              src={getAssistantGif()}
              alt="AI购物助手"
              className="w-full h-full object-cover animate-float"
            />
            
            {/* 在线状态指示器 */}
            <div className="absolute bottom-3 right-3 w-8 h-8 bg-green-400 rounded-full border-3 border-white flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* 装饰性元素 */}
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-xl animate-bounce">
            ✨
          </div>
          <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-sm animate-bounce" style={{ animationDelay: '0.5s' }}>
            💖
          </div>
          <div className="absolute top-1/2 -left-4 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs animate-bounce" style={{ animationDelay: '1s' }}>
            💎
          </div>
        </div>
        
        {/* 打字指示器 */}
        {isTyping && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* 欢迎消息 */}
      {showWelcome && (
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mx-4 shadow-xl border border-pink-200">
            <p className="text-gray-800 text-lg font-medium">
              {welcomeMessage}
            </p>
          </div>
        </div>
      )}

      {/* 引导文本 */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm animate-fade-in">
          {getGuideText()}
        </p>
      </div>

      {/* 快速开始按钮 */}
      <div className="space-y-3">
        <button
          onClick={onStartChat}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-10 py-4 rounded-full font-medium shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center mx-auto animate-pulse-glow"
        >
          <span className="mr-2">💬</span>
          开始对话
        </button>
        
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            在线
          </span>
          <span>•</span>
          <span>24/7 服务</span>
          <span>•</span>
          <span>智能推荐</span>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mx-8 shadow-xl border border-pink-100">
          <p className="text-sm text-gray-600 text-center">
            💡 试试说："我想要一双运动鞋" 或 "推荐一些美妆产品"
          </p>
        </div>
      </div>
    </div>
  );
};

export default GifAIAssistant;
