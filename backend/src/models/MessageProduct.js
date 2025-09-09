const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MessageProduct = sequelize.define('MessageProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '消息ID'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '显示顺序'
  }
}, {
  tableName: 'message_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '消息商品关联表',
  indexes: [
    {
      unique: true,
      fields: ['message_id', 'product_id']
    }
  ]
});

module.exports = MessageProduct;
