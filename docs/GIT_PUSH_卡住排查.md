# Git 推送卡住排查

## 常见原因与解决办法

### 1. HTTPS 在等密码（最常见）

GitHub 已不支持用「账号密码」推代码，必须用 **Personal Access Token (PAT)** 或 **SSH 密钥**。

**办法 A：用 Personal Access Token（推荐，不改远程地址）**

1. 打开：https://github.com/settings/tokens  
2. **Generate new token (classic)**，勾选 `repo`，生成后复制 token（只显示一次）
3. 终端里执行推送时，**密码处粘贴这个 token**（用户名照常填你的 GitHub 用户名）
4. 若希望以后不再输入，可保存到钥匙串：
   ```bash
   git config --global credential.helper osxkeychain
   ```
   下次推送再输入一次 token，之后会记住。

**办法 B：改用 SSH（一次配置，长期使用）**

1. 若还没有 SSH 公钥：
   ```bash
   ssh-keygen -t ed25519 -C "你的邮箱" -N "" -f ~/.ssh/id_ed25519
   cat ~/.ssh/id_ed25519.pub
   ```
   把输出的内容在 GitHub → Settings → SSH and GPG keys 里添加。

2. 把远程改成 SSH 再推送：
   ```bash
   cd /Users/chloe/Desktop/recipeapp
   git remote set-url origin git@github.com:anrongyuuu/recipeapp.git
   git push -u origin master:main
   ```

---

### 2. 看卡在哪一步（先诊断）

在项目目录执行（会打印详细过程，方便看卡在哪）：

```bash
cd /Users/chloe/Desktop/recipeapp
GIT_CURL_VERBOSE=1 GIT_TRACE=1 git push origin master:main
```

- 若一直停在 “Authenticating…” 或 “Authorization” → 按上面 **1** 用 PAT 或 SSH。
- 若停在 “Connecting to github.com…” → 多半是网络/代理/防火墙，见下面 **3**。

---

### 3. 网络/代理问题

- 若用了 VPN 或公司代理，先关掉试一次，或在本机/终端里配置 `http_proxy`/`https_proxy` 让 Git 走代理。
- 超时可以调大：
  ```bash
  git config --global http.lowSpeedLimit 0
  git config --global http.lowSpeedTime 999999
  ```

---

### 4. 用 GitHub 网页上传（临时绕过推送）

若暂时无法解决终端推送：

1. 打开 https://github.com/anrongyuuu/recipeapp  
2. 进入要更新的目录（如 `frontend/src`）  
3. 点击 **Add file** → **Upload files**，拖入你本地改过的文件并提交  

注意：这样不会更新 `.git` 历史，只适合临时补几份文件；长期还是建议修好 `git push`（用 PAT 或 SSH）。

---

## 推荐顺序

1. 先试 **1 办法 A**：用 PAT 在终端推送一次（密码处贴 token）。  
2. 若仍卡住，用 **2** 的 `GIT_CURL_VERBOSE=1 GIT_TRACE=1 git push` 看卡在哪一行。  
3. 需要一劳永逸时，用 **1 办法 B** 改成 SSH 再推送。
