# 发链接给朋友玩 — 部署方案

目标：让朋友通过一个链接就能打开并玩起来，暂时不商用。除了 GitHub Pages，可以用下面几种方式。

---

## 国内网络能直接打开吗？要付费吗？

| 平台 | 国内直接打开 | 付费情况 |
|------|----------------|----------|
| **Railway** | ❌ **不能**。Railway 在国外，国内访问其域名常被墙或极慢，需 VPN。 | 新用户约 $5 试用额度，之后 Hobby 约 $5/月起，按用量计费。 |
| **Render** | ❌ 国外服务，国内访问不稳定，可能很慢或被墙。 | 有免费档，有限制；付费按用量。 |
| **Vercel / GitHub Pages** | ⚠️ 有时能打开有时慢或被墙，不保证国内稳定。 | Vercel、GitHub Pages 有免费额度。 |
| **国内云（阿里云 / 腾讯云等）** | ✅ **可以**。服务器在国内，备案后稳定访问。 | 需付费（学生机或按量很便宜），备案免费但需流程。 |

**结论：若必须「国内环境直接可以打开」，不要用 Railway/Render，改用国内云（阿里云、腾讯云等）部署；或仅前端用 Gitee Pages（国内可访问），后端需自备国内服务器。**

下面先写 **国内可访问方案**，再写海外方案（Railway 等）。

---

## 国内可访问方案（推荐：阿里云 / 腾讯云 一体部署）

要求朋友在国内直接打开、无需科学上网时，用 **国内云服务器** 做一体部署最稳。

### 思路

- 买一台 **国内 ECS**（阿里云 / 腾讯云 / 华为云），学生机或按量付费都很便宜。
- 在服务器上：装 Node、MongoDB（或用云数据库），把本仓库 clone 下去，构建 frontend，用 backend 起服务（生产环境会托管前端），用 Nginx 反代或直接开端口。
- 若用 **域名**，需在云厂商做 **ICP 备案**（免费，约 1–2 周）；备案前可以先用 **IP:端口** 或厂商给的临时域名给朋友访问。

### 详细步骤

**完整步骤见：[docs/DEPLOY_阿里云.md](DEPLOY_阿里云.md)**（从购买 ECS、安全组、Node/MongoDB、构建、.env、pm2、Nginx 到域名备案）。

简要流程：

1. 购买一台 ECS（国内地域），安全组放行 22、80、443、3000。
2. 安装 Node 20、MongoDB（本机或云数据库）、Git、pm2。
3. 克隆仓库 → `frontend` 下 `npm ci && npm run build` → `backend` 下 `npm install --production`。
4. 在 `backend` 下配置 `.env`（必填：`NODE_ENV=production`、`MONGODB_URI`、`DASHSCOPE_API_KEY`）。
5. `pm2 start server.js --name recipeapp`，`pm2 save`，`pm2 startup`。
6. 朋友访问：`http://你的公网IP:3000`；若配了 Nginx，可用 80 或域名（域名需备案）。

这样 **国内直接打开**；只有云服务器和可选域名的费用。

---

## 方案对比（简要）

| 方案 | 难度 | 国内直接打开 | 说明 |
|------|------|----------------|------|
| **国内云一体部署（阿里云/腾讯云）** | ⭐⭐⭐ | ✅ 可以 | 一个链接，国内稳定，需备案（用域名时） |
| **A. Railway / Render 一体** | ⭐⭐ | ❌ 不能 | 国外服务，国内需 VPN |
| **B. Vercel + Railway** | ⭐⭐⭐ | ❌ 不能 | 同上 |
| **C. GitHub Pages 前端** | ⭐⭐ | ⚠️ 不稳定 | 仅前端，后端需另部署 |

下面 **方案 A** 适合海外或能科学上网的朋友；**国内朋友直接打开请用上面国内云方案**。

---

## 方案 A：一体部署到 Railway（仅适合海外或能科学上网）

