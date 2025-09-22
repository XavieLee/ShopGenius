const { v4: uuidv4 } = require('uuid');
const { 
  AIPersona, 
  UserPersonaPreference, 
  ChatSession, 
  ChatMessage, 
  MessageProduct,
  Product 
} = require('../models');
const logger = require('../utils/logger');

class AIService {
  /**
   * 获取用户的AI导购风格和初始化问候语
   */
  async getUserPersonaInit(userId) {
    try {
      logger.info('获取用户AI风格初始化', { userId });

      // 转换userId为整数
      const userIdInt = parseInt(userId, 10);

      // 查找用户的默认AI风格偏好
      let userPreference = await UserPersonaPreference.findOne({
        where: { 
          user_id: userIdInt,
          is_default: true 
        },
        include: [{
          model: AIPersona,
          as: 'persona'
        }]
      });

      // 如果没有默认偏好，使用friendly风格
      if (!userPreference) {
        const defaultPersona = await AIPersona.findOne({
          where: { id: 'friendly', is_active: true }
        });

        if (!defaultPersona) {
          throw new Error('AI助手风格不存在');
        }

        // 创建默认偏好
        userPreference = await UserPersonaPreference.create({
          user_id: userIdInt,
          persona_id: 'friendly',
          is_default: true
        });

        userPreference.persona = defaultPersona;
      }

      const result = {
        personaId: userPreference.persona.id,
        persona: {
          id: userPreference.persona.id,
          label: userPreference.persona.label,
          description: userPreference.persona.description,
          systemPrompt: userPreference.persona.system_prompt,
          greeting: userPreference.persona.greeting_template,
          isActive: userPreference.persona.is_active
        },
        greeting: userPreference.persona.greeting_template
      };

      logger.info('获取用户AI风格初始化成功', { userId, personaId: result.personaId });
      return result;

    } catch (error) {
      logger.error('获取用户AI风格初始化失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 切换用户的AI导购风格
   */
  async switchUserPersona(userId, personaId) {
    try {
      logger.info('切换用户AI风格', { userId, personaId });

      // 转换userId为整数
      const userIdInt = parseInt(userId, 10);

      // 验证AI风格是否存在
      const persona = await AIPersona.findOne({
        where: { 
          id: personaId,
          is_active: true 
        }
      });

      if (!persona) {
        throw new Error('AI导购风格不存在或已禁用');
      }

      // 更新用户的默认偏好
      await UserPersonaPreference.update(
        { is_default: false },
        { where: { user_id: userIdInt, is_default: true } }
      );

      // 创建或更新新的偏好
      const [userPreference, created] = await UserPersonaPreference.findOrCreate({
        where: { 
          user_id: userIdInt,
          persona_id: personaId 
        },
        defaults: {
          user_id: userIdInt,
          persona_id: personaId,
          is_default: true
        }
      });

      if (!created) {
        await userPreference.update({ is_default: true });
      }

      const result = {
        personaId: persona.id,
        persona: {
          id: persona.id,
          label: persona.label,
          description: persona.description
        },
        greeting: persona.greeting_template,
        message: `Switched to: ${persona.label}. ${this.getPersonaToneLine(persona.id)}`
      };

      logger.info('切换用户AI风格成功', { userId, personaId });
      return result;

    } catch (error) {
      logger.error('切换用户AI风格失败', { userId, personaId, error: error.message });
      throw error;
    }
  }

  /**
   * 创建新的聊天会话
   */
  async createChatSession(userId, personaId) {
    try {
      logger.info('创建聊天会话', { userId, personaId });

      // 转换userId为整数
      const userIdInt = parseInt(userId, 10);

      const session = await ChatSession.create({
        user_id: userIdInt,
        persona_id: personaId
      });

      logger.info('创建聊天会话成功', { userId, sessionId: session.id });
      return {
        sessionId: session.id,
        createdAt: session.created_at
      };

    } catch (error) {
      logger.error('创建聊天会话失败', { userId, personaId, error: error.message });
      throw error;
    }
  }

  /**
   * 保存聊天消息
   */
  async saveChatMessage(sessionId, role, content, personaId = null, products = []) {
    try {
      logger.info('保存聊天消息', { sessionId, role, content: content.substring(0, 50) });

      const message = await ChatMessage.create({
        session_id: sessionId,
        role,
        content,
        persona_id: personaId
      });

      // 保存关联的商品
      if (products && products.length > 0) {
        const messageProducts = products.map((product, index) => ({
          message_id: message.id,
          product_id: product.id,
          display_order: index
        }));

        await MessageProduct.bulkCreate(messageProducts);
      }

      // 消息保存完成，无需更新会话统计信息

      logger.info('保存聊天消息成功', { sessionId, messageId: message.id });
      return message;

    } catch (error) {
      logger.error('保存聊天消息失败', { sessionId, role, error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户的历史聊天记录
   */
  async getUserChatHistory(userId, sessionId = null, limit = 50, offset = 0) {
    try {
      logger.info('获取用户聊天历史', { userId, sessionId, limit, offset });

      // 转换userId为整数
      const userIdInt = parseInt(userId, 10);

      if (sessionId) {
        // 如果指定了sessionId，只获取该session的消息
        const messages = await ChatMessage.findAll({
          where: { session_id: sessionId },
          include: [{
            model: MessageProduct,
            as: 'products',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image_url', 'price']
            }]
          }],
          order: [['created_at', 'ASC']]
        });

        const result = {
          sessions: [{
            sessionId: parseInt(sessionId),
            createdAt: messages[0]?.created_at || new Date(),
            personaId: messages[0]?.persona_id || 'friendly'
          }],
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            sessionId: msg.session_id,
            personaId: msg.persona_id,
            products: msg.products?.map(mp => ({
              id: mp.product.id,
              name: mp.product.name,
              image: mp.product.image_url,
              image_url: mp.product.image_url,
              price: mp.product.price
            })) || []
          })),
          isHistorical: true
        };

        logger.info('获取指定会话聊天历史成功', { userId, sessionId, messageCount: messages.length });
        return result;
      }

      // 获取所有有消息的会话
      const messages = await ChatMessage.findAll({
        include: [{
          model: ChatSession,
          as: 'session',
          where: { user_id: userIdInt },
          attributes: ['id', 'created_at', 'persona_id']
        }, {
          model: MessageProduct,
          as: 'products',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'image_url', 'price']
          }]
        }],
        order: [['created_at', 'ASC']],
        limit: limit,
        offset: offset
      });

      // 获取所有相关的会话信息
      const sessionIds = [...new Set(messages.map(msg => msg.session_id))];
      const sessions = await ChatSession.findAll({
        where: { 
          id: sessionIds,
          user_id: userIdInt 
        },
        include: [{
          model: AIPersona,
          as: 'persona',
          attributes: ['id', 'label']
        }],
        order: [['created_at', 'ASC']]
      });

      const result = {
        sessions: sessions.map(session => ({
          sessionId: session.id,
          createdAt: session.created_at,
          personaId: session.persona_id
        })),
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          sessionId: msg.session_id,
          personaId: msg.persona_id,
          products: msg.products?.map(mp => ({
            id: mp.product.id,
            name: mp.product.name,
            image: mp.product.image_url,
            image_url: mp.product.image_url,
            price: mp.product.price
          })) || []
        })),
        isHistorical: true
      };

      logger.info('获取用户聊天历史成功', { userId, sessionCount: sessions.length, messageCount: messages.length });
      return result;

    } catch (error) {
      logger.error('获取用户聊天历史失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 根据关键词搜索商品
   */
  async searchProductsByKeywords(keywords) {
    try {
      logger.info('根据关键词搜索商品', { keywords });

      if (!keywords || keywords.length === 0) {
        return [];
      }

      // 构建搜索条件
      const searchConditions = keywords.map(keyword => ({
        [require('sequelize').Op.or]: [
          { name: { [require('sequelize').Op.like]: `%${keyword}%` } },
          { description: { [require('sequelize').Op.like]: `%${keyword}%` } },
          { category: { [require('sequelize').Op.like]: `%${keyword}%` } },
          { color: { [require('sequelize').Op.like]: `%${keyword}%` } }
        ]
      }));

      const products = await Product.findAll({
        where: {
          status: 'active',
          [require('sequelize').Op.or]: searchConditions
        },
        order: [['rating', 'DESC'], ['review_count', 'DESC']],
        limit: 6 // 限制返回6个商品
      });

      logger.info('根据关键词搜索商品成功', { keywords, productCount: products.length });
      return products;

    } catch (error) {
      logger.error('根据关键词搜索商品失败', { keywords, error: error.message });
      throw error;
    }
  }

  /**
   * 获取AI风格的语气描述
   */
  getPersonaToneLine(personaId) {
    const toneLines = {
      'friendly': 'Let\'s find something perfect for you!',
      'rational': 'Let\'s optimize for quality and value.',
      'luxury': 'Let\'s discover the finest options available.'
    };
    return toneLines[personaId] || 'Let\'s find what you need.';
  }
}

module.exports = new AIService();
