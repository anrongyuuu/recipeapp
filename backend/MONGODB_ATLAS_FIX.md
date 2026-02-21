# MongoDB Atlas 连接问题修复

## 当前错误
`querySrv ECONNREFUSED` - 这通常表示网络连接或配置问题

## 解决步骤

### 1. 检查 MongoDB Atlas 配置

**重要：确保完成以下步骤**

#### A. 网络访问权限
1. 登录 MongoDB Atlas：https://cloud.mongodb.com
2. 点击左侧 **"Network Access"**
3. 点击 **"Add IP Address"**
4. 选择 **"Allow Access from Anywhere"** (0.0.0.0/0)
5. 点击 **"Confirm"**
6. **等待 1-2 分钟**让配置生效

#### B. 数据库用户密码
1. 点击左侧 **"Database Access"**
2. 找到用户 `recipeapp`
3. 如果密码包含特殊字符（如 `@`, `#`, `%`），需要 **URL 编码**：
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`
   - `/` → `%2F`
   - `:` → `%3A`

#### C. 获取正确的连接字符串
1. 点击左侧 **"Database"**
2. 点击 **"Connect"**
3. 选择 **"Connect your application"**
4. 复制连接字符串
5. **替换 `<password>` 为实际密码**（如果密码有特殊字符，先 URL 编码）

### 2. 更新 .env 文件

**正确的格式示例：**

```env
# 如果密码是：db_q3TIAEK9NHpRBQSg（无特殊字符）
MONGODB_URI=mongodb+srv://recipeapp:db_q3TIAEK9NHpRBQSg@cluster0.splhlbn.mongodb.net/recipeapp?retryWrites=true&w=majority

# 如果密码包含特殊字符，例如：pass@word#123
# 需要编码为：pass%40word%23123
MONGODB_URI=mongodb+srv://recipeapp:pass%40word%23123@cluster0.splhlbn.mongodb.net/recipeapp?retryWrites=true&w=majority
```

### 3. 测试连接

更新 `.env` 后，重启后端：

```bash
cd backend
npm run dev
```

应该看到：
```
✅ MongoDB 连接成功: cluster0-shard-00-xx.xxxxx.mongodb.net
🚀 服务器运行在端口 3000
```

---

## 常见问题

**Q: 密码中的特殊字符怎么处理？**
A: 使用 URL 编码工具：https://www.urlencoder.org/
- 输入你的密码
- 复制编码后的结果
- 替换连接字符串中的密码部分

**Q: 还是连接失败？**
A: 检查：
1. 网络访问权限是否配置（Allow Access from Anywhere）
2. 等待 1-2 分钟让配置生效
3. 密码是否正确（注意大小写）
4. 连接字符串格式是否正确

**Q: 可以临时使用本地 MongoDB 吗？**
A: 可以，但需要先安装：
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```
然后 `.env` 改为：
```env
MONGODB_URI=mongodb://localhost:27017/recipeapp
```
