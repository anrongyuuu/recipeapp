# MongoDB 快速解决方案

## 🎯 推荐方案：使用 MongoDB Atlas（云数据库，5分钟搞定）

### 步骤：

1. **访问 MongoDB Atlas**
   - 打开：https://www.mongodb.com/cloud/atlas/register
   - 注册账号（免费）

2. **创建免费集群**
   - 登录后点击 "Build a Database"
   - 选择 FREE (M0) 套餐
   - 选择云服务商和地区（推荐选择离你最近的）
   - 集群名称：`Cluster0`（默认即可）
   - 点击 "Create"

3. **创建数据库用户**
   - Username: `recipeapp`（或自定义）
   - Password: 生成一个强密码（**记住这个密码！**）
   - 点击 "Create Database User"

4. **配置网络访问**
   - 点击 "Network Access"
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere"（开发环境）
   - 或添加你的 IP 地址（生产环境推荐）
   - 点击 "Confirm"

5. **获取连接字符串**
   - 点击 "Database" → "Connect"
   - 选择 "Connect your application"
   - 复制连接字符串，格式类似：
     ```
     mongodb+srv://recipeapp:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **替换 `<password>` 为你刚才创建的密码**

6. **更新 .env 文件**
   ```env
   MONGODB_URI=mongodb+srv://recipeapp:你的密码@cluster0.xxxxx.mongodb.net/recipeapp?retryWrites=true&w=majority
   ```

7. **重启后端服务**
   ```bash
   npm run dev
   ```

---

## 方案二：本地安装 MongoDB（如果不想用云数据库）

### macOS 安装步骤：

1. **安装 Homebrew**（如果还没有）
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安装 MongoDB**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

3. **启动 MongoDB**
   ```bash
   brew services start mongodb-community
   ```

4. **验证**
   ```bash
   mongosh
   # 如果看到 MongoDB shell，说明成功
   # 输入 exit 退出
   ```

---

## 方案三：使用 Docker（如果已安装 Docker Desktop）

```bash
# 启动 MongoDB 容器
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 检查状态
docker ps | grep mongodb
```

---

## ⚡ 最快方案：MongoDB Atlas

**推荐使用 MongoDB Atlas**，因为：
- ✅ 5分钟就能搞定
- ✅ 完全免费（M0 套餐）
- ✅ 不需要本地安装
- ✅ 生产环境也能用
- ✅ 自动备份

**现在就去注册**：https://www.mongodb.com/cloud/atlas/register
