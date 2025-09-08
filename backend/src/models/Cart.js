const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  selected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '游客会话ID'
  }
}, {
  tableName: 'cart_items',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['session_id']
    },
    {
      unique: true,
      fields: ['user_id', 'product_id']
    }
  ]
});

module.exports = Cart;

