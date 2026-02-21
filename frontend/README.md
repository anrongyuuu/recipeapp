# 菜谱生成器 - 前端应用

React + TypeScript + Vite + Tailwind CSS + Framer Motion

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量（可选）

创建 `.env` 文件（参考 `.env.example`）：

```bash
REACT_APP_API_URL=http://localhost:3000
```

如果不配置，默认使用 Vite 代理（`vite.config.ts` 中已配置）。

### 3. 启动开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 4. 确保后端服务运行

确保后端服务在 `http://localhost:3000` 运行：

```bash
cd ../backend
npm start
```

## 功能特性

- ✅ **视频解析**：粘贴视频链接，AI 自动生成菜谱
- ✅ **灵感浏览**：查看每日推荐菜谱
- ✅ **收藏管理**：收藏喜欢的菜谱
- ✅ **响应式设计**：移动端优先的 UI
- ✅ **流畅动画**：使用 Framer Motion 实现平滑过渡

## 技术栈

- **React 18**：UI 框架
- **TypeScript**：类型安全
- **Vite**：快速构建工具
- **Tailwind CSS**：实用优先的 CSS 框架
- **Framer Motion**：动画库
- **Lucide React**：图标库

## API 集成

前端通过 `src/services/api.ts` 与后端通信：

- `parseVideo(url)`：解析视频并生成菜谱
- `getInspirationList()`：获取灵感列表
- `getFavorites()`：获取收藏列表
- `addFavorite(recipeId)`：添加收藏
- `removeFavorite(recipeId)`：删除收藏

## 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

## 注意事项

1. **CORS**：开发环境使用 Vite 代理，生产环境需要配置后端 CORS
2. **微信登录**：生产环境需要配置真实的微信 code
3. **API URL**：生产环境需要配置正确的后端 API 地址
