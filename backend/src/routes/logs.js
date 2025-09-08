const express = require('express');
const router = express.Router();
const LogViewer = require('../utils/logViewer');
const logger = require('../utils/logger');

const logViewer = new LogViewer();

// 获取最近的日志
router.get('/recent', (req, res) => {
  const { lines = 50 } = req.query;
  
  logger.info('📋 获取最近日志请求', { lines });
  
  const logs = logViewer.getRecentLogs(parseInt(lines));
  
  res.json({
    success: true,
    message: '获取日志成功',
    data: {
      logs,
      count: logs.length
    }
  });
});

// 过滤日志
router.get('/filter', (req, res) => {
  const { filter, lines = 100 } = req.query;
  
  if (!filter) {
    return res.status(400).json({
      success: false,
      message: '过滤关键词不能为空'
    });
  }
  
  logger.info('🔍 过滤日志请求', { filter, lines });
  
  const logs = logViewer.filterLogs(filter, parseInt(lines));
  
  res.json({
    success: true,
    message: '过滤日志成功',
    data: {
      logs,
      count: logs.length,
      filter
    }
  });
});

// 获取API统计信息
router.get('/stats', (req, res) => {
  logger.info('📊 获取API统计信息请求');
  
  const stats = logViewer.getApiStats();
  
  res.json({
    success: true,
    message: '获取统计信息成功',
    data: stats
  });
});

// 获取特定API的日志
router.get('/api/:endpoint', (req, res) => {
  const { endpoint } = req.params;
  const { lines = 50 } = req.query;
  
  logger.info('🔍 获取API日志请求', { endpoint, lines });
  
  const logs = logViewer.filterLogs(endpoint, parseInt(lines));
  
  res.json({
    success: true,
    message: '获取API日志成功',
    data: {
      logs,
      count: logs.length,
      endpoint
    }
  });
});

// 获取错误日志
router.get('/errors', (req, res) => {
  const { lines = 100 } = req.query;
  
  logger.info('❌ 获取错误日志请求', { lines });
  
  const logs = logViewer.filterLogs('❌', parseInt(lines));
  
  res.json({
    success: true,
    message: '获取错误日志成功',
    data: {
      logs,
      count: logs.length
    }
  });
});

// 获取成功请求日志
router.get('/success', (req, res) => {
  const { lines = 50 } = req.query;
  
  logger.info('✅ 获取成功请求日志', { lines });
  
  const logs = logViewer.filterLogs('✅', parseInt(lines));
  
  res.json({
    success: true,
    message: '获取成功请求日志成功',
    data: {
      logs,
      count: logs.length
    }
  });
});

module.exports = router;
