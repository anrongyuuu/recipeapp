#!/bin/bash

# parse-ucmao-backend 快速部署脚本
# 用于部署开源视频解析服务

echo "🚀 开始部署 parse-ucmao-backend..."

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装 Python 3.7+"
    exit 1
fi

# 创建部署目录
DEPLOY_DIR="../ucmao-parser"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "📦 克隆 parse-ucmao-backend..."
    git clone https://github.com/ucmao/parse-ucmao-backend.git "$DEPLOY_DIR"
else
    echo "📦 项目已存在，跳过克隆"
fi

cd "$DEPLOY_DIR" || exit 1

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "🔧 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖..."
pip install -r requirements.txt

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 启动 ucmao 服务："
echo "   cd $DEPLOY_DIR"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "2. 配置后端 .env 文件："
echo "   VIDEO_PARSER_API_URL=http://localhost:5000/api/parse"
echo "   VIDEO_PARSER_API_TYPE=ucmao"
echo ""
echo "3. 测试服务："
echo "   curl -X POST http://localhost:5000/api/parse \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"url\": \"https://v.douyin.com/xxxxx\"}'"
echo ""
