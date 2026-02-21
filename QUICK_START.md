# 🚀 快速开始 - 全栈测试

## 一键启动

### 1. 启动后端（终端 1）

```bash
cd backend
npm start
```

等待看到：`✅ 启动完成，等待请求...`

### 2. 启动前端（终端 2）

```bash
cd frontend
npm install  # 首次运行
npm run dev
```

等待看到：`Local: http://localhost:5173/`

### 3. 打开浏览器

访问：**http://localhost:5173**

## 🧪 快速测试

### 测试视频解析

1. 在"探索"页面输入视频链接：
   ```
   https://www.bilibili.com/video/BV1Kf6FB5EuS/
   ```

2. 点击"开始生成菜谱"

3. 等待 1-2 分钟，查看生成的菜谱

### 测试其他功能

- **灵感**：切换到"灵感"标签，查看推荐菜谱
- **收藏**：在菜谱详情页点击 ❤️ 收藏，然后在"收藏"标签查看

## ⚠️ 常见问题

**前端无法连接后端？**
- 确认后端运行在 `http://localhost:3000`
- 检查浏览器控制台错误信息

**视频解析失败？**
- 查看后端终端日志
- 确认 `.env` 配置正确（OSS、ASR、通义千问）

**依赖安装失败？**
- 使用 `npm install --legacy-peer-deps`（如果遇到依赖冲突）

## 📚 详细文档

- 全栈测试指南：`FULL_STACK_TEST.md`
- 前端 README：`frontend/README.md`
- 后端 README：`backend/README.md`
