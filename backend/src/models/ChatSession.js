const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatSession = sequelize.define('ChatSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '会话ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  persona_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'AI风格ID'
  }
}, {
  tableName: 'chat_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 聊天会话创建后不更新
  comment: '聊天会话表'
});

module.exports = ChatSession;
