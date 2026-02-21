# 立即部署 ucmao 视频解析服务

## 🎯 问题说明

当前使用的是**基础解析**（仅提取标题和描述），没有使用开源方案 ucmao，所以无法获取视频直链用于 ASR 转写。

## 🚀 快速部署步骤（在你的终端执行）

### Step 1: 克隆 ucmao 项目

```bash
cd /Users/chloe/Desktop/recipeapp
git clone https://github.com/ucmao/parse-ucmao-backend.git ucmao-parser
cd ucmao-parser
```

### Step 2: 安装依赖

```bash
# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### Step 3: 启动 ucmao 服务

```bash
# 确保虚拟环境已激活
source venv/bin/activate

# 启动服务（默认运行在 5000 端口）
python app.py
```

**保持这个终端窗口打开**，ucmao 服务会一直运行。

### Step 4: 配置后端 .env

编辑 `backend/.env` 文件，取消注释并修改：

```env
VIDEO_PARSER_API_KEY=  # ucmao 不需要，留空即可
VIDEO_PARSER_API_URL=http://localhost:5000/api/parse
VIDEO_PARSER_API_TYPE=ucmao
```

### Step 5: 重启后端服务

在另一个终端窗口：

```bash
cd /Users/chloe/Desktop/recipeapp/backend
npm run dev
```

### Step 6: 测试

```bash
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -H "x-wechat-code: test-code" \
  -d '{"url": "https://www.bilibili.com/video/BV1Kf6FB5EuS/"}'
```

---

## ✅ 预期效果

部署 ucmao 后：
1. ✅ 能获取视频直链（`video_url`）
2. ✅ 调用阿里云 ASR 转写视频旁白
3. ✅ 基于转写文本生成更准确的菜谱

---

## 🔍 验证 ucmao 是否运行

在浏览器访问：http://localhost:5000

或测试 API：

```bash
curl -X POST http://localhost:5000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.bilibili.com/video/BV1Kf6FB5EuS/"}'
```

应该返回包含 `video_url` 的 JSON 数据。

---

## ⚠️ 如果遇到问题

**问题：git clone 失败**
- 手动下载：访问 https://github.com/ucmao/parse-ucmao-backend
- 点击 "Code" → "Download ZIP"
- 解压到 `/Users/chloe/Desktop/recipeapp/ucmao-parser`

**问题：Python 依赖安装失败**
- 确保 Python 版本 >= 3.7
- 尝试：`pip3 install -r requirements.txt`

**问题：端口 5000 被占用**
- 修改 ucmao 的端口（在 app.py 中）
- 或修改 `.env` 中的 `VIDEO_PARSER_API_URL` 端口
