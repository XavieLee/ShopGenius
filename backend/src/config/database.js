const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const envConfig = require('./env');

// 获取数据库配置
const dbConfig = envConfig.getDatabaseConfig();

// 数据库配置
const sequelize = new Sequelize({
  ...dbConfig,
  logging: envConfig.get('NODE_ENV') === 'development' ? 
    (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = { sequelize };

