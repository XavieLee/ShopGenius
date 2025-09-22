const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

// 加载环境配置（必须在其他模块之前）
const envConfig = require('./config/env');

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const aiPersonaRoutes = require('./routes/aiPersona');
const chatSessionRoutes = require('./routes/chatSession');
const douyinLLMRoutes = require('./routes/douyinLLM');
const chatWebSocketService = require('./services/chatWebSocketService');

const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());

// CORS配置 - 移除跨域限制，允许所有origin
app.use(cors({
  origin: true, // 允许所有origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求频率限制 - 已移除，允许无限制请求

// AI请求特殊限制 - 已移除，允许无限制请求

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use(requestLogger);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV 
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/persona', aiPersonaRoutes);
app.use('/api/ai/chat/session', chatSessionRoutes);
// 添加历史路由的别名
app.use('/api/ai/chat', chatSessionRoutes);
// 字节跳动大模型路由
app.use('/api/douyin-llm', douyinLLMRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 数据库连接和服务器启动
async function startServer() {
  try {
    // 测试数据库连接
    logger.info('正在连接数据库...');
    await sequelize.authenticate();
    logger.info('数据库连接成功');
    
    // 暂时跳过数据库模型同步，使用现有表结构
    logger.info('跳过数据库模型同步，使用现有表结构');
    
    // 初始化WebSocket服务
    chatWebSocketService.initialize(server);
    
    // 显示配置信息
    envConfig.displayConfig();
    
    // 启动服务器 - 绑定到所有网络接口
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`服务器运行在端口 ${PORT}`);
      logger.info(`健康检查: http://0.0.0.0:${PORT}/health`);
      logger.info(`API文档: http://0.0.0.0:${PORT}/api`);
      logger.info(`WebSocket服务已启动`);
      logger.info(`外部访问: http://YOUR_SERVER_IP:${PORT}`);
    });
    
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('接收到SIGTERM信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('接收到SIGINT信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
