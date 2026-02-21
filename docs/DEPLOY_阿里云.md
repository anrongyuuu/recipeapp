# 阿里云全量部署指南（前后端一体）

从购买 ECS 到发链接给朋友，全部在阿里云完成。部署后国内可直接打开。

---

## 一、购买与准备

### 1.1 购买 ECS

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com)，**创建实例**。
2. **地域**：选国内（如华东1 杭州），朋友国内访问才快。
3. **镜像**：选 **Alibaba Cloud Linux 3** 或 **Ubuntu 22.04**。
4. **规格**：个人/朋友玩选 **2 核 2 GiB** 或 **1 核 2 GiB** 即可；学生有优惠。
5. **存储**：系统盘 40GB 够用。
6. **网络**：分配公网 IP（按量或包年包月随选）。
7. **安全组**：新建安全组，**入方向**放行：
   - 22（SSH）
   - 80（HTTP，用 Nginx 时）
   - 443（HTTPS，用 Nginx + 域名时）
   - 3000（应用端口，不用 Nginx 时可直接用 `http://公网IP:3000`）

创建完成后记下 **公网 IP** 和 **root 密码**（或密钥）。

### 1.2 连接服务器

```bash
ssh root@你的公网IP
# 或使用密钥：ssh -i 你的密钥.pem root@你的公网IP
```

---

## 二、安装运行环境

以下以 **Alibaba Cloud Linux 3 / CentOS 系**为例；若是 Ubuntu，把 `yum` 换成 `apt` 即可。

### 2.1 安装 Node.js 20

```bash
# 使用 NodeSource 或 阿里云镜像
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs
# 验证
node -v   # v20.x.x
npm -v
```

### 2.2 安装 MongoDB（二选一）

**方式 A：本机安装 MongoDB（简单）**

```bash
# 阿里云 / CentOS 示例（以官方文档为准）
cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
yum install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

本机连接串：`mongodb://localhost:27017/recipeapp`。

**方式 B：使用阿里云云数据库 MongoDB 版**

- 在阿里云控制台开通 **云数据库 MongoDB 版**，创建实例，拿到 **连接地址**（内网/公网）。
- 将 `MONGODB_URI` 设为该地址，例如：`mongodb://用户名:密码@dds-xxx.mongodb.rds.aliyuncs.com:3717/recipeapp`。

### 2.3 安装 Git、PM2

```bash
yum install -y git
npm install -g pm2
```

### 2.4（可选）安装 Nginx（用域名 + 80/443 时）

```bash
yum install -y nginx
systemctl enable nginx
# 配置见下文「六、Nginx 反代」
```

### 2.5（可选）视频解析用 yt-dlp + ffmpeg

若需要「根据视频内容生成菜谱」且使用 `VIDEO_PARSER_API_TYPE=ytdlp`：

```bash
# 需 EPEL 等源，或从官方文档安装
yum install -y ffmpeg
# yt-dlp 用 pip 或官方脚本
pip3 install yt-dlp
# 或
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp
```

---

## 三、部署应用

### 3.1 克隆仓库

```bash
cd /opt
git clone https://github.com/anrongyuuu/recipeapp.git
cd recipeapp
```

若仓库私有，需配置 SSH 密钥或 Personal Access Token。

### 3.2 构建前端

```bash
cd /opt/recipeapp/frontend
npm ci
npm run build
```

产物在 `frontend/dist`。后端生产环境会托管该目录。

### 3.3 安装后端依赖

```bash
cd /opt/recipeapp/backend
npm install --production
```

### 3.4 配置环境变量

在 **backend** 目录创建 `.env`（不要提交到 Git）：

```bash
cd /opt/recipeapp/backend
vim .env
```

**必填**（最少能让应用跑起来）：

```env
NODE_ENV=production
PORT=3000

# 数据库（本机 MongoDB 或云数据库地址）
MONGODB_URI=mongodb://localhost:27017/recipeapp

# 通义千问（菜谱生成、每日灵感）
DASHSCOPE_API_KEY=你的通义千问API Key
```

**可选**（按需填写）：

