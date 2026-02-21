# 视频解析 API 配置指南

为了让用户能够**直接复制链接**即可解析视频并生成菜谱，你可以选择：

1. **开源方案（推荐）**: 使用 parse-ucmao-backend，完全免费，可自托管
2. **商业 API**: 使用第三方服务（如妖狐数据、Litchi 等）

## 🎯 推荐方案：parse-ucmao-backend（开源）

**优点**:
- ✅ 完全免费，MIT 许可证
- ✅ 可自托管，完全控制
- ✅ 支持抖音、快手、B站等 8+ 平台
- ✅ 返回视频直链，可用于 ASR 转写

**快速部署**:
```bash
# 1. 克隆项目
git clone https://github.com/ucmao/parse-ucmao-backend.git
cd parse-ucmao-backend

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动服务（默认 5000 端口）
python app.py
```

**配置你的后端**:
```env
VIDEO_PARSER_API_KEY=  # ucmao 不需要，留空即可
VIDEO_PARSER_API_URL=http://localhost:5000/api/parse
VIDEO_PARSER_API_TYPE=ucmao
```

详细部署指南见 `docs/OPEN_SOURCE_PARSER.md`

---

## 商业 API 方案（可选）

## 推荐的服务商

### 1. 妖狐数据 API（推荐）
- **官网**: https://api.yaohud.cn
- **特点**: 支持自动识别链接，支持抖音、B站、快手等主流平台
- **配置**:
```env
VIDEO_PARSER_API_KEY=your-yaohu-key
VIDEO_PARSER_API_URL=https://api.yaohud.cn/api/video/parse
VIDEO_PARSER_API_TYPE=yaohu
```

### 2. Litchi API
- **官网**: https://litchi-ai.com
- **特点**: 专业的短视频解析服务，稳定性较好
- **配置**:
```env
VIDEO_PARSER_API_KEY=your-litchi-key
VIDEO_PARSER_API_URL=https://api.litchi-ai.com/v1/parse
VIDEO_PARSER_API_TYPE=litchi
```

### 3. 自定义 API
如果你的解析 API 使用标准格式：
```json
POST /video/parse
Body: { "url": "...", "api_key": "..." }
Response: {
  "title": "...",
  "description": "...",
  "media_url": "https://...",  // 视频直链（用于 ASR）
  "thumbnail": "https://..."
}
```

配置：
```env
VIDEO_PARSER_API_KEY=your-api-key
VIDEO_PARSER_API_URL=https://your-api.com/video/parse
VIDEO_PARSER_API_TYPE=custom
```

## 工作流程

1. **用户粘贴链接** → 小程序前端发送到后端
2. **后端调用解析 API** → 获取视频标题、描述、**视频直链（mediaUrl）**
3. **如果有 mediaUrl** → 调用阿里云 ASR 转写视频旁白 → 得到文本
4. **通义千问生成菜谱** → 基于转写文本（或标题+描述）生成结构化菜谱

## 重要说明

### 视频直链（mediaUrl）的作用

- **有 mediaUrl**: 可以调用阿里云 ASR 转写视频旁白，生成更准确的菜谱
- **无 mediaUrl**: 仅根据视频标题和描述生成菜谱（准确度较低）

### 解析 API 返回格式要求

解析 API 需要返回以下字段之一作为视频直链：
- `media_url`
- `video_url`
- `video_direct_url`
- `nwm_video_url`（无水印视频）
- `play_url`

**必须是可公网访问的 HTTP/HTTPS URL**，用于阿里云 ASR 服务下载和转写。

### 未配置解析 API 的情况

如果未配置 `VIDEO_PARSER_API_KEY` 和 `VIDEO_PARSER_API_URL`：
- 系统会回退到基础解析（仅从页面 HTML 提取标题和描述）
- **无法获取视频直链**，因此无法使用 ASR 转写
- 仅根据标题和描述生成菜谱（准确度较低）

## 成本说明

- **解析 API**: 按调用次数或包月计费（具体看服务商）
- **阿里云 ASR**: 按音频时长计费（有 mediaUrl 时才产生费用）
- **通义千问**: 按 Token 计费（每次生成菜谱都会调用）

## 测试

配置完成后，可以通过以下方式测试：

```bash
# 测试视频解析
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -H "x-wechat-code: test-code" \
  -d '{"url": "https://v.douyin.com/xxxxx"}'
```

检查返回结果中是否有 `mediaUrl` 字段。
