# 🔧 故障排查指南

## 无法打开网页的常见原因

### 1. 前端服务未启动

**症状**：浏览器显示"无法访问此网站"或"连接被拒绝"

**解决方法**：
```bash
cd frontend
npm install  # 如果 node_modules 不存在
npm run dev
```

**预期输出**：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 2. 依赖未安装

**症状**：运行 `npm run dev` 时报错 "Cannot find module"

**解决方法**：
```bash
cd frontend
npm install
# 如果失败，尝试：
npm install --legacy-peer-deps
```

### 3. 端口被占用

**症状**：启动时报错 "Port 5173 is already in use"

**解决方法**：
```bash
# 查找占用端口的进程
lsof -ti:5173

# 杀死进程（替换 PID）
kill -9 <PID>

# 或者使用其他端口
npm run dev -- --port 5174
```

### 4. 后端服务未启动

**症状**：前端能打开，但 API 请求失败

**解决方法**：
```bash
cd backend
npm start
```

**预期输出**：
```
✅ MongoDB 连接成功
🚀 服务器运行在端口 3000
✅ 启动完成，等待请求...
```

### 5. CORS 错误

**症状**：浏览器控制台显示 CORS 错误

**解决方法**：
- 确认后端 `server.js` 中的 CORS 配置包含 `localhost:5173`
- 确认后端服务正在运行

### 6. TypeScript 编译错误

**症状**：启动时报 TypeScript 错误

**解决方法**：
```bash
cd frontend
# 检查 TypeScript 配置
npx tsc --noEmit

# 如果错误太多，可以临时跳过类型检查
# 修改 vite.config.ts，添加：
# build: { rollupOptions: { ... } }
```

## 🔍 快速诊断步骤

### 步骤 1：检查前端文件
```bash
cd frontend
ls -la src/
# 应该看到：App.tsx, main.tsx, index.css, services/
```

### 步骤 2：检查依赖
```bash
cd frontend
ls -la node_modules/
# 如果不存在，运行 npm install
```

### 步骤 3：检查端口
```bash
# 检查 5173 端口是否被占用
lsof -ti:5173

# 检查 3000 端口（后端）
lsof -ti:3000
```

### 步骤 4：查看错误日志
```bash
# 前端错误
cd frontend
npm run dev
# 查看终端输出的错误信息

# 后端错误
cd backend
npm start
# 查看终端输出的错误信息
```

## 🚀 一键启动脚本

### 方法 1：使用启动脚本
```bash
cd frontend
chmod +x start.sh
./start.sh
```

### 方法 2：手动启动
```bash
# 终端 1：启动后端
cd backend
npm start

# 终端 2：启动前端
cd frontend
npm install  # 首次运行
npm run dev
```

## 📱 浏览器访问

启动成功后，在浏览器访问：
- **前端**：http://localhost:5173
- **后端 API**：http://localhost:3000/health

## ⚠️ 常见错误信息

### "Cannot find module 'react'"
→ 运行 `npm install`

### "Port 5173 is already in use"
→ 端口被占用，杀死进程或使用其他端口

### "Failed to fetch" 或 "Network Error"
→ 后端服务未启动，或 CORS 配置问题

### "ERR_CONNECTION_REFUSED"
→ 服务未启动，检查终端是否有错误

## 💡 需要帮助？

如果以上方法都无法解决，请提供：
1. 终端错误信息（完整输出）
2. 浏览器控制台错误（F12 → Console）
3. 运行的具体命令
