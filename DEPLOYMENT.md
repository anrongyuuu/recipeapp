# Recipe App 部署为 Web App 指南

本文档说明如何将菜谱应用部署为可在浏览器访问的 Web 应用。

---

## 架构概览

```
┌─────────────────────┐       ┌─────────────────────┐
│  前端 (React/Vite)   │ ───▶  │  后端 (Node/Express) │
│  静态托管 / CDN      │       │  yt-dlp + ffmpeg     │
└─────────────────────┘       └─────────────────────┘
         │                                │
         └────────────────┬───────────────┘
                          ▼
              MongoDB / 阿里云 OSS / 通义千问 / ASR
```

---

## 部署前需要完成的改动

### 1. 认证：支持 Web 端免登录（或游客模式）

当前后端使用 **微信登录**（`x-wechat-code`），Web 端没有微信 code。可选用以下方案之一：

| 方案 | 做法 | 适用场景 |
|------|------|----------|
| **游客模式** | 后端在 `x-wechat-code` 为空时使用固定游客 ID | 快速上线、演示 |
| **Web Token** | 增加邮箱/匿名登录，返回 JWT | 需要用户体系 |
| **混合** | 微信小程序用 wechatAuth，Web 用 token/游客 | 多端共用 |

### 2. CORS：允许部署后的前端域名

`backend/server.js` 当前只允许 `localhost` 和 `servicewechat.com`，需要加入你的前端域名，例如：

- `https://your-app.vercel.app`
- `https://your-domain.com`

### 3. 前端 API 地址

构建时设置 `VITE_API_URL` 指向后端地址，例如 `https://api.your-domain.com`。

---

## 推荐部署方案

### 方案 A：Railway / Render（推荐，支持 yt-dlp + ffmpeg）

后端需要 **yt-dlp** 和 **ffmpeg**，Railway / Render 支持 Docker，可一次性部署后端。

**步骤：**

1. 在项目根目录创建 `Dockerfile` 和 `docker-compose.yml`（或 `.dockerignore`）
2. 在 Railway / Render 创建 Node 项目，连接 GitHub
3. 配置环境变量（MongoDB、阿里云、通义千问等）
4. 前端单独部署到 Vercel / Netlify，设置 `VITE_API_URL`

### 方案 B：阿里云 ECS + 宝塔 / 手动部署

- 适合国内用户，延迟低
- 在 ECS 上安装 Node、Python（yt-dlp）、ffmpeg
- 使用 Nginx 反向代理前后端
- 前端用对象存储 + CDN 或同机 Nginx 静态托管

### 方案 C：前后端一体（Express 托管前端静态文件）

- 将 `frontend` 构建结果放到 `backend/public`
- 生产环境由 Express 同时提供 API 和静态文件
- 部署一个服务即可，适合单机部署

---

## 快速上手：方案 C 一体部署

若要快速上线，可按「前后端一体」方式部署：

1. **修改 server.js**：生产环境下托管 `frontend/dist`
2. **修改 CORS**：允许你的域名，或允许所有（仅限测试）
3. **修改认证**：Web 端使用游客 ID（`x-wechat-code` 为空时）
4. **构建**：`cd frontend && npm run build`，产物复制到 `backend/public`
5. **部署**：将 `backend` 部署到任意支持 Node 的平台

需要我根据你当前仓库结构，写出具体的修改步骤和示例配置吗？
