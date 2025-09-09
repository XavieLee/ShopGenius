const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * POST /api/ai/chat/session/create
 * 创建新的聊天会话
 */
router.post('/create', async (req, res) => {
  try {
    const { userId, personaId } = req.body;
    
    if (!userId || !personaId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '用户ID和AI风格ID不能为空'
        }
      });
    }

    // 验证personaId
    const validPersonaIds = ['friendly', 'rational', 'luxury'];
    if (!validPersonaIds.includes(personaId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERSONA_ID',
          message: '无效的AI风格ID'
        }
      });
    }

    logger.info('创建聊天会话请求', { userId, personaId });
    
    const result = await aiService.createChatSession(userId, personaId);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('创建聊天会话失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_SESSION_FAILED',
        message: '创建聊天会话失败',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/ai/chat/history
 * 获取用户的历史聊天记录
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, sessionId, limit = 50, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: '用户ID不能为空'
        }
      });
    }

    logger.info('获取聊天历史请求', { userId, sessionId, limit, offset });
    
    const result = await aiService.getUserChatHistory(
      userId, 
      sessionId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('获取聊天历史失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHAT_HISTORY_FAILED',
        message: '获取聊天历史失败',
        details: error.message
      }
    });
  }
});

/**
 * PUT /api/ai/chat/session/:sessionId/title
 * 更新会话标题
 */
router.put('/:sessionId/title', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TITLE',
          message: '会话标题不能为空'
        }
      });
    }

    logger.info('更新会话标题请求', { sessionId, title });
    
    const { ChatSession } = require('../models');
    const session = await ChatSession.findByPk(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在'
        }
      });
    }

    await session.update({ title: title.trim() });
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        title: session.title
      }
    });

  } catch (error) {
    logger.error('更新会话标题失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_SESSION_TITLE_FAILED',
        message: '更新会话标题失败',
        details: error.message
      }
    });
  }
});

/**
 * DELETE /api/ai/chat/session/:sessionId
 * 删除会话
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    logger.info('删除会话请求', { sessionId });
    
    const { ChatSession } = require('../models');
    const session = await ChatSession.findByPk(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: '会话不存在'
        }
      });
    }

    await session.update({ status: 'deleted' });
    
    res.json({
      success: true,
      message: '会话删除成功'
    });

  } catch (error) {
    logger.error('删除会话失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_SESSION_FAILED',
        message: '删除会话失败',
        details: error.message
      }
    });
  }
});

module.exports = router;
