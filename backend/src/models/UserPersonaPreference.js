const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPersonaPreference = sequelize.define('UserPersonaPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为默认风格'
  }
}, {
  tableName: 'user_persona_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '用户AI风格偏好表',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'persona_id']
    }
  ]
});

module.exports = UserPersonaPreference;
