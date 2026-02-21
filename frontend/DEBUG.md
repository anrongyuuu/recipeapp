# 🐛 空白页调试指南

## 快速诊断步骤

### 1. 检查浏览器控制台（最重要！）

按 **F12** 打开开发者工具，查看 **Console** 标签页：

- ❌ **如果有红色错误**：复制错误信息，这是关键线索
- ✅ **如果没有错误**：继续下一步

### 2. 检查网络请求

在开发者工具的 **Network** 标签页：
- 刷新页面（F5）
- 查看是否有失败的请求（红色）
- 确认 `main.tsx` 和 `App.tsx` 是否成功加载

### 3. 测试简化版

临时将 `main.tsx` 中的导入改为简化版：

```typescript
// 在 main.tsx 中，临时改为：
import App from './App.simple';  // 而不是 './App'
```

如果简化版能显示，说明问题在完整版 `App.tsx`。

### 4. 检查常见问题

#### 问题 A：Tailwind CSS 未编译

**症状**：页面空白，控制台可能有 CSS 相关错误

**解决**：
```bash
cd frontend
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### 问题 B：依赖未安装

**症状**：控制台显示 "Cannot find module"

**解决**：
```bash
cd frontend
npm install
```

#### 问题 C：TypeScript 编译错误

**症状**：终端显示 TypeScript 错误

**解决**：
```bash
cd frontend
npx tsc --noEmit
# 查看错误并修复
```

### 5. 检查终端输出

运行 `npm run dev` 时，终端应该显示：
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

如果有错误，终端会显示红色错误信息。

## 🔍 常见错误及解决方案

### 错误 1: "Cannot find module 'react'"
```bash
npm install
```

### 错误 2: "Failed to resolve import"
检查导入路径是否正确，文件是否存在

### 错误 3: "Unexpected token" 或语法错误
检查代码语法，特别是 JSX 语法

### 错误 4: Tailwind CSS 类名不生效
确认 `tailwind.config.js` 和 `postcss.config.js` 存在且正确

## 📋 检查清单

- [ ] 浏览器控制台没有红色错误
- [ ] Network 标签页显示资源加载成功
- [ ] 终端 `npm run dev` 没有错误
- [ ] `node_modules` 目录存在
- [ ] `src/main.tsx` 文件存在且正确
- [ ] `src/App.tsx` 文件存在且正确
- [ ] `src/index.css` 文件存在

## 💡 如果还是空白

请提供以下信息：

1. **浏览器控制台错误**（F12 → Console）
2. **终端错误信息**（运行 `npm run dev` 的输出）
3. **Network 标签页截图**（F12 → Network，刷新页面）

这样我可以更准确地帮你定位问题！
