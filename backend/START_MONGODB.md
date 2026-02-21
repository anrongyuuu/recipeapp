# 启动 MongoDB 指南

## 问题：MongoDB 连接失败

错误信息：`connect ECONNREFUSED 127.0.0.1:27017`

这说明 MongoDB 服务没有运行。请选择以下方式之一启动：

---

## 方式一：使用 Homebrew（推荐 macOS）

### 1. 检查是否已安装 MongoDB
```bash
brew list mongodb-community
```

### 2. 如果未安装，先安装
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### 3. 启动 MongoDB
```bash
brew services start mongodb-community
```

### 4. 验证是否启动成功
```bash
mongosh
# 如果看到 MongoDB shell，说明启动成功
# 输入 exit 退出
```

---

## 方式二：使用 Docker（最简单）

### 1. 启动 MongoDB 容器
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. 检查容器状态
```bash
docker ps | grep mongodb
```

### 3. 如果需要停止
```bash
docker stop mongodb
```

### 4. 如果需要重启
```bash
docker start mongodb
```

---

## 方式三：使用 MongoDB Atlas（云数据库，推荐生产环境）

### 1. 访问 https://www.mongodb.com/cloud/atlas
### 2. 注册账号并创建免费集群
### 3. 获取连接字符串
### 4. 更新 `.env` 文件：
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipeapp
```

---

## 验证 MongoDB 是否运行

启动后，重新运行后端服务：
```bash
cd backend
npm run dev
```

如果看到：
```
✅ MongoDB 连接成功: localhost
🚀 服务器运行在端口 3000
```

说明 MongoDB 连接成功！

---

## 常见问题

**Q: brew 命令找不到？**
A: 需要先安装 Homebrew：https://brew.sh

**Q: Docker 命令找不到？**
A: 需要先安装 Docker Desktop：https://www.docker.com/products/docker-desktop

**Q: 端口 27017 被占用？**
A: 检查是否有其他 MongoDB 实例在运行，或使用其他端口
