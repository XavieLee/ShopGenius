import React, { useState, useEffect } from 'react';
import cls from 'classnames';

interface AnimationGuideProps {
  onComplete?: () => void;
}

const AnimationGuide: React.FC<AnimationGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: '欢迎来到 ShopGenius',
      description: '我是你的AI购物助手',
      icon: '👋',
      color: 'from-blue-400 to-purple-500'
    },
    {
      title: '智能对话',
      description: '用自然语言告诉我你的需求',
      icon: '💬',
      color: 'from-green-400 to-blue-500'
    },
    {
      title: '个性化推荐',
      description: '基于你的喜好推荐商品',
      icon: '🎯',
      color: 'from-pink-400 to-red-500'
    },
    {
      title: '开始购物',
      description: '让我们开始你的购物之旅吧！',
      icon: '🛍️',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 2000);
          return prev;
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        {/* 进度指示器 */}
        <div className="flex justify-center mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cls(
                "w-3 h-3 rounded-full mx-1 transition-all duration-500",
                index <= currentStep 
                  ? "bg-blue-500 scale-125" 
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {/* 当前步骤内容 */}
        <div className="text-center">
          <div className={cls(
            "w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl bg-gradient-to-r",
            steps[currentStep].color,
            "animate-bounce"
          )}>
            {steps[currentStep].icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2 animate-fade-in">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-gray-600 animate-fade-in">
            {steps[currentStep].description}
          </p>
        </div>

        {/* 跳过按钮 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsVisible(false);
              onComplete?.();
            }}
            className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimationGuide;
