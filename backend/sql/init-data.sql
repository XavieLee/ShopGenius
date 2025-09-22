-- ShopGenius 初始数据插入脚本
-- 创建时间: 2024-01-01
-- 版本: 1.0

USE shopgenius;

-- 插入AI导购风格数据（使用friendly风格作为默认）
INSERT IGNORE INTO ai_personas (id, label, description, system_prompt, greeting_template) VALUES
('friendly', '友好购物助手', '友好的AI购物助手', 
 '你是ShopGenius的友好购物助手，请用中文回答用户关于商品的问题。你善于倾听用户需求，提供贴心的购物建议，帮助用户找到心仪的商品。',
 '你好！我是你的友好购物助手，有什么可以帮助你的吗？');

-- 插入示例商品数据（如果不存在则插入）
INSERT IGNORE INTO products (name, description, category, subcategory, brand, price, original_price, currency, color, size, material, weight, dimensions, image_url, images, tags, rating, review_count, stock_quantity, status, seo_title, seo_description) VALUES
('Nike Air Max 270 红色运动鞋', '舒适透气，适合日常运动和休闲穿着。采用Air Max气垫技术，提供卓越的缓震效果。', 'Sports', '跑步鞋', 'Nike', 899.00, 1299.00, 'CNY', '红色', '42', '合成材料', 0.8, '42码', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop'), JSON_ARRAY('运动鞋', '跑步鞋', '红色', 'Nike', 'Air Max'), 4.5, 128, 50, 'active', 'Nike Air Max 270 红色运动鞋 - 舒适透气跑步鞋', 'Nike Air Max 270红色运动鞋，舒适透气，适合日常运动。Air Max气垫技术，卓越缓震效果。'),

('Adidas Ultraboost 22 蓝色跑鞋', '专业跑步鞋，采用Boost中底技术，提供出色的能量回弹和舒适性。', 'Sports', '跑步鞋', 'Adidas', 1299.00, 1599.00, 'CNY', '蓝色', '41', 'Primeknit鞋面', 0.7, '41码', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop'), JSON_ARRAY('运动鞋', '跑步鞋', '蓝色', 'Adidas', 'Ultraboost'), 4.7, 95, 30, 'active', 'Adidas Ultraboost 22 蓝色跑鞋 - 专业跑步鞋', 'Adidas Ultraboost 22蓝色跑鞋，Boost中底技术，出色能量回弹。'),

('Uniqlo 优衣库 基础款白色T恤', '100%纯棉材质，柔软舒适，经典基础款设计，百搭实用。', 'Clothing', 'T恤', 'Uniqlo', 79.00, 99.00, 'CNY', '白色', 'L', '100%纯棉', 0.2, 'L码', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'), JSON_ARRAY('T恤', '白色', '优衣库', '基础款', '纯棉'), 4.2, 256, 100, 'active', 'Uniqlo 优衣库 基础款白色T恤 - 纯棉舒适', 'Uniqlo优衣库基础款白色T恤，100%纯棉材质，柔软舒适，经典设计。'),

('Zara 黑色休闲裤', '时尚休闲裤，修身剪裁，适合日常穿着和商务休闲场合。', 'Clothing', '裤子', 'Zara', 299.00, 399.00, 'CNY', '黑色', '32', '聚酯纤维+棉', 0.5, '32码', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1506629905607-1b2b3b3b3b3b?w=400&h=400&fit=crop'), JSON_ARRAY('裤子', '黑色', 'Zara', '休闲', '修身'), 4.0, 78, 45, 'active', 'Zara 黑色休闲裤 - 时尚修身', 'Zara黑色休闲裤，时尚修身剪裁，适合日常和商务休闲。'),

('Apple iPhone 15 Pro 深空黑色', '最新款iPhone，A17 Pro芯片，钛金属设计，专业级摄影系统。', 'Electronics', '手机', 'Apple', 7999.00, 8999.00, 'CNY', '深空黑色', '256GB', '钛金属', 0.2, '6.1英寸', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'), JSON_ARRAY('手机', 'iPhone', 'Apple', '深空黑色', 'A17 Pro'), 4.8, 342, 25, 'active', 'Apple iPhone 15 Pro 深空黑色 - 最新款手机', 'Apple iPhone 15 Pro深空黑色，A17 Pro芯片，钛金属设计，专业摄影。'),

('Samsung Galaxy S24 Ultra 钛灰色', '三星旗舰手机，S Pen支持，200MP主摄，AI功能强大。', 'Electronics', '手机', 'Samsung', 6999.00, 7999.00, 'CNY', '钛灰色', '512GB', '钛金属', 0.23, '6.8英寸', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'), JSON_ARRAY('手机', 'Samsung', 'Galaxy', '钛灰色', 'S Pen'), 4.6, 198, 20, 'active', 'Samsung Galaxy S24 Ultra 钛灰色 - 旗舰手机', 'Samsung Galaxy S24 Ultra钛灰色，S Pen支持，200MP主摄，AI功能。'),

('Coach 经典款棕色手提包', '真皮材质，经典设计，适合商务和日常使用，品质卓越。', 'Accessories', '包包', 'Coach', 2999.00, 3999.00, 'CNY', '棕色', '中号', '真皮', 0.8, '30x20x10cm', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop'), JSON_ARRAY('包包', 'Coach', '棕色', '真皮', '经典款'), 4.4, 67, 15, 'active', 'Coach 经典款棕色手提包 - 真皮品质', 'Coach经典款棕色手提包，真皮材质，经典设计，商务日常两用。'),

('Rolex Submariner 黑色潜水表', '经典潜水表，精钢表壳，黑色表盘，防水300米，瑞士制造。', 'Accessories', '手表', 'Rolex', 89999.00, 99999.00, 'CNY', '黑色', '40mm', '精钢', 0.15, '40mm表径', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', JSON_ARRAY('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1523170335258-f5c6a6b3b3b3?w=400&h=400&fit=crop'), JSON_ARRAY('手表', 'Rolex', '黑色', '潜水表', '瑞士制造'), 4.9, 23, 5, 'active', 'Rolex Submariner 黑色潜水表 - 瑞士制造', 'Rolex Submariner黑色潜水表，精钢表壳，防水300米，瑞士制造。');

-- 插入示例用户数据（用于测试，如果不存在则插入）
INSERT IGNORE INTO users (username, email, password_hash, avatar_url, phone, status) VALUES
('testuser', 'test@example.com', '$2a$10$example_hash', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', '13800138000', 'active'),
('demo_user', 'demo@example.com', '$2a$10$example_hash', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', '13800138001', 'active');

-- 插入用户AI风格偏好（统一使用friendly风格）
INSERT IGNORE INTO user_persona_preferences (user_id, persona_id, is_default) VALUES
(1, 'friendly', true),
(2, 'friendly', true);

-- 插入示例聊天会话（统一使用friendly风格）
INSERT IGNORE INTO chat_sessions (user_id, persona_id) VALUES
(1, 'friendly'),
(2, 'friendly');

-- 插入示例聊天消息（统一使用friendly风格）
INSERT IGNORE INTO chat_messages (session_id, role, content, persona_id) VALUES
(1, 'user', '我想买一双红色的运动鞋', null),
(1, 'assistant', '我为你推荐几款红色运动鞋，都是性价比很高的选择！', 'friendly'),
(2, 'user', '帮我分析一下iPhone和Samsung手机的性价比', null),
(2, 'assistant', '基于你的需求，我分析了以下手机的性价比：', 'friendly');

-- 插入消息商品关联（如果不存在则插入）
INSERT IGNORE INTO message_products (message_id, product_id, display_order) VALUES
(2, 1, 0),
(2, 2, 1),
(4, 5, 0),
(4, 6, 1);

-- 插入示例购物车数据（如果不存在则插入）
INSERT IGNORE INTO cart_items (user_id, product_id, quantity) VALUES
(1, 1, 1),
(1, 3, 2),
(2, 5, 1);

-- 创建一些额外的索引以优化查询性能
-- 注意：主要索引已在schema.sql中定义，这里只添加一些额外的优化索引

-- 为products表创建复合索引（避免TEXT列索引问题）
CREATE INDEX idx_products_category_brand ON products(category, brand);
CREATE INDEX idx_products_price_range ON products(price, rating);

-- 为chat_messages表创建复合索引
CREATE INDEX idx_chat_messages_session_role ON chat_messages(session_id, role);

-- 为user_persona_preferences表创建复合索引
CREATE INDEX idx_user_persona_preferences ON user_persona_preferences(user_id, is_default);

-- 显示插入的数据统计
SELECT 'AI导购风格' as table_name, COUNT(*) as count FROM ai_personas
UNION ALL
SELECT '商品' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT '用户' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT '用户偏好' as table_name, COUNT(*) as count FROM user_persona_preferences
UNION ALL
SELECT '聊天会话' as table_name, COUNT(*) as count FROM chat_sessions
UNION ALL
SELECT '聊天消息' as table_name, COUNT(*) as count FROM chat_messages
UNION ALL
SELECT '购物车' as table_name, COUNT(*) as count FROM cart_items;