```env
# JWT（建议生产环境设一个随机字符串）
JWT_SECRET=随机长字符串

# 微信小程序（仅小程序需要；Web 端可沿用 test-code 逻辑或做游客）
# WECHAT_APPID=
# WECHAT_SECRET=

# 模型
# QWEN_MODEL=qwen3.5-plus

# 视频解析：自定义 API / 妖狐 / yt-dlp 等
# VIDEO_PARSER_API_TYPE=ytdlp
# VIDEO_PARSER_API_URL=...
# 若用 yt-dlp，需配置 OSS 或仅用标题生成
# OSS_REGION=oss-cn-hangzhou
# OSS_BUCKET=xxx
# OSS_ACCESS_KEY_ID=xxx
# OSS_ACCESS_KEY_SECRET=xxx
```

保存后确认路径：`/opt/recipeapp/backend/.env`。

---

## 四、使用 PM2 启动

```bash
cd /opt/recipeapp/backend
pm2 start server.js --name recipeapp
pm2 save
pm2 startup   # 按提示执行生成的命令，实现开机自启
```

查看状态：`pm2 status`；日志：`pm2 logs recipeapp`。

---

## 五、验证访问

- **未配 Nginx**：浏览器打开 `http://你的公网IP:3000`，应看到前端页面。
- **已配 Nginx**：打开 `http://你的公网IP`（80 端口）或 `http://你的域名`。

若打不开，检查：安全组是否放行 3000（或 80）；`pm2 status` 是否 running；`pm2 logs` 是否有报错（如 MongoDB 连不上、DASHSCOPE_API_KEY 未设等）。

---

## 六、Nginx 反代（可选，用 80/443 或域名时）

若希望用 80/443 或域名访问，用 Nginx 把请求转到本机 3000 端口。

```bash
# 创建配置
vim /etc/nginx/conf.d/recipeapp.conf
```

内容示例（**用 IP 访问**）：

```nginx
server {
    listen 80;
    server_name 你的公网IP;   # 或改成域名，如 recipe.yourdomain.com
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

若用 **域名**，且已备案，可再加 443（需证书，可用阿里云免费证书或 Let's Encrypt）：

```nginx
server {
    listen 443 ssl;
    server_name recipe.yourdomain.com;
    ssl_certificate     /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

然后：

```bash
nginx -t
systemctl reload nginx
```

---

## 七、域名与备案

- **只用 IP 访问**：无需备案，发 `http://公网IP:3000` 或 `http://公网IP`（Nginx 80）即可。
- **用域名访问**：需在阿里云做 **ICP 备案**（免费，约 1–2 周）。备案通过后，在域名解析里把域名 A 记录指到 ECS 公网 IP，再用 Nginx 配置该域名即可。

---

## 八、后续更新代码

```bash
cd /opt/recipeapp
git pull
cd frontend && npm ci && npm run build
cd ../backend && npm install --production
pm2 restart recipeapp
```

---

## 九、环境变量速查

| 变量 | 必填 | 说明 |
|------|------|------|
| `NODE_ENV` | 是 | 生产填 `production` |
| `PORT` | 否 | 默认 3000 |
| `MONGODB_URI` | 是 | MongoDB 连接串 |
| `DASHSCOPE_API_KEY` | 是 | 通义千问 API Key |
| `JWT_SECRET` | 建议 | 生产环境建议设 |
| `WECHAT_APPID` / `WECHAT_SECRET` | 否 | 仅小程序需要 |
| `VIDEO_PARSER_API_TYPE` / `*_URL` / `*_KEY` | 否 | 视频解析方式 |
| `OSS_*` | 否 | 与 yt-dlp 配合时用 |

---

## 十、前端 build 报错（10 个 TS 错误）时

若在服务器上执行 `npm run build` 出现 `'React' is declared but never read`、`Property '_id' does not exist`、`Property 'env' does not exist on type 'ImportMeta'` 等 10 个错误，多半是服务器上的代码还没拉到最新修复。可以二选一：

**方式 A：在服务器上跑修复脚本（不依赖 git）**

在项目根目录执行（脚本会改 `frontend/src` 下的文件并创建 `vite-env.d.ts`）：

```bash
cd /opt/recipeapp
bash docs/fix-frontend-build-on-server.sh
cd frontend && npm run build
```

**方式 B：用最新代码重新拉取**

若你本机已推送过修复（例如 `aliyun-deploy` 分支），在服务器上：

```bash
cd /opt/recipeapp
git fetch origin aliyun-deploy
git checkout aliyun-deploy
cd frontend && npm ci && npm run build
```

---

按以上步骤完成后，把 **访问地址**（`http://公网IP:3000` 或 `http://你的域名`）发给朋友，国内即可直接打开使用。
