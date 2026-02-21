# 菜谱小程序后端API

微信小程序菜谱应用的后端服务，提供视频解析、AI菜谱生成、用户收藏等功能。

## 功能特性

- ✅ 微信小程序用户认证
- ✅ 视频链接解析（支持抖音、B站等平台）
- ✅ **通义千问** 生成结构化菜谱
- ✅ **阿里云 ASR** 转写视频旁白（百炼 Paraformer）
- ✅ **每日灵感** 自动更新（通义千问 + 定时任务）
- ✅ 用户收藏管理
- ✅ 菜谱搜索和浏览
- ✅ MongoDB数据存储

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下内容：

- `MONGODB_URI`: MongoDB数据库连接地址
- `WECHAT_APPID`: 微信小程序AppID
- `WECHAT_SECRET`: 微信小程序Secret
- `DASHSCOPE_API_KEY`: 阿里云百炼 API Key（通义千问 + 录音文件识别 + 每日灵感共用）
- `JWT_SECRET`: JWT密钥（用于Token认证）
- `VIDEO_PARSER_API_KEY`: 视频解析 API Key（可选，推荐配置以获取视频直链用于 ASR 转写）
- `VIDEO_PARSER_API_URL`: 视频解析 API 地址
- `VIDEO_PARSER_API_TYPE`: API 类型（ucmao/custom/yaohu/litchi）

### 3. 启动MongoDB

确保MongoDB服务已启动：

```bash
# macOS (使用Homebrew)
brew services start mongodb-community

# 或使用Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务默认运行在 `http://localhost:3000`

## API文档

### 认证相关

#### 微信登录
```
POST /api/auth/login
Headers: { x-wechat-code: string }
Body: { code: string }
```

#### 获取用户信息
```
GET /api/auth/user
Headers: { x-wechat-code: string }
```

### 视频解析

#### 解析视频并生成菜谱
```
POST /api/video/parse
Headers: { x-wechat-code: string }
Body: { url: string }
```

### 菜谱相关

#### 获取菜谱详情
```
GET /api/recipe/:id
```

#### 获取灵感菜谱列表
```
GET /api/recipe/inspiration/list?type=早餐&page=1&limit=20
```

#### 获取今日灵感（通义千问每日生成）
```
GET /api/inspiration/daily?type=早餐
POST /api/inspiration/refresh  # 手动触发更新
```

#### 搜索菜谱
```
GET /api/recipe/search?keyword=番茄&page=1&limit=20
```

### 收藏相关

#### 获取收藏列表
```
GET /api/favorite
Headers: { x-wechat-code: string }
```

#### 添加收藏
```
POST /api/favorite
Headers: { x-wechat-code: string }
Body: { recipeId: string }
```

#### 取消收藏
```
DELETE /api/favorite/:recipeId
Headers: { x-wechat-code: string }
```

## 数据库模型

### User（用户）
- `openid`: 微信openid（唯一）
- `nickname`: 昵称
- `avatar`: 头像URL
- `favorites`: 收藏的菜谱ID数组

### Recipe（菜谱）
- `title`: 标题
- `description`: 描述
- `emoji`: emoji图标
- `type`: 类型（早餐/午餐/晚餐/其他）
- `time`: 制作时间
- `ingredients`: 食材数组
- `steps`: 步骤数组
- `imageUrl`: 图片URL
- `videoUrl`: 视频URL
- `videoSource`: 视频来源平台
- `userId`: 创建用户ID
- `isPublic`: 是否公开
- `viewCount`: 浏览量
- `favoriteCount`: 收藏数

## 开发说明

### 视频解析

当前支持基础解析，生产环境建议：
1. 使用第三方视频解析API服务
2. 配置 `VIDEO_PARSER_API_KEY` 环境变量
3. 在 `services/videoParser.js` 中实现对应的API调用

### AI 菜谱生成（通义千问 + 阿里云 ASR）

**完整流程（推荐配置视频解析 API）：**
1. 用户粘贴视频链接 → 调用第三方解析 API 获取视频直链（`mediaUrl`）
2. 若有 `mediaUrl`：调用阿里云 Paraformer ASR 转写视频旁白 → 得到文本
3. 通义千问根据转写文本（或标题+描述）生成结构化菜谱

**简化流程（未配置视频解析 API）：**
- 仅从页面 HTML 提取标题和描述
- 通义千问根据标题和描述生成菜谱（准确度较低）

**配置说明：**
- `DASHSCOPE_API_KEY`：必须配置（通义千问 + ASR）
- `VIDEO_PARSER_API_KEY` + `VIDEO_PARSER_API_URL`：推荐配置（获取视频直链用于 ASR 转写）
- 详细配置见 `docs/VIDEO_PARSER_SETUP.md`

### 每日灵感

- 每日 6:00（北京时间）自动调用通义千问生成当日推荐菜谱
- 可手动触发：`POST /api/inspiration/refresh`

### 微信小程序集成

在小程序端调用API时，需要在请求头中携带微信登录code：

```javascript
// 小程序端示例
wx.login({
  success: (res) => {
    wx.request({
      url: 'https://your-api.com/api/video/parse',
      method: 'POST',
      header: {
        'x-wechat-code': res.code
      },
      data: {
        url: 'https://...'
      }
    });
  }
});
```

## 部署建议

1. 使用PM2管理Node.js进程
2. 配置Nginx反向代理
3. 使用MongoDB Atlas等云数据库
4. 配置HTTPS证书
5. 设置环境变量和密钥管理

## 许可证

MIT
