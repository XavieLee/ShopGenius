#!/bin/bash

# ShopGenius 启动脚本
echo "🚀 启动 ShopGenius AI购物应用..."

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js 版本: $node_version"
else
    echo "❌ 未安装 Node.js，请先安装 Node.js 16+"
    exit 1
fi

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port 已被占用，正在尝试停止占用进程..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

echo "🔍 检查端口占用..."
check_port 3000
check_port 3001

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

echo "🌐 启动后端服务器 (端口 3001)..."
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动并检查状态
echo "⏳ 等待后端服务启动..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ 后端服务启动失败，请检查 backend.log"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 2
done

# 启动前端服务
echo "🎨 启动前端服务..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo "🌐 启动前端服务器 (端口 3000)..."
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
for i in {1..15}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 前端服务启动成功"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "⚠️  前端服务可能还在启动中，请稍等..."
        break
    fi
    sleep 3
done

echo ""
echo "🎉 ShopGenius 启动完成！"
echo ""
echo "📱 前端应用: http://localhost:3000"
echo "🔧 后端API: http://localhost:3001/api"
echo "❤️  健康检查: http://localhost:3001/health"
echo ""
echo "📋 日志文件:"
echo "   后端日志: backend.log"
echo "   前端日志: frontend.log"
echo ""
echo "🔍 运行连接测试: node test-connection.js"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait

# 清理进程
echo ""
echo "🛑 正在停止服务..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
sleep 2
echo "✅ 服务已停止"
