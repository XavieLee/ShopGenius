// Node.js 18+ 支持原生fetch，不需要导入
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const envConfig = require('../config/env');

/**
 * 字节跳动大模型HTTP服务
 * 基于字节跳动豆包大模型API实现
 */
class DouyinLLMService {
  constructor() {
    this.apiKey = envConfig.get('DOUYIN_API_KEY');
    this.model = envConfig.get('DOUYIN_MODEL', 'doubao-lite-4k');
    this.baseURL = envConfig.get('DOUYIN_BASE_URL', 'https://ark.cn-beijing.volces.com/api/v3/chat/completions');
    
    // 移除WebSocket相关配置，改为HTTP
    if (this.baseURL.startsWith('wss://')) {
      this.baseURL = this.baseURL.replace('wss://', 'https://');
    }
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.apiKey || this.apiKey === 'your_douyin_api_key_here') {
      throw new Error('字节跳动API Key未配置，请在配置文件中设置DOUYIN_API_KEY');
    }
    if (!this.baseURL) {
      throw new Error('字节跳动API URL未配置，请在配置文件中设置DOUYIN_BASE_URL');
    }
  }

  /**
   * 调用字节跳动大模型API (HTTP)
   */
  async chatCompletion(messages, options = {}) {
    try {
      this.validateConfig();

      const requestBody = {
        model: this.model,
        messages: messages,
        stream: false, // 使用非流式响应
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        top_p: options.top_p || 0.9,
        ...options
      };

      logger.info('调用字节跳动大模型API', { 
        model: this.model,
        messagesCount: messages.length,
        options: options
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: 30000 // 30秒超时
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('字节跳动API请求失败', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // 提取AI回复内容
      const aiContent = result.choices[0]?.message?.content || '抱歉，我暂时无法回答这个问题。';
      
      logger.info('字节跳动API响应成功', {
        model: result.model,
        usage: result.usage,
        content: aiContent,
        contentLength: aiContent.length
      });

      return {
        success: true,
        data: {
          content: result.choices[0]?.message?.content || '抱歉，我暂时无法回答这个问题。',
          usage: result.usage,
          model: result.model
        }
      };

    } catch (error) {
      logger.error('调用字节跳动API失败', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message || '调用大模型API失败'
      };
    }
  }

  /**
   * 流式对话
   */
  async streamChat(messages, options = {}) {
    try {
      this.validateConfig();
      
      const { temperature = 0.7, max_tokens = 1000, onChunk } = options;
      
      logger.info('开始流式对话', {
        messageCount: messages.length,
        temperature,
        max_tokens
      });

      const requestBody = {
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
        stream: true
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      logger.info('开始处理流式响应');

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            logger.info('流式响应读取完成');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          logger.info('收到原始数据块:', chunk);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              logger.info('处理数据行:', data);
              if (data === '[DONE]') {
                logger.info('收到结束标记');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                logger.info('解析后的数据:', parsed);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  logger.info('提取到内容:', content);
                  fullContent += content;
                  // 调用回调函数发送数据块
                  if (onChunk) {
                    onChunk(content);
                  }
                }
              } catch (parseError) {
                logger.warn('解析数据失败:', parseError.message, '数据:', data);
                // 忽略解析错误，继续处理下一行
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      logger.info('流式对话完成', {
        contentLength: fullContent.length,
        content: fullContent
      });

      return {
        success: true,
        data: {
          content: fullContent,
          model: this.model
        }
      };

    } catch (error) {
      logger.error('流式对话失败', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message || '流式对话失败'
      };
    }
  }

  /**
   * 健康检查
   */
  healthCheck() {
    try {
      this.validateConfig();
      return {
        status: 'healthy',
        model: this.model,
        hasApiKey: !!this.apiKey,
        baseURL: this.baseURL
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        hasApiKey: !!this.apiKey,
        baseURL: this.baseURL
      };
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      model: this.model,
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey
    };
  }
}

// 创建单例实例
const douyinLLMService = new DouyinLLMService();

module.exports = douyinLLMService;