前后端在一起：后端同时提供 API 和前端页面，部署一次得到一个链接。**国内网络通常无法直接打开 Railway 链接**，适合海外或使用 VPN 的朋友。

### 1. 前置准备

- 代码里已做好：**生产环境**下后端会托管 `frontend/dist`，且 CORS 已放宽；前端未设置 `VITE_API_URL` 时自动用同源（和 backend 同域名）。
- 本地先试一遍生产构建 + 同机访问：
  ```bash
  cd frontend && npm ci && npm run build && cd ..
  cd backend && NODE_ENV=production npm start
  ```
  浏览器打开 `http://localhost:3000`，能正常用即可。

### 2. 在 Railway 部署

1. 打开 [railway.app](https://railway.app)，用 GitHub 登录，**New Project** → **Deploy from GitHub repo**，选 `anrongyuuu/recipeapp`。
2. **根目录**保持为仓库根（不要选 `backend`）。
3. **Build Command**（在 Settings → Build）：
   ```bash
   cd frontend && npm ci && npm run build && cd ../backend && npm install
   ```
4. **Start Command**（或 Start / Run）：
   ```bash
   cd backend && npm start
   ```
5. **环境变量**（Settings → Variables）至少设：
   - `NODE_ENV=production`
   - `PORT`（Railway 一般自动注入，可不设）
   - MongoDB：`MONGODB_URI`
   - 通义千问：`DASHSCOPE_API_KEY`
   - 其他按你本地 `.env`（如微信、OSS 等，可选）。
6. 部署完成后，Railway 会给你一个地址，例如 `https://recipeapp-production-xxx.up.railway.app`，**这一个链接**发给朋友即可。

### 3. 说明

- 后端需 **yt-dlp / ffmpeg** 时，Railway 当前不一定带这些，视频解析可能受限；若只玩「灵感 + 收藏」等不依赖本地下载的功能，一般没问题。
- 若改用 **Render**：思路相同，根目录选仓库根，Build 里先构建 frontend 再装 backend 依赖，Start 里 `cd backend && npm start`，并设 `NODE_ENV=production` 和 MongoDB 等环境变量。

---

## 方案 B：前端 Vercel + 后端 Railway（两个服务，只发一个链接）

- **前端**：在 [vercel.com](https://vercel.com) 导入同一 GitHub 仓库，根目录选 `frontend`，构建命令用默认 `npm run build` 即可；**不要**设 `VITE_BASE_URL`（或设为 `/`）。
- **后端**：按上面方案 A 把后端（或一体）部署到 Railway，得到后端地址，例如 `https://recipeapp-api.railway.app`。
- 在 Vercel 项目里配置 **Environment Variable**：`VITE_API_URL=https://recipeapp-api.railway.app`（换成你的后端地址），重新部署。
- 本仓库后端已在生产环境放宽 CORS，所以 Vercel 域名访问没问题。
- 发给朋友的链接用 **Vercel 的前端地址**即可，例如 `https://recipeapp.vercel.app`。

---

## 方案 C：仅前端（GitHub Pages / Vercel）

- **GitHub Pages**：按仓库里已有文档操作；需注意 Token 要有 `workflow` 权限，或改用网页上传 workflow 文件。
- **仅前端**意味着没有你自己的后端在线时，朋友打开链接只能看到界面，接口会报错或连不上。若后端暂时不部署，可当「静态演示」用；要真正可玩，仍需配合方案 A 或 B 把后端上线。

---

## 小结

- **国内朋友要直接打开**：用 **国内云（阿里云/腾讯云）一体部署**，见上文「国内可访问方案」；不用 Railway/Vercel。
- **朋友在海外或能科学上网**：用 **方案 A（Railway 一体）** 或方案 B（Vercel + Railway），一个链接即可。
- **仅前端、国内能打开**：可把前端部署到 **Gitee Pages**（码云），国内访问较稳；后端需自己用国内服务器部署并配 `VITE_API_URL`。
- 当前代码已支持：生产环境同源访问（不设 `VITE_API_URL`）、CORS 放宽、后端托管前端静态文件。
