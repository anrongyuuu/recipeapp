# 配置检查清单

## ✅ 必须配置的 Key（按优先级）

### 1. 阿里云百炼 API Key（最重要！）
- **Key 名称**: `DASHSCOPE_API_KEY`
- **获取地址**: https://bailian.console.aliyun.com/
- **步骤**:
  1. 登录阿里云账号
  2. 进入百炼控制台 → API Key 管理
  3. 创建 API Key（选择默认业务空间）
  4. 复制 API Key 到 `.env` 文件
- **用途**: 
  - ✅ 通义千问生成菜谱
  - ✅ 阿里云 ASR 转写视频旁白
  - ✅ 每日灵感自动更新
- **费用**: 按调用量计费（有免费额度）

### 2. 微信小程序配置
- **Key 名称**: `WECHAT_APPID`、`WECHAT_SECRET`
- **获取地址**: https://mp.weixin.qq.com
- **步骤**:
  1. 登录微信公众平台
  2. 开发 → 开发管理 → 开发设置
  3. 复制 AppID 和 AppSecret
  4. 填写到 `.env` 文件
- **用途**: 用户登录认证
- **注意**: 开发环境可暂时不配置（会使用模拟 openid）

### 3. 视频解析 API（强烈推荐）

**方案 A：开源方案（推荐）⭐**
- **项目**: parse-ucmao-backend
- **GitHub**: https://github.com/ucmao/parse-ucmao-backend
- **快速部署**: 运行 `bash scripts/setup-ucmao.sh`
- **手动部署**:
```bash
git clone https://github.com/ucmao/parse-ucmao-backend.git
cd parse-ucmao-backend
pip install -r requirements.txt
python app.py  # 运行在 5000 端口
```
- **配置**:
```env
VIDEO_PARSER_API_KEY=  # ucmao 不需要，留空即可
VIDEO_PARSER_API_URL=http://localhost:5000/api/parse
VIDEO_PARSER_API_TYPE=ucmao
```

**方案 B：商业 API（可选）**
- 妖狐数据: https://api.yaohud.cn
- Litchi API: https://litchi-ai.com
- **配置示例**（妖狐数据）:
```env
VIDEO_PARSER_API_KEY=your-yaohu-key
VIDEO_PARSER_API_URL=https://api.yaohud.cn/api/video/parse
VIDEO_PARSER_API_TYPE=yaohu
```

**用途**: 获取视频直链，用于 ASR 转写（提升菜谱准确度）
**注意**: 不配置也能用，但只能根据标题和描述生成菜谱

---

## 📝 配置步骤

### Step 1: 获取阿里云百炼 API Key
1. 访问 https://bailian.console.aliyun.com/
2. 登录/注册阿里云账号
3. 开通百炼服务（免费）
4. 进入 **API Key 管理** → **创建 API Key**
5. 复制 API Key（格式：`sk-xxxxxxxxxxxxx`）
6. 粘贴到 `backend/.env` 文件：
```env
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxx
```

### Step 2: 获取微信小程序配置（可选，开发环境可跳过）
1. 访问 https://mp.weixin.qq.com
2. 登录微信公众平台
3. 开发 → 开发管理 → 开发设置
4. 复制 **AppID** 和 **AppSecret**
5. 填写到 `backend/.env`：
```env
WECHAT_APPID=wxxxxxxxxxxxxxx
WECHAT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: 配置视频解析 API（推荐）
1. 选择一个服务商（推荐：妖狐数据）
2. 注册并获取 API Key
3. 填写到 `backend/.env`：
```env
VIDEO_PARSER_API_KEY=your-api-key
VIDEO_PARSER_API_URL=https://api.yaohud.cn/api/video/parse
VIDEO_PARSER_API_TYPE=yaohu
```

### Step 4: 启动 MongoDB
```bash
# macOS
brew services start mongodb-community

# 或 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 5: 启动服务
```bash
cd backend
npm run dev
```

### Step 6: 测试
访问 http://localhost:3000/health 应该返回 `{"status":"ok"}`

---

## 🔍 配置验证

### 检查配置是否生效

1. **检查 DASHSCOPE_API_KEY**:
```bash
# 启动服务后，查看日志
# 如果看到 "⚠️ 未配置 DASHSCOPE_API_KEY"，说明未配置
# 如果看到 "✅ 每日灵感已更新"，说明配置成功
```

2. **检查视频解析**:
```bash
# 测试视频解析接口
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -H "x-wechat-code: test" \
  -d '{"url": "https://v.douyin.com/xxxxx"}'
```

3. **检查每日灵感**:
```bash
# 手动触发每日灵感更新
curl -X POST http://localhost:3000/api/inspiration/refresh
```

---

## 📊 配置优先级

| 配置项 | 优先级 | 用途 | 不配置的影响 |
|--------|--------|------|--------------|
| `DASHSCOPE_API_KEY` | ⭐⭐⭐ 必须 | AI 生成菜谱、ASR、每日灵感 | 只能使用模拟数据 |
| `WECHAT_APPID` | ⭐⭐ 推荐 | 用户登录 | 开发环境可用模拟 openid |
| `VIDEO_PARSER_API_KEY` | ⭐⭐ 强烈推荐 | 获取视频直链 | 只能根据标题生成菜谱 |
| `MONGODB_URI` | ⭐ 可选 | 数据库连接 | 默认使用本地 MongoDB |

---

## 💰 费用说明

### 阿里云百炼（DASHSCOPE_API_KEY）
- **通义千问**: 按 Token 计费，有免费额度
- **ASR 转写**: 按音频时长计费，有免费额度
- **查看费用**: https://bailian.console.aliyun.com/ → 费用中心

### 视频解析 API
- 按服务商定价（通常按调用次数或包月）
- 妖狐数据有免费额度

---

## ❓ 常见问题

**Q: 我只配置了 DASHSCOPE_API_KEY，可以吗？**
A: 可以！但只能根据视频标题和描述生成菜谱，准确度较低。建议配置视频解析 API。

**Q: 开发环境可以不配置微信小程序吗？**
A: 可以，会使用模拟 openid，但生产环境必须配置。

**Q: 如何知道配置是否成功？**
A: 启动服务后查看日志，或调用测试接口检查返回结果。
