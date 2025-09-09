const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const aiService = require('./aiService');
const logger = require('../utils/logger');

class ChatWebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // 存储用户连接信息
  }

  /**
   * 初始化WebSocket服务
   */
  initialize(server) {
    // WebSocket CORS配置 - 移除跨域限制
    this.io = new Server(server, {
      cors: {
        origin: "*", // 允许所有origin
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      logger.info('WebSocket连接建立', { socketId: socket.id });

      // 用户加入聊天
      socket.on('join_chat', async (data) => {
        try {
          const { userId, personaId, sessionId } = data;
          
          if (!userId || !personaId) {
            socket.emit('error', {
              code: 'MISSING_PARAMETERS',
              message: '用户ID和AI风格ID不能为空'
            });
            return;
          }

          // 存储用户连接信息
          this.connectedUsers.set(socket.id, {
            userId,
            personaId,
            sessionId: sessionId || null
          });

          // 加入用户房间
          socket.join(`user_${userId}`);

          logger.info('用户加入聊天', { socketId: socket.id, userId, personaId, sessionId });

          // 发送连接成功消息
          socket.emit('connected', {
            message: '连接成功',
            userId,
            personaId,
            sessionId
          });

        } catch (error) {
          logger.error('用户加入聊天失败', { socketId: socket.id, error: error.message });
          socket.emit('error', {
            code: 'JOIN_CHAT_FAILED',
            message: '加入聊天失败',
            details: error.message
          });
        }
      });

      // 处理用户消息
      socket.on('user_message', async (data) => {
        try {
          const { content, timestamp } = data;
          const userInfo = this.connectedUsers.get(socket.id);

          if (!userInfo) {
            socket.emit('error', {
              code: 'USER_NOT_CONNECTED',
              message: '用户未连接'
            });
            return;
          }

          const { userId, personaId, sessionId } = userInfo;

          logger.info('收到用户消息', { 
            socketId: socket.id, 
            userId, 
            content: content.substring(0, 50) 
          });

          // 保存用户消息
          let currentSessionId = sessionId;
          if (!currentSessionId) {
            // 创建新会话
            const newSession = await aiService.createChatSession(userId, personaId);
            currentSessionId = newSession.sessionId;
            this.connectedUsers.set(socket.id, { ...userInfo, sessionId: currentSessionId });
          }

          await aiService.saveChatMessage(
            currentSessionId, 
            'user', 
            content, 
            null, 
            null
          );

          // 发送确认消息
          socket.emit('message_received', {
            messageId: uuidv4(),
            content,
            timestamp: timestamp || new Date().toISOString()
          });

          // 模拟AI处理延迟
          setTimeout(async () => {
            try {
              // 生成AI回复
              const aiResponse = await this.generateAIResponse(content, personaId);
              
              // 提取关键词并搜索商品
              const keywords = this.extractKeywords(content);
              const products = await aiService.searchProductsByKeywords(keywords);

              // 保存AI消息
              await aiService.saveChatMessage(
                currentSessionId,
                'assistant',
                aiResponse.message,
                personaId,
                products
              );

              // 发送AI回复
              socket.emit('ai_response', {
                type: 'response',
                data: {
                  message: aiResponse.message,
                  keywords,
                  products: products.map(product => ({
                    id: product.id,
                    name: product.name,
                    image: product.image_url,
                    price: product.price,
                    category: product.category,
                    color: product.color,
                    description: product.description,
                    rating: product.rating,
                    reviews: product.review_count
                  })),
                  timestamp: new Date().toISOString()
                }
              });

            } catch (error) {
              logger.error('AI回复生成失败', { 
                socketId: socket.id, 
                userId, 
                error: error.message 
              });
              
              socket.emit('error', {
                code: 'AI_RESPONSE_FAILED',
                message: 'AI回复生成失败',
                details: error.message
              });
            }
          }, 1000 + Math.random() * 2000); // 1-3秒随机延迟

        } catch (error) {
          logger.error('处理用户消息失败', { socketId: socket.id, error: error.message });
          socket.emit('error', {
            code: 'MESSAGE_PROCESSING_FAILED',
            message: '消息处理失败',
            details: error.message
          });
        }
      });

      // 用户断开连接
      socket.on('disconnect', () => {
        const userInfo = this.connectedUsers.get(socket.id);
        if (userInfo) {
          logger.info('用户断开连接', { 
            socketId: socket.id, 
            userId: userInfo.userId 
          });
          this.connectedUsers.delete(socket.id);
        }
      });
    });

    logger.info('WebSocket服务初始化完成');
  }

  /**
   * 生成AI回复
   */
  async generateAIResponse(userMessage, personaId) {
    // 这里应该调用真实的AI服务（如OpenAI、百度文心等）
    // 目前使用模拟回复
    const responses = {
      'friendly': [
        '我为你推荐几款很棒的商品！',
        '让我帮你找到最合适的商品！',
        '这些商品都很不错，你可以看看！',
        '我精心为你挑选了这些商品！'
      ],
      'rational': [
        '基于你的需求，我分析了以下商品的性价比：',
        '让我为你分析最优质的商品选择：',
        '从实用性和价值角度，我推荐这些商品：',
        '经过理性分析，这些商品最适合你：'
      ],
      'luxury': [
        '我为你精选了这些高端商品：',
        '这些都是品质卓越的奢华选择：',
        '让我为你推荐最精致的高端商品：',
        '这些商品体现了最高的品质标准：'
      ]
    };

    const personaResponses = responses[personaId] || responses['friendly'];
    const randomResponse = personaResponses[Math.floor(Math.random() * personaResponses.length)];

    return {
      message: randomResponse
    };
  }

  /**
   * 从用户消息中提取关键词
   */
  extractKeywords(userMessage) {
    // 简单的关键词提取逻辑
    // 实际项目中应该使用更复杂的NLP技术
    const keywords = [];
    
    // 颜色关键词
    const colors = ['红色', '蓝色', '绿色', '黑色', '白色', '黄色', '紫色', '粉色', '灰色', '棕色'];
    colors.forEach(color => {
      if (userMessage.includes(color)) {
        keywords.push(color);
      }
    });

    // 商品类别关键词
    const categories = ['运动鞋', '鞋子', '衣服', '裤子', '衬衫', '外套', '包包', '手表', '手机', '电脑'];
    categories.forEach(category => {
      if (userMessage.includes(category)) {
        keywords.push(category);
      }
    });

    // 价格关键词
    if (userMessage.includes('便宜') || userMessage.includes('低价')) {
      keywords.push('性价比');
    }
    if (userMessage.includes('贵') || userMessage.includes('高端') || userMessage.includes('奢华')) {
      keywords.push('高端');
    }

    // 如果没有提取到关键词，使用默认关键词
    if (keywords.length === 0) {
      keywords.push('推荐商品');
    }

    return keywords;
  }

  /**
   * 获取连接的用户数量
   */
  getConnectedUserCount() {
    return this.connectedUsers.size;
  }

  /**
   * 向特定用户发送消息
   */
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }
}

module.exports = new ChatWebSocketService();
