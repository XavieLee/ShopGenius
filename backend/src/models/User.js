const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    comment: '邮箱'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    comment: '密码哈希'
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    comment: '头像URL'
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: '手机号'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '用户状态'
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 实例方法：获取用户信息（不包含密码）
User.prototype.toJSON = function() {
  const user = Object.assign({}, this.get());
  delete user.password;
  return user;
};

module.exports = User;

