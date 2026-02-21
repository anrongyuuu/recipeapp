# 所需 KEY 说明

## 你只需要 1 个 Key

| Key 名称 | 用途 | 当前状态 |
|----------|------|----------|
| **DASHSCOPE_API_KEY** | 通义千问 + 阿里云 ASR（录音文件识别）+ 每日灵感 | ✅ 已在 .env 中配置 |

**通义千问** 和 **阿里云 ASR（百炼 Paraformer）** 使用同一个 Key，都来自「阿里云百炼」控制台，不是两个不同的产品。

---

## 获取 / 核对 DASHSCOPE_API_KEY

1. 打开：https://bailian.console.aliyun.com/
2. 登录阿里云账号
3. 左侧进入 **「API-KEY 管理」**
4. 查看或新建 API Key（格式一般为 `sk-xxxxxxxx`）
5. 确认该 Key 已复制到 `backend/.env` 的 `DASHSCOPE_API_KEY=` 后面

---

## 若 ASR 转写仍报错，可能原因

### 1. Key 无效或已失效
- 在百炼控制台检查该 Key 是否被删除、禁用
- 可新建一个 Key 替换 .env 中的 `DASHSCOPE_API_KEY` 再试

### 2. 未开通录音文件识别或配额用尽
- 百炼控制台 → 模型服务 → 确认「录音文件识别」相关模型（如 Paraformer）已开通
- 查看「费用与账单」是否有余额、是否欠费

### 3. 音频 URL 不符合要求（很常见）
- ASR 要求：**公网可访问的 HTTP/HTTPS 音视频 URL**
- yt-dlp 拿到的 B 站/抖音等直链往往：
  - 带有时效或签名，过期后无法访问
  - 或仅限部分 CDN/地区访问，阿里云服务器拉取会失败
- 这种情况下接口会报「语音识别任务失败」，属于预期情况

**当前逻辑**：ASR 失败时会自动回退为「仅用视频标题 + 描述」调用通义千问生成菜谱，不影响整体流程。

---

## 其他已配置的 Key（与 ASR/通义无关）

| 配置项 | 用途 |
|--------|------|
| WECHAT_APPID / WECHAT_SECRET | 微信小程序登录 |
| MONGODB_URI | 数据库连接 |
| JWT_SECRET | 后端鉴权（可选） |
| VIDEO_PARSER_API_TYPE / YT_DLP_PATH | 视频解析（yt-dlp） |

---

## 总结

- **和阿里云/通义相关的，只需要一个 Key：`DASHSCOPE_API_KEY`**
- 已在 .env 里配置；若 ASR 仍报错，优先检查：Key 是否有效、是否开通 ASR、音频 URL 是否公网可访问
- 即使 ASR 失败，菜谱生成仍会通过「标题 + 描述」走通义千问完成
