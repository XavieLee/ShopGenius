-- ShopGenius 数据库表结构设计
-- 创建时间: 2024-01-01
-- 版本: 1.0

-- 创建数据库
CREATE DATABASE IF NOT EXISTS shopgenius CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopgenius;

-- 1. 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) UNIQUE COMMENT '用户名',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    password_hash VARCHAR(255) COMMENT '密码哈希',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '手机号',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '用户状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. AI导购风格表
CREATE TABLE ai_personas (
    id VARCHAR(20) PRIMARY KEY COMMENT '风格ID',
    label VARCHAR(50) NOT NULL COMMENT '风格标签',
    description TEXT COMMENT '风格描述',
    system_prompt TEXT NOT NULL COMMENT '系统提示词',
    greeting_template TEXT NOT NULL COMMENT '问候语模板',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI导购风格表';

-- 3. 用户AI风格偏好表
CREATE TABLE user_persona_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    persona_id VARCHAR(20) NOT NULL COMMENT 'AI风格ID',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否为默认风格',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES ai_personas(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_persona (user_id, persona_id),
    INDEX idx_user_id (user_id),
    INDEX idx_persona_id (persona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户AI风格偏好表';

-- 4. 聊天会话表
CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    user_id INT NOT NULL COMMENT '用户ID',
    persona_id VARCHAR(20) NOT NULL COMMENT 'AI风格ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES ai_personas(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_persona_id (persona_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 5. 聊天消息表
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    session_id INT NOT NULL COMMENT '会话ID',
    role ENUM('user', 'assistant') NOT NULL COMMENT '消息角色',
    content TEXT NOT NULL COMMENT '消息内容',
    persona_id VARCHAR(20) COMMENT 'AI风格ID（仅assistant消息）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES ai_personas(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at),
    INDEX idx_persona_id (persona_id),
    FULLTEXT idx_content_search (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- 6. 商品表
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '商品ID',
    name VARCHAR(200) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    category VARCHAR(100) NOT NULL COMMENT '商品分类',
    subcategory VARCHAR(100) COMMENT '商品子分类',
    brand VARCHAR(100) COMMENT '品牌',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    original_price DECIMAL(10,2) COMMENT '原价',
    currency VARCHAR(3) DEFAULT 'CNY' COMMENT '货币单位',
    color VARCHAR(50) COMMENT '颜色',
    size VARCHAR(50) COMMENT '尺寸',
    material VARCHAR(100) COMMENT '材质',
    weight DECIMAL(8,2) COMMENT '重量(kg)',
    dimensions VARCHAR(100) COMMENT '尺寸规格',
    image_url VARCHAR(500) COMMENT '主图URL',
    images JSON COMMENT '商品图片列表',
    tags JSON COMMENT '商品标签',
    tags_text TEXT GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(tags, '$'))) STORED COMMENT '标签文本（用于搜索）',
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '评分',
    review_count INT DEFAULT 0 COMMENT '评价数量',
    stock_quantity INT DEFAULT 0 COMMENT '库存数量',
    status ENUM('active', 'inactive', 'out_of_stock', 'discontinued') DEFAULT 'active' COMMENT '商品状态',
    seo_title VARCHAR(200) COMMENT 'SEO标题',
    seo_description TEXT COMMENT 'SEO描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_brand (brand),
    INDEX idx_price (price),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_search (name, description, tags_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- 7. 消息商品关联表
CREATE TABLE message_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL COMMENT '消息ID',
    product_id INT NOT NULL COMMENT '商品ID',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_message_product (message_id, product_id),
    INDEX idx_message_id (message_id),
    INDEX idx_product_id (product_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息商品关联表';

-- 8. 购物车表
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    product_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- 9. 订单表
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    user_id INT NOT NULL COMMENT '用户ID',
    order_number VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '订单状态',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    currency VARCHAR(3) DEFAULT 'CNY' COMMENT '货币单位',
    shipping_address JSON COMMENT '收货地址',
    payment_method VARCHAR(50) COMMENT '支付方式',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
    payment_id VARCHAR(100) COMMENT '支付ID',
    notes TEXT COMMENT '订单备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 10. 订单商品表
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称（快照）',
    product_image VARCHAR(500) COMMENT '商品图片（快照）',
    price DECIMAL(10,2) NOT NULL COMMENT '商品价格（快照）',
    quantity INT NOT NULL COMMENT '数量',
    subtotal DECIMAL(10,2) NOT NULL COMMENT '小计',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单商品表';

-- 插入初始AI导购风格数据
INSERT INTO ai_personas (id, label, description, system_prompt, greeting_template) VALUES
('friendly', '亲和', '温暖友好的购物助手', 
 '你是一个温暖友好的AI购物助手，总是以亲切、热情的语气与用户交流。你善于倾听用户需求，提供贴心的购物建议，让用户感受到被关心和重视。',
 '你好！我是你的专属购物顾问，很高兴为你服务！有什么我可以帮助你的吗？'),

('rational', '理性', '理性分析的购物顾问', 
 '你是一个理性、专业的AI购物顾问，擅长分析商品性价比，提供客观、数据驱动的购物建议。你注重实用性和价值，帮助用户做出明智的购买决策。',
 '已切换到理性模式。让我为你分析最优质的商品选择。'),

('luxury', '奢华', '高端奢华的购物顾问', 
 '你是一个高端奢华的AI购物顾问，专注于推荐高品质、高端的商品。你了解奢侈品市场，能够为用户提供尊贵的购物体验和专业的奢华商品建议。',
 '欢迎来到奢华购物体验！让我为你推荐最精致的高端商品。');

-- 创建索引优化查询性能
CREATE INDEX idx_chat_sessions_user_created ON chat_sessions(user_id, created_at DESC);
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at ASC);
CREATE INDEX idx_products_category_price ON products(category, price);
CREATE INDEX idx_products_rating_review ON products(rating DESC, review_count DESC);
