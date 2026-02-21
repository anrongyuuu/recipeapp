# 安装本地 MongoDB（macOS）

## 快速安装步骤

### 1. 安装 Homebrew（如果还没有）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 安装 MongoDB

```bash
# 添加 MongoDB 仓库
brew tap mongodb/brew

# 安装 MongoDB Community Edition
brew install mongodb-community
```

### 3. 启动 MongoDB

```bash
# 启动 MongoDB 服务（开机自启）
brew services start mongodb-community

# 或者临时启动（关闭终端会停止）
mongod --config /opt/homebrew/etc/mongod.conf
```

### 4. 验证安装

```bash
# 连接到 MongoDB shell
mongosh

# 如果看到 MongoDB shell，说明成功！
# 输入 exit 退出
```

### 5. 测试后端连接

```bash
cd /Users/chloe/Desktop/recipeapp/backend
node test-connection.js
```

应该看到：`✅ MongoDB 连接成功!`

---

## 如果安装遇到问题

### 问题：brew 命令找不到
**解决**：先安装 Homebrew（见步骤 1）

### 问题：权限错误
**解决**：
```bash
sudo chown -R $(whoami) /opt/homebrew
```

### 问题：端口 27017 被占用
**解决**：
```bash
# 查看占用端口的进程
lsof -i :27017

# 停止占用端口的进程
kill -9 <PID>
```

---

## 启动后端服务

MongoDB 启动后，运行：

```bash
cd /Users/chloe/Desktop/recipeapp/backend
npm run dev
```

应该看到：
```
✅ MongoDB 连接成功: localhost
🚀 服务器运行在端口 3000
```
