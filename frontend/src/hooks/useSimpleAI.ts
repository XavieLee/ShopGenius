import { useState, useRef, useCallback, useEffect } from 'react';
import { aiAPI, AIPersona } from '../services/api';
import { douyinAPI, DouyinChatMessage } from '../services/douyinAPI';
import { ChatMsg } from '../types';

/**
 * 简化版AI Hook - MVP版本
 * 只使用字节跳动大模型，移除复杂降级策略
 */
export function useSimpleAI() {
  const [currentPersona, setCurrentPersona] = useState<AIPersona | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [showHistoryHint, setShowHistoryHint] = useState(false);
  const aiInitializedRef = useRef(false);
  const [hasNotifiedSearchInterest, setHasNotifiedSearchInterest] = useState(false);
  
  // 字节跳动相关状态
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const currentStreamCleanup = useRef<(() => void) | null>(null);

  /**
   * 获取最近5条对话记录作为上下文（简化版）
   */
  const getConversationContext = useCallback((limit: number = 5): DouyinChatMessage[] => {
    // 只获取最近5轮对话，减少上下文大小
    const recentMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .filter(msg => msg.text && msg.text.trim())
      .slice(-limit * 2) // 最近5轮对话
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.text || ''
      }));

    // 简化的系统提示词
    const systemPrompt = '你是ShopGenius的智能购物助手，请用中文回答用户关于商品的问题。';

    return [
      { role: 'system', content: systemPrompt },
      ...recentMessages
    ];
  }, [messages]);


  /**
   * 初始化AI导购（简化版）
   */
  const initializeAI = useCallback(async () => {
    try {
      console.log('初始化AI助手系统...');
      
      // 先尝试加载历史聊天记录
      try {
        const history = await aiAPI.getChatHistory("1", 50);
        console.log('历史记录API返回:', history);
        
        if (history && history.messages && history.messages.length > 0) {
          // 转换历史消息格式
          const historyMessages: ChatMsg[] = history.messages.map(msg => ({
            id: msg.id?.toString(),
            role: msg.role,
            text: msg.content,
            timestamp: msg.timestamp,
            persona: msg.personaId,
            products: msg.products || []
          }));
          
          console.log('转换后的历史消息:', historyMessages);
          setMessages(historyMessages);
          
          // 设置默认persona（从历史记录中获取或使用默认值）
          const defaultPersona: AIPersona = {
            id: "assistant",
            label: "智能购物助手",
            description: "专业的AI购物助手",
            systemPrompt: "你是ShopGenius的智能购物助手，请用中文回答用户关于商品的问题。",
            greeting: "你好！我是你的智能购物助手，有什么可以帮助你的吗？",
            isActive: true
          };
          setCurrentPersona(defaultPersona);
          setCurrentSessionId("1");
          
          console.log('加载历史聊天记录成功', { count: historyMessages.length });
          return; // 有历史记录，直接返回
        } else {
          console.log('没有历史记录或历史记录为空');
        }
      } catch (historyError) {
        console.warn('加载历史记录失败:', historyError);
      }
      
      // 没有历史记录，初始化用户AI风格偏好
      const initResult = await aiAPI.initPersona("1");
      if (!initResult) {
        throw new Error('初始化AI助手失败：返回结果为空');
      }
      setCurrentPersona(initResult.persona);
      setCurrentSessionId(initResult.personaId);
      
      // 显示欢迎消息
      setMessages([{
        role: "assistant",
        text: "你好！我是你的智能购物助手，有什么可以帮助你的吗？",
        persona: initResult.persona.id,
        timestamp: new Date().toISOString()
      }]);

      console.log('AI助手系统初始化完成');

    } catch (error) {
      console.error("初始化AI助手失败:", error);
      
      // 使用默认配置
      const defaultPersona: AIPersona = {
        id: "assistant",
        label: "智能购物助手",
        description: "专业的AI购物助手",
        systemPrompt: "你是ShopGenius的智能购物助手，请用中文回答用户关于商品的问题。",
        greeting: "你好！我是你的智能购物助手，有什么可以帮助你的吗？",
        isActive: true
      };
      
      setCurrentPersona(defaultPersona);
      
      // 显示欢迎消息
      setMessages([{
        role: "assistant",
        text: "你好！我是你的智能购物助手，有什么可以帮助你的吗？",
        persona: defaultPersona.id,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);


  /**
   * 发送消息（简化版）
   */
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // 取消当前的流式请求
    if (currentStreamCleanup.current) {
      currentStreamCleanup.current();
      currentStreamCleanup.current = null;
    }
    
    const userMessage: ChatMsg = {
      role: "user",
      text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setShowHistoryHint(false);

    // 调用后端大模型接口（流式）
    try {
      console.log('开始发送消息:', text);
      setTyping(true);
      
      // 获取对话上下文
      const context = getConversationContext(5);
      context.push({
        role: 'user',
        content: text
      });

      console.log('对话上下文:', context);

      // 创建AI消息占位符
      const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const assistantMessage: ChatMsg = {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        persona: currentPersona?.id,
        timestamp: new Date().toISOString()
      };
      
      // 先添加空消息到界面
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(true);
      setStreamingMessageId(assistantMessageId);

      console.log('开始调用流式API...');

      // 调用字节跳动大模型（流式）
      const result = await douyinAPI.streamChat({
        messages: context,
        sessionId: currentSessionId || undefined,
        temperature: 0.7,
        max_tokens: 1000
      }, (chunk: string) => {
        console.log('收到数据块:', chunk);
        // 收到第一个数据块时隐藏思考中提示
        setTyping(false);
        // 流式更新消息内容
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, text: msg.text + chunk }
            : msg
        ));
      }, (products: any[], message: string, searchQuery: string) => {
        console.log('收到商品推荐:', products);
        // 添加商品推荐消息
        const productMessage: ChatMsg = {
          id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          text: message,
          products: products,
          persona: currentPersona?.id,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, productMessage]);
      });

      // 流式完成，更新最终消息
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, text: result.content }
          : msg
      ));
      
      setIsStreaming(false);
      setStreamingMessageId(null);
      setTyping(false); // 确保重置typing状态
      
      console.log('流式消息完成并保存到数据库');
      
    } catch (error) {
      console.error('调用大模型API失败:', error);
      setTyping(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
      
      // 显示错误消息
      const errorMessage: ChatMsg = {
        role: "assistant",
        text: `抱歉，AI服务暂时不可用: ${error instanceof Error ? error.message : '未知错误'}`,
        persona: currentPersona?.id,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [currentPersona, currentSessionId, getConversationContext]);

  /**
   * 检查搜索兴趣并发送相关消息
   */
  const checkAndNotifySearchInterest = useCallback(() => {
    if (hasNotifiedSearchInterest) return;
    
    const lastSearchInterest = localStorage.getItem('lastSearchInterest');
    const lastSearchTime = localStorage.getItem('lastSearchTime');
    
    if (lastSearchInterest && lastSearchTime) {
      const searchTime = new Date(lastSearchTime);
      const now = new Date();
      const timeDiff = now.getTime() - searchTime.getTime();
      
      if (timeDiff < 5 * 60 * 1000) {
        setHasNotifiedSearchInterest(true);
        
        const message = `我注意到你刚才在搜索"${lastSearchInterest}"，有什么可以帮助你的吗？`;
        
        const interestMessage: ChatMsg = {
          role: "assistant",
          text: message,
          persona: currentPersona?.id,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, interestMessage]);
        setShowHistoryHint(false);
      }
    }
  }, [hasNotifiedSearchInterest, currentPersona]);

  /**
   * 重置搜索兴趣通知状态
   */
  const resetSearchInterestNotification = useCallback(() => {
    setHasNotifiedSearchInterest(false);
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (currentStreamCleanup.current) {
        currentStreamCleanup.current();
      }
    };
  }, []);

  return {
    // 状态
    currentPersona,
    currentSessionId,
    messages,
    typing,
    showHistoryHint,
    aiInitializedRef,
    isStreaming,
    streamingMessageId,

    // 方法
    initializeAI,
    handleSend,
    checkAndNotifySearchInterest,
    resetSearchInterestNotification,

    // 设置方法
    setMessages,
    setShowHistoryHint,
    setTyping
  };
}
