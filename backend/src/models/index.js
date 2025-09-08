const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const { Order, OrderItem } = require('./Order');

// 定义模型关联关系

// User 和 Cart 的关联
User.hasMany(Cart, { foreignKey: 'user_id', as: 'cartItems' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product 和 Cart 的关联
Product.hasMany(Cart, { foreignKey: 'product_id', as: 'cartItems' });
Cart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User 和 Order 的关联
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order 和 OrderItem 的关联
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product 和 OrderItem 的关联
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  User,
  Product,
  Cart,
  Order,
  OrderItem
};

