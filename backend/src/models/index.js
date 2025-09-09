const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const { Order, OrderItem } = require('./Order');
const AIPersona = require('./AIPersona');
const UserPersonaPreference = require('./UserPersonaPreference');
const ChatSession = require('./ChatSession');
const ChatMessage = require('./ChatMessage');
const MessageProduct = require('./MessageProduct');

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

// AI导购相关关联
// User 和 UserPersonaPreference 的关联
User.hasMany(UserPersonaPreference, { foreignKey: 'user_id', as: 'personaPreferences' });
UserPersonaPreference.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AIPersona 和 UserPersonaPreference 的关联
AIPersona.hasMany(UserPersonaPreference, { foreignKey: 'persona_id', as: 'userPreferences' });
UserPersonaPreference.belongsTo(AIPersona, { foreignKey: 'persona_id', as: 'persona' });

// User 和 ChatSession 的关联
User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });
ChatSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AIPersona 和 ChatSession 的关联
AIPersona.hasMany(ChatSession, { foreignKey: 'persona_id', as: 'chatSessions' });
ChatSession.belongsTo(AIPersona, { foreignKey: 'persona_id', as: 'persona' });

// ChatSession 和 ChatMessage 的关联
ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id', as: 'session' });

// AIPersona 和 ChatMessage 的关联
AIPersona.hasMany(ChatMessage, { foreignKey: 'persona_id', as: 'messages' });
ChatMessage.belongsTo(AIPersona, { foreignKey: 'persona_id', as: 'persona' });

// ChatMessage 和 MessageProduct 的关联
ChatMessage.hasMany(MessageProduct, { foreignKey: 'message_id', as: 'products' });
MessageProduct.belongsTo(ChatMessage, { foreignKey: 'message_id', as: 'message' });

// Product 和 MessageProduct 的关联
Product.hasMany(MessageProduct, { foreignKey: 'product_id', as: 'messageReferences' });
MessageProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  User,
  Product,
  Cart,
  Order,
  OrderItem,
  AIPersona,
  UserPersonaPreference,
  ChatSession,
  ChatMessage,
  MessageProduct
};

