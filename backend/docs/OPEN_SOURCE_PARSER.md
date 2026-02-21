# 开源视频解析方案

## 推荐方案

### 1. parse-ucmao-backend（最推荐）⭐

**GitHub**: https://github.com/ucmao/parse-ucmao-backend

**特点**:
- ✅ 基于 Python Flask 的 RESTful API 服务
- ✅ 支持抖音、快手、小红书、B站等 8+ 平台
- ✅ 提供完整的后端服务，可直接部署
- ✅ 支持返回视频直链（`video_url`）
- ✅ 包含用户鉴权、日志记录等功能
- ✅ MIT 许可证，可商用

**部署步骤**:
```bash
# 1. 克隆项目
git clone https://github.com/ucmao/parse-ucmao-backend.git
cd parse-ucmao-backend

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置数据库（可选，用于日志）
# 修改 config.py 中的数据库配置

# 4. 启动服务
python app.py
# 默认运行在 http://localhost:5000
```

**API 格式**:
```bash
POST http://localhost:5000/api/parse
Content-Type: application/json

{
  "url": "https://v.douyin.com/xxxxx"
}

# 返回格式
{
  "code": 200,
  "data": {
    "title": "视频标题",
    "video_url": "https://...",  # 视频直链
    "cover": "https://...",
    "author": "..."
  }
}
```

**集成到你的后端**:
```env
VIDEO_PARSER_API_KEY=your-api-key  # 如果ucmao需要鉴权
VIDEO_PARSER_API_URL=http://localhost:5000/api/parse
VIDEO_PARSER_API_TYPE=custom
```

---

### 2. Net-Spider

**GitHub**: https://github.com/FioraLove/Net-Spider

**特点**:
- ✅ 支持 30+ 平台（抖音、快手、B站、微博等）
- ✅ Python 实现，功能丰富
- ✅ 包含 Web 界面

**缺点**:
- ⚠️ 主要是爬虫工具，不是 API 服务
- ⚠️ 需要自己封装成 API

**适用场景**: 如果你想要更多控制，可以基于这个项目自己封装 API

---

### 3. MediaCrawler

**GitHub**: https://github.com/NanmiCoder/MediaCrawler

**特点**:
- ✅ 使用 Playwright，稳定性好
- ✅ 支持登录后的数据抓取
- ✅ 功能强大（视频、评论、点赞等）

**缺点**:
- ⚠️ 主要是爬虫框架，不是现成的 API
- ⚠️ 需要自己封装

**适用场景**: 需要抓取更多数据（评论、点赞等）时使用

---

## 推荐方案：parse-ucmao-backend

### 为什么推荐？

1. **开箱即用**: 直接提供 RESTful API，无需二次开发
2. **易于部署**: Python Flask，部署简单
3. **返回格式标准**: 直接返回 `video_url`，完美适配你的后端
4. **可自托管**: 完全控制，不依赖第三方服务
5. **MIT 许可证**: 可商用

### 部署建议

**本地开发**:
```bash
# 在同一台机器上运行
python app.py  # ucmao 服务在 5000 端口
npm run dev    # 你的后端在 3000 端口
```

**生产环境**:
- 使用 Docker 部署 ucmao 服务
- 使用 Nginx 反向代理
- 或者直接集成到你的 Node.js 后端（用 child_process 调用 Python）

---

## 快速集成指南

### 方案 A：独立部署（推荐）

1. **部署 parse-ucmao-backend**:
```bash
git clone https://github.com/ucmao/parse-ucmao-backend.git
cd parse-ucmao-backend
pip install -r requirements.txt
python app.py
```

2. **配置你的后端**:
```env
VIDEO_PARSER_API_URL=http://localhost:5000/api/parse
VIDEO_PARSER_API_TYPE=custom
VIDEO_PARSER_API_KEY=  # 如果不需要鉴权，留空
```

3. **测试**:
```bash
curl -X POST http://localhost:5000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://v.douyin.com/xxxxx"}'
```

### 方案 B：集成到 Node.js（高级）

如果你想把 Python 服务集成到 Node.js，可以使用 `child_process` 或 `python-shell`:

```javascript
const { spawn } = require('child_process');

async function parseVideoWithUcmao(url) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['path/to/ucmao/parse.py', url]);
    let output = '';
    python.stdout.on('data', (data) => output += data);
    python.on('close', () => {
      try {
        resolve(JSON.parse(output));
      } catch (e) {
        reject(e);
      }
    });
  });
}
```

---

## 对比总结

| 方案 | 部署难度 | API 支持 | 推荐度 |
|------|---------|---------|--------|
| parse-ucmao-backend | ⭐⭐ 简单 | ✅ 完整 | ⭐⭐⭐⭐⭐ |
| Net-Spider | ⭐⭐⭐ 中等 | ❌ 需封装 | ⭐⭐⭐ |
| MediaCrawler | ⭐⭐⭐⭐ 复杂 | ❌ 需封装 | ⭐⭐⭐ |

**结论**: 直接使用 **parse-ucmao-backend**，部署简单，API 完整，完美适配你的需求。
