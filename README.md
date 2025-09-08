# ShopGenius - AI购物助手

> 基于Taro + React的跨平台AI购物应用，支持小程序、H5和App

## 🚀 项目简介

ShopGenius是一款智能购物应用，提供AI驱动的购物体验，包含以下核心功能：

- 🤖 **AI购物助手** - 智能对话式购物咨询和推荐
- 🔍 **对话式搜索** - 使用自然语言描述需求进行商品搜索
- 🏷️ **智能筛选** - 通过自然语言指令筛选商品
- 📦 **商品展示** - 商品列表、详情展示
- 🛒 **购物车** - 购物车管理和结算
- 💳 **支付集成** - 多种支付方式支持

## 🛠️ 技术栈

### 前端
- **框架**: Taro 4.1.6 + React 18
- **语言**: TypeScript
- **样式**: SCSS
- **构建**: Vite
- **平台支持**: 微信小程序、H5、支付宝小程序、App

### 后端
- **框架**: Node.js + Express
- **数据库**: MySQL + Sequelize ORM
- **认证**: JWT
- **AI集成**: 支持OpenAI、百度文心一言、阿里通义千问等

## 📦 项目结构

```
ShopGenius/
├── frontend/              # 前端项目(Taro)
│   ├── src/
│   │   ├── pages/         # 页面
│   │   ├── components/    # 组件
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   └── styles/        # 样式文件
│   ├── config/            # 配置文件
│   └── package.json
├── backend/               # 后端项目(Node.js)
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   ├── services/      # 业务服务
│   │   └── config/        # 配置
│   └── package.json
├── docs/                  # 文档
├── scripts/               # 脚本
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8
- MySQL >= 8.0 (可选，开发阶段使用模拟数据)

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install --legacy-peer-deps
```

### 配置环境变量

1. 复制后端环境配置文件：
```bash
cd backend
cp env.example .env
```

2. 编辑 `.env` 文件，配置数据库和AI服务密钥：
```env
# 数据库配置
DB_HOST=localhost
DB_NAME=shopgenius
DB_USER=your_username
DB_PASSWORD=your_password

# AI服务配置（选择一个）
OPENAI_API_KEY=your_openai_key
# 或
BAIDU_API_KEY=your_baidu_key
BAIDU_SECRET_KEY=your_baidu_secret
```

### 启动开发服务器

1. 启动后端服务：
```bash
cd backend
npm run dev
# 或直接运行
node src/app.js
```

2. 启动前端服务：
```bash
cd frontend
# H5开发
npm run dev:h5

# 微信小程序开发
npm run dev:weapp
```

### 访问应用

- **后端API**: http://localhost:3000
- **前端H5**: http://localhost:10086
- **健康检查**: http://localhost:3000/health

## 📱 功能展示

### 首页
- 欢迎界面
- 快速入口：AI助手、智能搜索
- 热门商品展示
- 推荐分类

### AI购物助手
- 实时文本对话
- 商品推荐和介绍
- 购物建议和答疑
- 智能理解用户需求

### 智能搜索
- 自然语言搜索
- 搜索历史记录
- 热门搜索建议
- 搜索结果展示

### 商品详情
- 商品图片展示
- 详细信息介绍
- 用户评价展示
- 加入购物车/立即购买

### 购物车
- 商品管理（增删改查）
- 全选/取消全选
- 实时价格计算
- 结算功能

## 🔧 开发指南

### 前端开发

1. **页面开发**: 在 `frontend/src/pages/` 下创建新页面
2. **组件开发**: 在 `frontend/src/components/` 下创建复用组件
3. **API调用**: 在 `frontend/src/services/` 下管理API接口
4. **样式规范**: 使用SCSS，遵循BEM命名规范

### 后端开发

1. **路由定义**: 在 `backend/src/routes/` 下定义API路由
2. **控制器**: 在 `backend/src/controllers/` 下实现业务逻辑
3. **数据模型**: 在 `backend/src/models/` 下定义数据模型
4. **中间件**: 在 `backend/src/middleware/` 下实现通用中间件

### API文档

主要API接口：

```
GET    /api/products         # 获取商品列表
GET    /api/products/:id     # 获取商品详情
POST   /api/ai/chat          # AI聊天对话
POST   /api/ai/search        # 智能搜索
GET    /api/cart             # 获取购物车
POST   /api/cart/add         # 添加到购物车
POST   /api/orders           # 创建订单
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆕 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🤖 AI购物助手基础功能
- 🔍 对话式搜索功能
- 📦 商品展示和详情
- 🛒 购物车基础功能
- 🎨 响应式UI设计

---

**开发团队**: ShopGenius Team  
**联系方式**: [GitHub Issues](https://github.com/your-username/ShopGenius/issues)