/**
 * 字节跳动大模型API服务
 */

import { useState, useCallback } from 'react';

// 自动检测API基础URL
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const currentHost = window.location.hostname;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001/api';
  } else {
    return `http://${currentHost}:3001/api`;
  }
};

const API_BASE = `${getApiBaseUrl()}/douyin-llm`;

export interface DouyinChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DouyinStreamResponse {
  type: 'connection_ready' | 'content_delta' | 'message_complete' | 'stream_end' | 'error';
  content?: string;
  connectionId?: string;
  sessionId?: string;
  finish_reason?: string;
  error?: string;
  timestamp: string;
}

export interface DouyinChatOptions {
  messages?: DouyinChatMessage[];
  message?: string;
  system_message?: string;
  sessionId?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * 字节跳动大模型API客户端
 */
export class DouyinAPI {
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; hasApiKey: boolean; activeConnections: number }> {
    const response = await fetch(`${API_BASE}/health`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '健康检查失败');
    }
    
    return result.data;
  }

  /**
   * 简单对话 (HTTP请求)
   */
  async chat(options: DouyinChatOptions): Promise<{content: string; usage?: any; model?: string}> {
    const requestBody = {
      ...options,
      sessionId: options.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '请求失败');
    }

    return {
      content: result.data.content,
      usage: result.data.usage,
      model: result.data.model
    };
  }

  /**
   * 流式对话 (Server-Sent Events)
   */
  async streamChat(
    options: DouyinChatOptions, 
    onChunk: (chunk: string) => void,
    onProducts?: (products: any[], message: string, searchQuery: string) => void
  ): Promise<{content: string; model?: string}> {
    const requestBody = {
      ...options,
      sessionId: options.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk') {
                fullContent += parsed.content;
                onChunk(parsed.content);
              } else if (parsed.type === 'complete') {
                fullContent = parsed.content;
              } else if (parsed.type === 'products') {
                // 处理商品推荐事件
                if (onProducts && parsed.products) {
                  onProducts(parsed.products, parsed.message, parsed.searchQuery);
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              } else if (parsed.type === 'end') {
                break;
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理下一行
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      model: 'doubao'
    };
  }

  /**
   * 简单对话 (非流式，返回字符串)
   */
  async chatSimple(options: DouyinChatOptions): Promise<string> {
    const result = await this.chat(options);
    return result.content;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ activeConnections: number }> {
    const response = await fetch(`${API_BASE}/stats`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '获取统计信息失败');
    }
    
    return result.data;
  }
}

// 创建全局实例
export const douyinAPI = new DouyinAPI();

/**
 * React Hook: 使用字节跳动大模型
 */
export function useDouyinChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentCleanup, setCurrentCleanup] = useState<(() => void) | null>(null);

  const sendMessage = useCallback(async (
    options: DouyinChatOptions,
    onProgress?: (content: string) => void
  ) => {
    // 取消之前的请求
    if (currentCleanup) {
      currentCleanup();
    }

    setIsLoading(true);
    setContent('');
    setError(null);

    try {
      // 使用HTTP API而不是流式API
      const result = await douyinAPI.chat(options);
      
      setContent(result.content);
      onProgress?.(result.content);
      setIsLoading(false);
      setCurrentCleanup(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送消息失败');
      setIsLoading(false);
      setCurrentCleanup(null);
    }
  }, [currentCleanup]);

  const cancelRequest = useCallback(() => {
    if (currentCleanup) {
      currentCleanup();
      setCurrentCleanup(null);
      setIsLoading(false);
    }
  }, [currentCleanup]);

  return {
    sendMessage,
    cancelRequest,
    content,
    isLoading,
    error,
    hasActiveRequest: !!currentCleanup
  };
}
