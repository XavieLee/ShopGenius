#!/bin/bash

# ShopGenius 启动脚本
# 支持后台运行和自动重启

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/shopgenius.pid"
LOG_FILE="$SCRIPT_DIR/shopgenius.log"
BACKEND_LOG="$SCRIPT_DIR/backend.log"
FRONTEND_LOG="$SCRIPT_DIR/frontend.log"

# 检查参数
DAEMON_MODE=false
ENVIRONMENT="dev"

for arg in "$@"; do
    case "$arg" in
        "--daemon")
            DAEMON_MODE=true
            ;;
        "--env=dev"|"--env=development")
            ENVIRONMENT="dev"
            ;;
        "--env=test")
            ENVIRONMENT="test"
            ;;
    esac
done

# 停止现有进程的函数
stop_services() {
    echo "🛑 停止现有服务..."
    
    # 从PID文件读取进程ID
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                echo "停止进程 $pid"
                kill -TERM "$pid" 2>/dev/null
                sleep 2
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid" 2>/dev/null
                fi
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # 清理端口占用
    echo "🔍 清理端口占用..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
}

# 启动服务的函数
start_services() {
    echo "🚀 启动 ShopGenius AI购物应用..."

    # 检查Node.js版本
    echo "📋 检查环境..."
    node_version=$(node -v 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ Node.js 版本: $node_version"
    else
        echo "❌ 未安装 Node.js，请先安装 Node.js 16+"
        return 1
    fi

    # 启动后端服务
    echo "🔧 启动后端服务..."
    cd "$SCRIPT_DIR/backend"
    if [ ! -d "node_modules" ]; then
        echo "📦 安装后端依赖..."
        npm install
    fi

    echo "🌐 启动后端服务器 (端口 3001) - 环境: $ENVIRONMENT..."
    if [ "$DAEMON_MODE" = true ]; then
        nohup env NODE_ENV="$ENVIRONMENT" npm start > "$BACKEND_LOG" 2>&1 &
    else
        env NODE_ENV="$ENVIRONMENT" npm start > "$BACKEND_LOG" 2>&1 &
    fi
    BACKEND_PID=$!
    echo $BACKEND_PID >> "$PID_FILE"

    # 等待后端启动并检查状态
    echo "⏳ 等待后端服务启动..."
    for i in {1..10}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "✅ 后端服务启动成功"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ 后端服务启动失败，请检查 $BACKEND_LOG"
            kill $BACKEND_PID 2>/dev/null
            return 1
        fi
        sleep 2
    done

    # 启动前端服务
    echo "🎨 启动前端服务..."
    cd "$SCRIPT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    fi

    echo "🌐 启动前端服务器 (端口 3000)..."
    if [ "$DAEMON_MODE" = true ]; then
        nohup npm start > "$FRONTEND_LOG" 2>&1 &
    else
        npm start > "$FRONTEND_LOG" 2>&1 &
    fi
    FRONTEND_PID=$!
    echo $FRONTEND_PID >> "$PID_FILE"

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
}

# 显示启动完成信息
show_completion_info() {
    echo ""
    echo "🎉 ShopGenius 启动完成！"
    echo ""
    echo "📱 前端应用: http://localhost:3000"
    echo "🔧 后端API: http://localhost:3001/api"
    echo "❤️  健康检查: http://localhost:3001/health"
    echo ""
    echo "📋 日志文件:"
    echo "   后端日志: $BACKEND_LOG"
    echo "   前端日志: $FRONTEND_LOG"
    echo "   主日志: $LOG_FILE"
    echo ""
    echo "🔍 运行连接测试: node test-connection.js"
    echo ""
}

# 健康检查函数
health_check() {
    local backend_ok=false
    local frontend_ok=false
    
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        backend_ok=true
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        frontend_ok=true
    fi
    
    if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
        return 0
    else
        return 1
    fi
}

# 自动重启函数
auto_restart() {
    echo "🔄 启动自动重启监控..."
    
    while true; do
        sleep 30  # 每30秒检查一次
        
        if ! health_check; then
            echo "$(date): 检测到服务异常，正在重启..." >> "$LOG_FILE"
            echo "⚠️  检测到服务异常，正在重启..."
            
            stop_services
            sleep 5
            
            if start_services; then
                echo "$(date): 服务重启成功" >> "$LOG_FILE"
                echo "✅ 服务重启成功"
            else
                echo "$(date): 服务重启失败" >> "$LOG_FILE"
                echo "❌ 服务重启失败"
            fi
        fi
    done
}

# 主逻辑
main() {
    case "$1" in
        "start")
            echo "🚀 启动 ShopGenius 服务..."
            stop_services
            if start_services; then
                show_completion_info
                if [ "$DAEMON_MODE" = true ]; then
                    echo "🔄 服务已在后台运行，PID文件: $PID_FILE"
                    auto_restart &
                    echo $! >> "$PID_FILE"
                    echo "✅ 后台服务启动完成"
                    echo "📋 使用以下命令管理服务:"
                    echo "  查看状态: $0 status"
                    echo "  停止服务: $0 stop"
                    echo "  查看日志: $0 logs"
                    exit 0
                else
                    echo "按 Ctrl+C 停止所有服务"
                    # 设置信号处理
                    trap 'echo ""; echo "🛑 正在停止服务..."; stop_services; echo "✅ 服务已停止"; exit 0' INT TERM
                    # 等待用户中断
                    wait
                fi
            else
                echo "❌ 服务启动失败"
                exit 1
            fi
            ;;
        "stop")
            echo "🛑 停止 ShopGenius 服务..."
            stop_services
            echo "✅ 服务已停止"
            ;;
        "restart")
            echo "🔄 重启 ShopGenius 服务..."
            stop_services
            sleep 2
            if start_services; then
                show_completion_info
                echo "✅ 服务重启完成"
            else
                echo "❌ 服务重启失败"
                exit 1
            fi
            ;;
        "status")
            if [ -f "$PID_FILE" ]; then
                echo "📊 服务状态:"
                while read pid; do
                    if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                        echo "  ✅ 进程 $pid 正在运行"
                    else
                        echo "  ❌ 进程 $pid 已停止"
                    fi
                done < "$PID_FILE"
                
                if health_check; then
                    echo "  ✅ 服务健康检查通过"
                else
                    echo "  ⚠️  服务健康检查失败"
                fi
            else
                echo "❌ 服务未运行"
            fi
            ;;
        "logs")
            echo "📋 显示日志..."
            if [ -f "$LOG_FILE" ]; then
                tail -f "$LOG_FILE"
            else
                echo "❌ 日志文件不存在"
            fi
            ;;
        *)
            echo "ShopGenius 启动脚本"
            echo ""
            echo "用法: $0 {start|stop|restart|status|logs}"
            echo ""
            echo "命令:"
            echo "  start    启动服务"
            echo "  stop     停止服务"
            echo "  restart  重启服务"
            echo "  status   查看服务状态"
            echo "  logs     查看日志"
            echo ""
            echo "选项:"
            echo "  --daemon          后台运行模式"
            echo "  --env=dev         开发环境（默认）"
            echo "  --env=test        测试环境"
            echo ""
            echo "示例:"
            echo "  $0 start                    # 前台启动（开发环境）"
            echo "  $0 start --daemon           # 后台启动（开发环境）"
            echo "  $0 start --env=test         # 前台启动（测试环境）"
            echo "  $0 start --daemon --env=test # 后台启动（测试环境）"
            echo "  $0 stop                     # 停止服务"
            echo "  $0 restart                  # 重启服务"
            echo "  $0 status                   # 查看状态"
            echo "  $0 logs                     # 查看日志"
            ;;
    esac
}

# 执行主逻辑
main "$@"
