const express = require('express');
const router = express.Router();
const douyinLLMService = require('../services/douyinLLMService');
const aiService = require('../services/aiService');
const productRecommendationService = require('../services/productRecommendationService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * 字节跳动大模型API路由
 */

/**
 * 健康检查
 * GET /api/douyin-llm/health
 */
router.get('/health', (req, res) => {
  try {
    const health = douyinLLMService.healthCheck();
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('字节跳动大模型健康检查失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 简单聊天接口
 * POST /api/douyin-llm/chat
 * 
 * 支持HTTP请求的简单对话
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, messages, sessionId, temperature, max_tokens } = req.body;

    if (!message && !messages) {
      return res.status(400).json({
        success: false,
        error: '缺少message或messages参数'
      });
    }

    // 构建消息数组
    let chatMessages = [];
    if (messages && Array.isArray(messages)) {
      chatMessages = messages;
    } else if (message) {
      chatMessages = [{ role: 'user', content: message }];
    }

    // 调用字节跳动大模型
    const result = await douyinLLMService.chatCompletion(chatMessages, {
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      sessionId: sessionId
    });

    if (result.success) {
      const finalSessionId = sessionId || uuidv4();
      
      // 保存用户消息和AI回复到数据库
      try {
        // 获取最后一条用户消息
        const lastUserMessage = chatMessages.filter(msg => msg.role === 'user').pop();
        if (lastUserMessage) {
          await aiService.saveChatMessage(finalSessionId, 'user', lastUserMessage.content, 'friendly');
        }
        
        // 保存AI回复
        await aiService.saveChatMessage(finalSessionId, 'assistant', result.data.content, 'friendly');
        
        logger.info('消息已保存到数据库', {
          sessionId: finalSessionId,
          userMessage: lastUserMessage?.content,
          aiMessage: result.data.content
        });
      } catch (saveError) {
        logger.error('保存消息到数据库失败', { error: saveError.message });
        // 不中断响应，继续返回结果
      }
      
      const responseData = {
        success: true,
        data: {
          content: result.data.content,
          usage: result.data.usage,
          model: result.data.model,
          sessionId: finalSessionId
        },
        timestamp: new Date().toISOString()
      };
      
      // 记录返回的AI内容
      logger.info('字节跳动大模型聊天接口返回', {
        sessionId: finalSessionId,
        content: result.data.content,
        contentLength: result.data.content.length,
        usage: result.data.usage,
        model: result.data.model
      });
      
      res.json(responseData);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('聊天接口错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 流式对话接口
 * POST /api/douyin-llm/chat/stream
 * 
 * 支持Server-Sent Events (SSE) 的流式响应
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, messages, sessionId, temperature, max_tokens } = req.body;

    if (!message && !messages) {
      return res.status(400).json({
        success: false,
        error: '缺少message或messages参数'
      });
    }

    // 构建消息数组
    let chatMessages = [];
    if (messages && Array.isArray(messages)) {
      chatMessages = messages;
    } else if (message) {
      chatMessages = [{ role: 'user', content: message }];
    }

    const finalSessionId = sessionId || uuidv4();

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 发送开始事件
    res.write(`data: ${JSON.stringify({
      type: 'start',
      sessionId: finalSessionId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 保存用户消息到数据库
    try {
      const lastUserMessage = chatMessages.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage) {
        await aiService.saveChatMessage(finalSessionId, 'user', lastUserMessage.content, 'friendly');
      }
    } catch (saveError) {
      logger.error('保存用户消息失败', { error: saveError.message });
    }

    // 调用字节跳动大模型（流式）
    logger.info('开始调用流式大模型', { messageCount: chatMessages.length });
    const result = await douyinLLMService.streamChat(chatMessages, {
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      sessionId: finalSessionId,
      onChunk: (chunk) => {
        logger.info('发送数据块到前端:', chunk);
        // 发送流式数据块
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk,
          sessionId: finalSessionId,
          timestamp: new Date().toISOString()
        })}\n\n`);
      }
    });

    if (result.success) {
      // 发送完成事件
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        content: result.data.content,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 保存AI回复到数据库
      try {
        await aiService.saveChatMessage(finalSessionId, 'assistant', result.data.content, 'friendly');
        logger.info('AI回复已保存到数据库', {
          sessionId: finalSessionId,
          content: result.data.content
        });
      } catch (saveError) {
        logger.error('保存AI回复失败', { error: saveError.message });
      }

      // 检查是否需要商品推荐
      try {
        const lastUserMessage = chatMessages.filter(msg => msg.role === 'user').pop();
        if (lastUserMessage && productRecommendationService.shouldRecommendProducts(lastUserMessage.content)) {
          logger.info('检测到商品推荐需求，开始生成推荐', { 
            userMessage: lastUserMessage.content 
          });
          
          const recommendations = await productRecommendationService.generateRecommendations(
            lastUserMessage.content
          );
          
          if (recommendations.hasRecommendations && recommendations.products.length > 0) {
            // 保存商品推荐消息到数据库
            try {
              await aiService.saveChatMessage(
                finalSessionId, 
                'assistant', 
                recommendations.message, 
                'friendly',
                recommendations.products // 传递商品数据
              );
              logger.info('商品推荐消息已保存到数据库', {
                sessionId: finalSessionId,
                productCount: recommendations.products.length
              });
            } catch (saveError) {
              logger.error('保存商品推荐消息失败', { error: saveError.message });
            }

            // 发送商品推荐事件
            res.write(`data: ${JSON.stringify({
              type: 'products',
              products: recommendations.products,
              message: recommendations.message,
              searchQuery: recommendations.searchQuery,
              sessionId: finalSessionId,
              timestamp: new Date().toISOString()
            })}\n\n`);
            
            logger.info('商品推荐已发送', { 
              sessionId: finalSessionId,
              productCount: recommendations.products.length
            });
          }
        }
      } catch (recommendationError) {
        logger.error('生成商品推荐失败', { error: recommendationError.message });
        // 不中断主流程，继续执行
      }
    } else {
      // 发送错误事件
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: result.error,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString()
      })}\n\n`);
    }

    // 结束流
    res.write(`data: ${JSON.stringify({
      type: 'end',
      sessionId: finalSessionId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    res.end();

  } catch (error) {
    logger.error('流式聊天接口错误', { error: error.message });
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;