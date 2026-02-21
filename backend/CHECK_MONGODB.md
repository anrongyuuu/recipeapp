# MongoDB Atlas 连接问题诊断

## 当前错误
`querySrv ECONNREFUSED` - DNS 查询失败，通常是网络访问权限问题

## ✅ 必须完成的检查清单

### 1. MongoDB Atlas 网络访问权限（最重要！）

**步骤：**
1. 登录 MongoDB Atlas：https://cloud.mongodb.com
2. 点击左侧菜单 **"Network Access"**（网络访问）
3. 查看 IP Access List
4. **如果没有条目，或没有 `0.0.0.0/0`**：
   - 点击 **"Add IP Address"** 按钮
   - 在弹出的对话框中：
     - IP Address: 输入 `0.0.0.0/0`
     - Comment: 输入 `Allow from anywhere`（可选）
   - 点击 **"Confirm"**
5. **等待 1-2 分钟**让配置生效

**重要：** 必须看到 IP Access List 中有 `0.0.0.0/0` 或你的 IP 地址

---

### 2. 数据库用户确认

1. 点击左侧 **"Database Access"**
2. 找到用户 `recipeapp`
3. 确认密码是：`q3TIAEK9NHpRBQSg`
4. 如果密码不对，点击用户右侧的 **"Edit"** 修改密码

---

### 3. 重新获取连接字符串

1. 点击左侧 **"Database"**
2. 点击 **"Connect"** 按钮
3. 选择 **"Connect your application"**
4. 复制连接字符串
5. 格式应该是：
   ```
   mongodb+srv://recipeapp:<password>@cluster0.splhlbn.mongodb.net/?retryWrites=true&w=majority
   ```
6. **替换 `<password>` 为：`q3TIAEK9NHpRBQSg`**
7. **在末尾添加数据库名**：`/recipeapp`
8. 最终格式：
   ```
   mongodb+srv://recipeapp:q3TIAEK9NHpRBQSg@cluster0.splhlbn.mongodb.net/recipeapp?retryWrites=true&w=majority
   ```

---

## 🔧 如果还是不行

### 临时方案：使用本地 MongoDB

如果 Atlas 配置有问题，可以先用本地 MongoDB：

```bash
# 1. 安装 MongoDB（如果还没安装）
brew tap mongodb/brew
brew install mongodb-community

# 2. 启动 MongoDB
brew services start mongodb-community

# 3. 验证
mongosh
# 看到 MongoDB shell 说明成功，输入 exit 退出

# 4. 修改 .env
MONGODB_URI=mongodb://localhost:27017/recipeapp
```

---

## 📝 测试连接

配置完成后，运行测试：

```bash
cd backend
node test-connection.js
```

如果看到 `✅ MongoDB 连接成功!`，说明配置正确。

---

## ⚠️ 常见问题

**Q: 我已经添加了 IP 地址，为什么还是不行？**
A: 等待 1-2 分钟让配置生效，然后重试

**Q: 密码包含特殊字符怎么办？**
A: 使用 URL 编码工具：https://www.urlencoder.org/
   - 输入密码
   - 复制编码后的结果
   - 替换连接字符串中的密码

**Q: 可以跳过 Atlas，直接用本地 MongoDB 吗？**
A: 可以！按照上面的"临时方案"操作即可
