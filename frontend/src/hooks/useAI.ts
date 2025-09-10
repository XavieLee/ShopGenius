import { useState, useRef, useCallback } from 'react';
import { aiAPI, AIPersona } from '../services/api';
import { ChatMsg } from '../types';

export function useAI() {
  const [aiPersonas, setAiPersonas] = useState<AIPersona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<AIPersona | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { 
      role: "assistant", 
      text: "Hi, I'm your AI shopping assistant. Tell me what you're looking for!", 
      persona: "friendly",
      timestamp: new Date().toISOString()
    }
  ]);
  const [typing, setTyping] = useState(false);
  const [showHistoryHint, setShowHistoryHint] = useState(false);
  const aiInitializedRef = useRef(false);
  const [hasNotifiedSearchInterest, setHasNotifiedSearchInterest] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('disconnected');

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'typing') {
      setTyping(true);
    } else if (message.type === 'message') {
      setTyping(false);
      const newMessage: ChatMsg = {
        role: "assistant",
        text: message.content,
        persona: currentPersona?.id,
        timestamp: new Date().toISOString(),
        products: message.products || []
      };
      setMessages(prev => [...prev, newMessage]);
    } else if (message.type === 'products') {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          return [...prev.slice(0, -1), { ...lastMessage, products: message.products }];
        }
        return prev;
      });
    }
  }, [currentPersona]);

  // 初始化AI导购
  const initializeAI = useCallback(async () => {
    try {
      // 如果已经有连接，先关闭
      if (wsConnection) {
        wsConnection.disconnect();
        setWsConnection(null);
      }

      // 获取AI风格列表
      const personas = await aiAPI.getPersonas();
      setAiPersonas(personas);

      // 初始化用户AI风格
      const initResult = await aiAPI.initPersona("1");
      setCurrentPersona(initResult.persona);

      // 创建新的聊天会话
      const sessionResult = await aiAPI.createSession("1", initResult.personaId);
      setCurrentSessionId(sessionResult.sessionId);

      // 建立WebSocket连接
      setConnectionStatus('connecting');
      const ws = aiAPI.connectWebSocket("1", sessionResult.sessionId, initResult.personaId, (message: any) => {
        // 更新连接状态
        if (message.type === 'connected') {
          setConnectionStatus('connected');
        } else if (message.type === 'disconnected') {
          setConnectionStatus('disconnected');
        } else if (message.type === 'failed') {
          setConnectionStatus('failed');
        }
        // 处理其他消息
        handleWebSocketMessage(message);
      });
      setWsConnection(ws);

      // 如果有历史消息，显示历史消息；否则显示欢迎消息
      const history = await aiAPI.getChatHistory("1", 20);
      if (history.messages && history.messages.length > 0) {
        // 转换历史消息为ChatMsg格式
        const chatMessages: ChatMsg[] = history.messages.map(msg => ({
          role: msg.role,
          text: msg.content,
          persona: msg.personaId,
          timestamp: msg.timestamp,
          products: msg.products || []
        }));
        
        // 确保第一条消息是AI的欢迎消息
        const firstMessage = chatMessages[0];
        if (firstMessage && firstMessage.role === "user") {
          // 如果第一条消息是用户消息，在前面插入AI欢迎消息
          const welcomeMessage: ChatMsg = {
            role: "assistant",
            text: initResult.greeting,
            persona: initResult.personaId,
            timestamp: new Date(Date.now() - 1000).toISOString()
          };
          chatMessages.unshift(welcomeMessage);
        }
        
        setMessages(chatMessages);
        setShowHistoryHint(true);
      } else {
        // 没有历史消息时显示欢迎消息
        setMessages([{
          role: "assistant",
          text: initResult.greeting,
          persona: initResult.personaId,
          timestamp: new Date().toISOString()
        }]);
      }

    } catch (error) {
      console.error("初始化AI导购失败:", error);
    }
  }, [wsConnection, handleWebSocketMessage]);

  // 切换AI风格
  const handlePersonaSwitch = useCallback(async (newPersonaId: string) => {
    try {
      const result = await aiAPI.switchPersona("1", newPersonaId);
      setCurrentPersona(result.persona);
      
      // 添加切换提示消息
      const switchMessage: ChatMsg = {
        role: "assistant",
        text: result.greeting,
        persona: newPersonaId,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, switchMessage]);
      setShowHistoryHint(false);
      
    } catch (error) {
      console.error("切换AI风格失败:", error);
    }
  }, []);

  // 发送消息
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: ChatMsg = {
      role: "user",
      text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTyping(true);
    setShowHistoryHint(false);

    // 通过WebSocket发送消息
    if (wsConnection && wsConnection.connected) {
      aiAPI.sendMessage(wsConnection, text);
    } else {
      // 如果WebSocket连接不可用，使用HTTP API作为备用
      try {
        const response = await aiAPI.chat(text, {}, currentPersona?.id || "friendly");
        setTyping(false);
        const assistantMessage: ChatMsg = {
          role: "assistant",
          text: response.reply,
          persona: currentPersona?.id,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error("发送消息失败:", error);
        setTyping(false);
      }
    }
  }, [wsConnection, currentPersona]);

  // 检查搜索兴趣并发送相关消息
  const checkAndNotifySearchInterest = useCallback(() => {
    if (hasNotifiedSearchInterest) return;
    
    const lastSearchInterest = localStorage.getItem('lastSearchInterest');
    const lastSearchTime = localStorage.getItem('lastSearchTime');
    
    if (lastSearchInterest && lastSearchTime) {
      const searchTime = new Date(lastSearchTime);
      const now = new Date();
      const timeDiff = now.getTime() - searchTime.getTime();
      
      // 如果搜索时间在5分钟内，且还没有通知过
      if (timeDiff < 5 * 60 * 1000) {
        setHasNotifiedSearchInterest(true);
        
        // 根据AI风格生成不同的消息
        const personaMessages = {
          friendly: `我注意到你刚才在搜索"${lastSearchInterest}"，看起来你对这个很感兴趣呢！我可以为你推荐一些相关的商品，或者你有什么具体的问题吗？`,
          rational: `根据你的搜索记录，我发现你对"${lastSearchInterest}"比较关注。让我为你分析一下相关的商品选择，帮你找到最合适的产品。`,
          luxury: `我注意到你正在寻找"${lastSearchInterest}"相关的商品。让我为你精选一些高品质的选择，确保你获得最佳的购物体验。`
        };
        
        const message = personaMessages[currentPersona?.id as keyof typeof personaMessages] || personaMessages.friendly;
        
        // 添加AI消息到聊天记录，并隐藏历史提示
        const interestMessage: ChatMsg = {
          role: "assistant",
          text: message,
          persona: currentPersona?.id,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, interestMessage]);
        setShowHistoryHint(false); // 隐藏历史提示，因为现在有新消息了
        
        // 清除搜索兴趣记录，避免重复通知
        localStorage.removeItem('lastSearchInterest');
        localStorage.removeItem('lastSearchTime');
      }
    }
  }, [hasNotifiedSearchInterest, currentPersona]);

  // 重置搜索兴趣通知状态（当切换tab时）
  const resetSearchInterestNotification = useCallback(() => {
    setHasNotifiedSearchInterest(false);
  }, []);

  return {
    aiPersonas,
    currentPersona,
    currentSessionId,
    wsConnection,
    messages,
    typing,
    showHistoryHint,
    connectionStatus,
    aiInitializedRef,
    initializeAI,
    handlePersonaSwitch,
    handleSend,
    setMessages,
    setShowHistoryHint,
    checkAndNotifySearchInterest,
    resetSearchInterestNotification
  };
}
