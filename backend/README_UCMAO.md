# 开源视频解析方案 - parse-ucmao-backend

## 🎯 为什么选择开源方案？

- ✅ **完全免费**：MIT 许可证，可商用
- ✅ **可自托管**：完全控制，不依赖第三方服务
- ✅ **功能完整**：支持抖音、快手、B站等 8+ 平台
- ✅ **返回视频直链**：可用于阿里云 ASR 转写

## 🚀 快速部署

### 方式一：使用自动部署脚本（推荐）

```bash
cd backend
bash scripts/setup-ucmao.sh
```

脚本会自动：
1. 克隆 parse-ucmao-backend 项目
2. 创建 Python 虚拟环境
3. 安装依赖
4. 提供启动指令

### 方式二：手动部署

```bash
# 1. 克隆项目
git clone https://github.com/ucmao/parse-ucmao-backend.git
cd parse-ucmao-backend

# 2. 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 启动服务
python app.py
```

服务默认运行在 `http://localhost:5000`

## ⚙️ 配置后端

编辑 `backend/.env` 文件：

```env
VIDEO_PARSER_API_KEY=  # ucmao 不需要，留空即可
VIDEO_PARSER_API_URL=http://localhost:5000/api/parse
VIDEO_PARSER_API_TYPE=ucmao
```

## 🧪 测试

### 测试 ucmao 服务

```bash
curl -X POST http://localhost:5000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://v.douyin.com/xxxxx"}'
```

### 测试你的后端

```bash
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -H "x-wechat-code: test" \
  -d '{"url": "https://v.douyin.com/xxxxx"}'
```

## 📋 工作流程

```
用户粘贴链接
  ↓
后端调用 ucmao API (http://localhost:5000/api/parse)
  ↓
获取：标题、描述、视频直链（video_url）
  ↓
如果有 video_url → 阿里云 ASR 转写旁白 → 文本
  ↓
通义千问生成结构化菜谱
```

## 🔧 生产环境部署

### Docker 部署（推荐）

```dockerfile
# Dockerfile（在 parse-ucmao-backend 目录）
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

```bash
docker build -t ucmao-parser .
docker run -d -p 5000:5000 --name ucmao-parser ucmao-parser
```

### 使用 PM2（Node.js 环境）

如果要在 Node.js 服务器上运行 Python 服务：

```bash
npm install -g pm2
pm2 start "python app.py" --name ucmao-parser --interpreter python3
```

## ❓ 常见问题

**Q: ucmao 服务启动失败？**
A: 检查 Python 版本（需要 3.7+），确保依赖已安装

**Q: 返回的视频链接无法访问？**
A: 某些平台的视频链接有时效性，建议尽快用于 ASR 转写

**Q: 支持哪些平台？**
A: 抖音、快手、小红书、B站等 8+ 平台，详见项目文档

**Q: 如何更新 ucmao？**
A: 进入项目目录，执行 `git pull` 然后重启服务

## 📚 更多信息

- 项目地址：https://github.com/ucmao/parse-ucmao-backend
- 问题反馈：https://github.com/ucmao/parse-ucmao-backend/issues
