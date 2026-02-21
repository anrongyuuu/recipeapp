# 🔍 空白页问题排查

## 立即检查（最重要）

### 1. 打开浏览器开发者工具

按 **F12** 或 **右键 → 检查**，然后：

**查看 Console 标签页：**
- 如果有红色错误，**复制完整的错误信息**
- 这是解决问题的关键！

**查看 Network 标签页：**
- 刷新页面（F5）
- 查看是否有文件加载失败（红色）
- 特别关注 `main.tsx` 和 `App.tsx`

### 2. 查看终端输出

运行 `npm run dev` 的终端窗口：
- 是否有错误信息？
- 是否显示 "VITE ready"？

## 快速测试方案

### 方案 A：测试简化版（不依赖 Tailwind）

临时修改 `src/main.tsx`：

```typescript
// 将这行：
import App from './App';

// 改为：
import App from './App.simple';
```

然后刷新浏览器。如果简化版能显示，说明问题在完整版 `App.tsx`。

### 方案 B：检查 Tailwind CSS

如果简化版能显示，但完整版不行，可能是 Tailwind CSS 问题：

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

然后重启开发服务器：
```bash
npm run dev
```

## 常见原因

### 1. JavaScript 运行时错误
- **检查**：浏览器控制台（F12）
- **解决**：根据错误信息修复代码

### 2. CSS 未加载
- **检查**：Network 标签页，查看 `index.css` 是否加载
- **解决**：确认 Tailwind CSS 配置正确

### 3. 模块导入错误
- **检查**：控制台是否有 "Cannot find module" 错误
- **解决**：检查导入路径，确认文件存在

### 4. 依赖未安装
- **检查**：`node_modules` 目录是否存在
- **解决**：运行 `npm install`

## 需要的信息

如果以上方法都无法解决，请提供：

1. **浏览器控制台错误**（完整截图或复制文本）
2. **终端错误信息**（`npm run dev` 的输出）
3. **Network 标签页截图**（显示哪些请求失败）

## 临时解决方案

如果急需看到页面，可以：

1. 使用简化版 `App.simple.tsx`（已创建）
2. 或者创建一个最基础的 HTML 文件测试

```bash
# 创建测试 HTML
cd frontend
cat > test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>测试</title>
</head>
<body>
  <h1>如果你看到这个，说明服务器正常</h1>
  <p>问题在 React 应用</p>
</body>
</html>
EOF

# 然后用浏览器打开
open test.html
```
