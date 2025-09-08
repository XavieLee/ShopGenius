import React, { useState, useEffect } from 'react';
import cls from 'classnames';
import GifAIAssistant from './GifAIAssistant';
import AnimationGuide from './AnimationGuide';
import ChatBubble from './ChatBubble';

interface HomePageProps {
  onStartChat: () => void;
  onSwitchToShop: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartChat, onSwitchToShop }) => {
  const [persona, setPersona] = useState('friendly');
  const [showGuide, setShowGuide] = useState(false);
  const [showWelcomeChat, setShowWelcomeChat] = useState(false);
  const [currentChatIndex, setCurrentChatIndex] = useState(0);

  const welcomeChats = [
    {
      message: "你好！我是你的AI购物助手，很高兴为你服务！",
      isAI: true,
      delay: 1000
    },
    {
      message: "我可以帮你找到最合适的商品，回答购物问题，甚至推荐搭配！",
      isAI: true,
      delay: 3000
    },
    {
      message: "你想要什么类型的商品呢？",
      isAI: true,
      delay: 5000
    }
  ];

  const quickActions = [
    { icon: '👟', text: '运动鞋', action: () => onStartChat() },
    { icon: '💄', text: '美妆', action: () => onStartChat() },
    { icon: '👕', text: '服装', action: () => onStartChat() },
    { icon: '📱', text: '数码', action: () => onStartChat() },
    { icon: '👜', text: '包包', action: () => onStartChat() },
    { icon: '⌚', text: '配饰', action: () => onStartChat() }
  ];

  useEffect(() => {
    if (!showGuide) {
      setTimeout(() => setShowWelcomeChat(true), 500);
    }
  }, [showGuide]);

  const handleChatComplete = () => {
    if (currentChatIndex < welcomeChats.length - 1) {
      setCurrentChatIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* 引导动画 */}
      {showGuide && (
        <AnimationGuide onComplete={() => setShowGuide(false)} />
      )}

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ShopGenius
          </h1>
          <p className="text-gray-600">AI驱动的智能购物体验</p>
        </div>

        {/* AI助手和欢迎 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-white/20">
          <GifAIAssistant 
            persona={persona} 
            onStartChat={onStartChat}
          />
        </div>

        {/* 欢迎对话 */}
        {showWelcomeChat && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-xl border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              💬 欢迎对话
            </h3>
            <div className="space-y-2">
              {welcomeChats.slice(0, currentChatIndex + 1).map((chat, index) => (
                <ChatBubble
                  key={index}
                  message={chat.message}
                  isAI={chat.isAI}
                  isTyping={index === currentChatIndex}
                  onComplete={index === currentChatIndex ? handleChatComplete : undefined}
                  delay={chat.delay}
                />
              ))}
            </div>
          </div>
        )}

        {/* 快速操作 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-xl border border-white/20">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            🚀 快速开始
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-gray-100"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {action.icon}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {action.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 功能特色 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="font-semibold text-gray-800 mb-2">AI智能对话</h4>
            <p className="text-sm text-gray-600">自然语言交互，理解你的购物需求</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h4 className="font-semibold text-gray-800 mb-2">精准推荐</h4>
            <p className="text-sm text-gray-600">基于偏好和预算推荐最合适的商品</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center">
            <div className="text-4xl mb-3">🛒</div>
            <h4 className="font-semibold text-gray-800 mb-2">便捷购物</h4>
            <p className="text-sm text-gray-600">一站式购物体验，从咨询到下单</p>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onStartChat}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
          >
            <span className="mr-2">💬</span>
            开始AI对话
          </button>
          
          <button
            onClick={onSwitchToShop}
            className="bg-white text-gray-700 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200 flex items-center justify-center"
          >
            <span className="mr-2">🛍️</span>
            浏览商品
          </button>
        </div>
      </div>

      {/* 浮动装饰 */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20 animate-float"></div>
      <div className="fixed top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full opacity-20 animate-float-delayed"></div>
      <div className="fixed bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-float-slow"></div>
    </div>
  );
};

export default HomePage;
