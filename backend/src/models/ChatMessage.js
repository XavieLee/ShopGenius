const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '消息ID'
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '会话ID'
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false,
    comment: '消息角色'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  persona_id: {
    type: DataTypes.STRING(20),
    comment: 'AI风格ID（仅assistant消息）'
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 消息创建后不更新
  comment: '聊天消息表'
});

module.exports = ChatMessage;
