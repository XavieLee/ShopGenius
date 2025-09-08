const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  logger.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors
    });
  }

  // Sequelize 唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'unknown';
    return res.status(400).json({
      success: false,
      message: `${field} 已存在`
    });
  }

  // Sequelize 外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期'
    });
  }

  // 自定义业务错误
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message
  });
};

module.exports = errorHandler;

