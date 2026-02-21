# API 测试指南

## ✅ 服务状态

后端服务已成功启动：
- ✅ MongoDB Atlas 连接成功
- ✅ 服务器运行在端口 3000
- ✅ 所有配置已完成

---

## 🧪 测试 API 接口

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

**预期返回：**
```json
{"status":"ok","timestamp":"2026-02-19T..."}
```

---

### 2. 测试视频解析（生成菜谱）⭐

这是核心功能测试！

```bash
curl -X POST http://localhost:3000/api/video/parse \
  -H "Content-Type: application/json" \
  -H "x-wechat-code: test-code" \
  -d '{"url": "https://v.douyin.com/xxxxx"}'
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "菜谱标题 🍳",
    "description": "...",
    "ingredients": ["..."],
    "steps": ["..."],
    ...
  }
}
```

**注意：**
- 如果没有配置视频解析 API，会使用基础解析（仅标题+描述）
- 如果有配置，会调用 ASR 转写 + 通义千问生成

---

### 3. 测试每日灵感

```bash
# 手动触发每日灵感更新
curl -X POST http://localhost:3000/api/inspiration/refresh

# 获取今日灵感
curl http://localhost:3000/api/inspiration/daily
```

---

### 4. 测试灵感列表

```bash
curl http://localhost:3000/api/inspiration/list
```

---

### 5. 测试搜索菜谱

```bash
curl "http://localhost:3000/api/recipe/search?keyword=番茄"
```

---

## 📱 小程序前端集成

### 在小程序中调用 API

```javascript
// 1. 获取微信登录 code
wx.login({
  success: (res) => {
    const code = res.code;
    
    // 2. 调用视频解析 API
    wx.request({
      url: 'http://localhost:3000/api/video/parse',  // 生产环境改为你的域名
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'x-wechat-code': code
      },
      data: {
        url: 'https://v.douyin.com/xxxxx'  // 用户粘贴的视频链接
      },
      success: (res) => {
        console.log('生成的菜谱:', res.data);
        // 显示菜谱详情
      },
      fail: (err) => {
        console.error('请求失败:', err);
      }
    });
  }
});
```

---

## 🎯 下一步

1. ✅ **后端已就绪** - 所有配置完成
2. 🔄 **测试 API** - 使用上面的 curl 命令测试
3. 📱 **前端集成** - 在小程序中调用 API
4. 🚀 **部署上线** - 配置生产环境域名和 HTTPS

---

## ⚠️ 注意事项

### 开发环境
- 后端运行在 `localhost:3000`
- 小程序需要配置服务器域名白名单

### 生产环境
- 需要配置 HTTPS（微信小程序要求）
- 需要在微信公众平台配置服务器域名
- 建议使用 PM2 管理 Node.js 进程

---

## 🐛 常见问题

**Q: 视频解析返回空数据？**
A: 检查是否配置了 `VIDEO_PARSER_API_URL`，未配置时只能获取标题和描述

**Q: 通义千问生成失败？**
A: 检查 `DASHSCOPE_API_KEY` 是否正确，查看控制台错误日志

**Q: 微信登录失败？**
A: 检查 `WECHAT_APPID` 和 `WECHAT_SECRET` 是否正确
