# 快速启动指南

## ✅ 已完成
- [x] 安装依赖 (`npm install`)

## 📋 接下来需要做的步骤

### 1. 配置环境变量

编辑 `backend/.env` 文件，填写以下配置：

**必须配置（AI 功能）：**
- `DASHSCOPE_API_KEY`: 阿里云百炼 API Key（通义千问 + ASR + 每日灵感共用）
  - 获取地址：https://bailian.console.aliyun.com/ → API Key 管理 → 创建 API Key
  - 这是**最重要的配置**，用于生成菜谱和每日灵感

**必须配置（微信小程序）：**
- `WECHAT_APPID`: 你的微信小程序 AppID（在微信公众平台获取）
- `WECHAT_SECRET`: 你的微信小程序 Secret（在微信公众平台获取）
  - 获取地址：https://mp.weixin.qq.com → 开发 → 开发管理 → 开发设置

**强烈推荐配置（视频解析）：**
- `VIDEO_PARSER_API_URL`: 视频解析 API 地址
- `VIDEO_PARSER_API_TYPE`: API 类型（ucmao/custom/yaohu/litchi）
- `VIDEO_PARSER_API_KEY`: 视频解析 API Key（ucmao 不需要，留空即可）
  - **推荐使用开源方案 parse-ucmao-backend**（完全免费，可自托管）
  - GitHub: https://github.com/ucmao/parse-ucmao-backend
  - 快速部署：运行 `scripts/setup-ucmao.sh` 或查看 `docs/OPEN_SOURCE_PARSER.md`
  - 详细配置见 `docs/VIDEO_PARSER_SETUP.md`

**可选配置：**
- `MONGODB_URI`: 如果使用远程 MongoDB（如 MongoDB Atlas），修改连接地址
- `QWEN_MODEL`: 通义千问模型（默认 qwen-turbo，可选 qwen-plus）
- `ASR_MODEL`: ASR 模型（默认 paraformer-v2）

### 2. 启动 MongoDB

**方式一：本地安装（推荐开发环境）**
```bash
# macOS
brew services start mongodb-community

# 检查是否运行
mongosh
```

**方式二：使用 Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**方式三：使用 MongoDB Atlas（云数据库，推荐生产环境）**
- 访问 https://www.mongodb.com/cloud/atlas
- 创建免费集群
- 获取连接字符串，更新 `.env` 中的 `MONGODB_URI`

### 3. 初始化数据库（可选）

如果需要示例数据，运行：
```bash
node scripts/init-db.js
```

### 4. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

服务启动后，访问 `http://localhost:3000/health` 检查是否正常运行。

### 5. 测试 API

可以使用 Postman 或 curl 测试：

```bash
# 健康检查
curl http://localhost:3000/health

# 测试视频解析（需要先配置微信认证）
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -H "x-wechat-code: test-code" \
  -d '{"url": "https://example.com/video"}'
```

### 6. 微信小程序前端集成

在小程序端调用API时，需要：

1. **获取微信登录code**
```javascript
wx.login({
  success: (res) => {
    const code = res.code;
    // 使用code调用后端API
  }
});
```

2. **调用后端API**
```javascript
wx.request({
  url: 'https://your-domain.com/api/video/parse',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'x-wechat-code': code  // 传递微信code
  },
  data: {
    url: 'https://v.douyin.com/xxx'  // 视频链接
  },
  success: (res) => {
    console.log('生成的菜谱:', res.data);
  }
});
```

3. **配置小程序域名白名单**
- 登录微信公众平台
- 开发 → 开发管理 → 开发设置
- 服务器域名 → request合法域名
- 添加你的后端API域名（如：`https://your-domain.com`）

### 7. 部署到生产环境

**推荐方案：**

1. **服务器部署**
   - 使用 PM2 管理进程：`pm2 start server.js`
   - 配置 Nginx 反向代理
   - 使用 HTTPS（微信小程序要求）

2. **云服务部署**
   - 阿里云/腾讯云/Heroku/Vercel 等
   - 配置环境变量
   - 使用 MongoDB Atlas 云数据库

3. **Docker 部署**
```bash
# 构建镜像
docker build -t recipe-app-backend .

# 运行容器
docker run -d -p 3000:3000 --env-file .env recipe-app-backend
```

## 🔍 常见问题

### Q: MongoDB 连接失败？
- 检查 MongoDB 是否运行：`mongosh` 或 `mongo`
- 检查 `.env` 中的 `MONGODB_URI` 是否正确
- 如果是远程数据库，检查网络连接和防火墙设置

### Q: 微信登录失败？
- 确认 `WECHAT_APPID` 和 `WECHAT_SECRET` 配置正确
- 检查小程序是否已发布或使用测试号
- 开发环境可以暂时不配置，会使用模拟openid

### Q: AI生成菜谱不工作？
- 检查 `DASHSCOPE_API_KEY` 是否配置（必须配置）
- 未配置时会使用模拟数据，功能正常但内容固定
- 确认 API Key 有效且有余额
- 检查阿里云百炼控制台的调用记录和余额

### Q: 视频解析失败？
- 检查 `VIDEO_PARSER_API_KEY` 和 `VIDEO_PARSER_API_URL` 是否配置
- 未配置时只能获取视频标题和描述（无法使用 ASR 转写）
- 配置后可以获取视频直链，提升菜谱生成准确度

### Q: 端口被占用？
- 修改 `.env` 中的 `PORT` 为其他端口（如 3001）
- 或停止占用端口的进程

## 📞 需要帮助？

如果遇到问题，检查：
1. 控制台错误日志
2. MongoDB 连接状态
3. 环境变量配置
4. 网络请求是否正常
