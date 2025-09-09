const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * GET /api/ai/persona/init
 * 获取用户的AI导购风格和初始化问候语
 */
router.get('/init', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: '用户ID不能为空'
        }
      });
    }

    logger.info('AI导购风格初始化请求', { userId });
    
    const result = await aiService.getUserPersonaInit(userId);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('AI导购风格初始化失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_PERSONA_INIT_FAILED',
        message: '获取AI导购风格失败',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/ai/persona/switch
 * 切换用户的AI导购风格
 */
router.post('/switch', async (req, res) => {
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

    logger.info('AI导购风格切换请求', { userId, personaId });
    
    const result = await aiService.switchUserPersona(userId, personaId);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('AI导购风格切换失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_PERSONA_SWITCH_FAILED',
        message: '切换AI导购风格失败',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/ai/persona/list
 * 获取所有可用的AI导购风格
 */
router.get('/list', async (req, res) => {
  try {
    logger.info('获取AI导购风格列表请求');
    
    const { AIPersona } = require('../models');
    const personas = await AIPersona.findAll({
      where: { is_active: true },
      attributes: ['id', 'label', 'description'],
      order: [['created_at', 'ASC']]
    });
    
    res.json({
      success: true,
      data: personas
    });

  } catch (error) {
    logger.error('获取AI导购风格列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PERSONA_LIST_FAILED',
        message: '获取AI导购风格列表失败',
        details: error.message
      }
    });
  }
});

module.exports = router;
