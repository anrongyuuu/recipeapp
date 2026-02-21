#!/bin/bash

echo "🚀 启动前端开发服务器..."
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，尝试使用 --legacy-peer-deps..."
    npm install --legacy-peer-deps
  fi
fi

echo ""
echo "✅ 依赖检查完成"
echo ""
echo "🌐 启动开发服务器..."
echo "   前端地址: http://localhost:5173"
echo "   后端地址: http://localhost:3000 (请确保后端已启动)"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev
