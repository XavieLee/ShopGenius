# 环境配置说明

## 概述

ShopGenius 支持多环境配置，目前支持 `dev`（开发环境）和 `test`（测试环境）两个环境。

## 环境配置

### 开发环境 (dev)
- **配置文件**: `config.dev.env`
- **默认设置**: 本地MySQL数据库，开发模式
- **用途**: 本地开发和调试

### 测试环境 (test)
- **配置文件**: `config.test.env`
- **默认设置**: 配置留空，需要手动填写
- **用途**: 测试环境部署

## 配置文件格式

每个环境配置文件使用标准的 `.env` 格式：

```bash
# 服务配置
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopgenius
DB_USER=root
DB_PASSWORD=your_password

# AI服务配置
OPENAI_API_KEY=your_openai_key

# 日志配置
LOG_LEVEL=debug
```

## 使用方法

### 1. 通过启动脚本

```bash
# 开发环境启动
./start.sh start                    # 前台启动
./start.sh start --daemon           # 后台启动

# 测试环境启动
./start.sh start --env=test         # 前台启动
./start.sh start --daemon --env=test # 后台启动
```

### 2. 直接设置环境变量

```bash
# 开发环境
export NODE_ENV=dev
npm start

# 测试环境
export NODE_ENV=test
npm start
```

## 配置优先级

1. **环境变量** (最高优先级)
2. **配置文件** (中等优先级)
3. **默认值** (最低优先级)

## 测试环境配置

测试环境的配置文件 `config.test.env` 中的数据库配置已留空，需要根据实际情况填写：

```bash
# 请根据测试环境实际情况修改以下配置
DB_HOST=your_test_db_host
DB_PORT=3306
DB_NAME=your_test_db_name
DB_USER=your_test_db_user
DB_PASSWORD=your_test_db_password
```

## 注意事项

1. **安全性**: 生产环境配置不要提交到版本控制系统
2. **密码**: 数据库密码等敏感信息请使用强密码
3. **网络**: 确保数据库服务器网络可达
4. **权限**: 确保数据库用户有足够的权限

## 故障排除

### 常见问题

1. **配置文件不存在**
   - 确保配置文件路径正确
   - 检查文件名是否正确

2. **数据库连接失败**
   - 检查数据库配置是否正确
   - 确认数据库服务是否运行
   - 验证网络连接

3. **环境变量不生效**
   - 检查环境变量名称是否正确
   - 确认配置文件格式是否正确

### 调试方法

1. **查看配置信息**: 启动时会显示当前配置
2. **检查日志**: 查看 `backend.log` 文件
3. **健康检查**: 访问 `http://localhost:3001/health`
