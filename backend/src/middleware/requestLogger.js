const logger = require('../utils/logger');

/**
 * 请求日志中间件
 * 记录所有API请求的详细信息
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // 记录请求信息
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: timestamp,
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined
  };

  // 过滤敏感信息
  if (requestInfo.body && requestInfo.body.password) {
    requestInfo.body = { ...requestInfo.body, password: '[HIDDEN]' };
  }

  logger.info(`📥 请求接收: ${req.method} ${req.originalUrl}`, {
    ip: requestInfo.ip,
    userAgent: requestInfo.userAgent,
    body: requestInfo.body,
    query: requestInfo.query,
    params: requestInfo.params
  });

  // 重写res.json方法来记录响应
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 记录响应信息
    const responseInfo = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(data).length,
      success: data && data.success !== undefined ? data.success : res.statusCode < 400
    };

    // 记录响应日志
    if (res.statusCode >= 400) {
      logger.error(`❌ 请求失败: ${req.method} ${req.originalUrl}`, {
        statusCode: responseInfo.statusCode,
        duration: responseInfo.duration,
        error: data && data.message ? data.message : 'Unknown error'
      });
    } else {
      logger.info(`📤 请求成功: ${req.method} ${req.originalUrl}`, {
        statusCode: responseInfo.statusCode,
        duration: responseInfo.duration,
        dataSize: `${responseInfo.dataSize} bytes`,
        success: responseInfo.success
      });
    }

    // 在开发环境下记录详细响应数据
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      logger.debug(`🐌 慢请求: ${req.method} ${req.originalUrl}`, {
        duration: responseInfo.duration,
        data: data
      });
    }

    // 调用原始的json方法
    return originalJson.call(this, data);
  };

  // 处理错误响应
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (res.statusCode >= 400) {
      logger.error(`❌ 请求失败: ${req.method} ${req.originalUrl}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        error: data
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

module.exports = requestLogger;
