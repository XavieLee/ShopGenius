#!/bin/bash

# ShopGenius 数据库初始化脚本
# 用于新开发人员快速初始化数据库

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-admin}
DB_NAME=${DB_NAME:-shopgenius}

echo -e "${BLUE}🚀 ShopGenius 数据库初始化脚本${NC}"
echo -e "${BLUE}================================${NC}"

# 检查MySQL是否可用
echo -e "${YELLOW}📋 检查MySQL连接...${NC}"
if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${RED}❌ MySQL连接失败！请检查：${NC}"
    echo -e "${RED}   1. MySQL服务是否启动${NC}"
    echo -e "${RED}   2. 数据库配置是否正确${NC}"
    echo -e "${RED}   3. 用户名密码是否正确${NC}"
    echo ""
    echo -e "${YELLOW}当前配置：${NC}"
    echo -e "   Host: $DB_HOST"
    echo -e "   Port: $DB_PORT"
    echo -e "   User: $DB_USER"
    echo -e "   Password: $DB_PASSWORD"
    exit 1
fi

echo -e "${GREEN}✅ MySQL连接成功${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 执行数据库初始化
echo -e "${YELLOW}📋 开始初始化数据库...${NC}"

# 1. 创建数据库和表结构
echo -e "${YELLOW}   1. 创建数据库和表结构...${NC}"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$SCRIPT_DIR/schema.sql" 2>/dev/null || {
    echo -e "${YELLOW}   ⚠️  数据库已存在，跳过表结构创建${NC}"
}

# 2. 插入初始数据
echo -e "${YELLOW}   2. 插入初始数据...${NC}"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$SCRIPT_DIR/init-data.sql" 2>/dev/null || {
    echo -e "${YELLOW}   ⚠️  初始数据已存在，跳过数据插入${NC}"
}

# 验证初始化结果
echo -e "${YELLOW}📋 验证初始化结果...${NC}"

# 检查表是否创建成功
TABLES=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SHOW TABLES;" -s --skip-column-names)
EXPECTED_TABLES=("users" "ai_personas" "user_persona_preferences" "chat_sessions" "chat_messages" "message_products" "products" "cart_items" "orders" "order_items")

echo -e "${YELLOW}   检查表结构...${NC}"
for table in "${EXPECTED_TABLES[@]}"; do
    if echo "$TABLES" | grep -q "^$table$"; then
        echo -e "${GREEN}   ✅ $table 表创建成功${NC}"
    else
        echo -e "${RED}   ❌ $table 表创建失败${NC}"
        exit 1
    fi
done

# 检查初始数据
echo -e "${YELLOW}   检查初始数据...${NC}"

# 检查AI personas
PERSONA_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM ai_personas;" -s --skip-column-names)
echo -e "${GREEN}   ✅ AI导购风格: $PERSONA_COUNT 个${NC}"

# 检查商品数据
PRODUCT_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM products;" -s --skip-column-names)
echo -e "${GREEN}   ✅ 商品数据: $PRODUCT_COUNT 个${NC}"

# 检查测试用户
USER_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM users;" -s --skip-column-names)
echo -e "${GREEN}   ✅ 测试用户: $USER_COUNT 个${NC}"

echo ""
echo -e "${GREEN}🎉 数据库初始化完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${BLUE}📋 初始化结果：${NC}"
echo -e "   • 数据库: $DB_NAME"
echo -e "   • 表数量: ${#EXPECTED_TABLES[@]}"
echo -e "   • AI导购风格: $PERSONA_COUNT 个"
echo -e "   • 商品数据: $PRODUCT_COUNT 个"
echo -e "   • 测试用户: $USER_COUNT 个"
echo ""
echo -e "${YELLOW}📋 下一步：${NC}"
echo -e "   1. 启动后端服务: cd backend && npm start"
echo -e "   2. 启动前端服务: cd frontend && npm start"
echo -e "   3. 访问应用: http://localhost:3000"
echo ""
echo -e "${BLUE}💡 提示：${NC}"
echo -e "   • 默认测试用户: testuser / demo_user"
echo -e "   • 默认密码: 123456"
echo -e "   • 数据库配置: backend/config.env"
