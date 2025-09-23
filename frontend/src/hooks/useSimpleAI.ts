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
      // 先尝试加载历史聊天记录
      try {
        const history = await aiAPI.getChatHistory("1", 50);
        
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
          
          return; // 有历史记录，直接返回
        }
      } catch (historyError) {
        // 忽略历史记录加载失败，继续初始化
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
      setTyping(true);
      
      // 获取对话上下文
      const context = getConversationContext(5);
      context.push({
        role: 'user',
        content: text
      });

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

      // 调用字节跳动大模型（流式）
      const result = await douyinAPI.streamChat({
        messages: context,
        sessionId: currentSessionId || undefined,
        temperature: 0.7,
        max_tokens: 1000
      }, (chunk: string) => {
        // 收到第一个数据块时隐藏思考中提示
        setTyping(false);
        // 流式更新消息内容
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, text: msg.text + chunk }
            : msg
        ));
      }, (products: any[], message: string, searchQuery: string) => {
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
    const lastSearchInterest = localStorage.getItem('lastSearchInterest');
    const lastSearchTime = localStorage.getItem('lastSearchTime');
    const lastNotifiedSearch = localStorage.getItem('lastNotifiedSearch');
    
    // 如果没有搜索记录，直接返回
    if (!lastSearchInterest || !lastSearchTime) {
      return;
    }
    
    // 如果已经通知过这个搜索词，就不再通知
    if (lastNotifiedSearch === lastSearchInterest) {
      return;
    }
    
    const searchTime = new Date(lastSearchTime);
    const now = new Date();
    const timeDiff = now.getTime() - searchTime.getTime();
    
    // 只在5分钟内且没有通知过的情况下才发送
    if (timeDiff < 5 * 60 * 1000) {
      // 记录已通知的搜索词
      localStorage.setItem('lastNotifiedSearch', lastSearchInterest);
      
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
  }, [currentPersona]);

  /**
   * 重置搜索兴趣通知状态
   */
  const resetSearchInterestNotification = useCallback(() => {
    // 清除已通知的搜索记录，允许新的搜索词被通知
    localStorage.removeItem('lastNotifiedSearch');
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
