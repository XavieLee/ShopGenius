const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIPersona = sequelize.define('AIPersona', {
  id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    comment: '风格ID'
  },
  label: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '风格标签'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '风格描述'
  },
  system_prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '系统提示词'
  },
  greeting_template: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '问候语模板'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  }
}, {
  tableName: 'ai_personas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'AI导购风格表'
});

module.exports = AIPersona;
