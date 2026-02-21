const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '.env');
const envPathCwd = path.resolve(process.cwd(), '.env');
const envToLoad = fs.existsSync(envPath) ? envPath : (fs.existsSync(envPathCwd) ? envPathCwd : envPath);
require('dotenv').config({ path: envToLoad, override: true });
// 备用：若 dotenv 未解析到 OSS_ 变量（如编码问题），则从 .env 文件手动解析并注入
if (!process.env.OSS_REGION && fs.existsSync(envToLoad)) {
  const raw = fs.readFileSync(envToLoad, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^OSS_([A-Z_]+)\s*=\s*(.*)$/);
    if (m) process.env['OSS_' + m[1]] = (m[2] || '').replace(/^["']|["']$/g, '').trim();
  });
}
if (process.env.NODE_ENV !== 'production') {
  console.log('📄 .env 路径:', envToLoad, '| 文件存在:', fs.existsSync(envToLoad));
}

const connectDB = require('./config/database');
const videoRoutes = require('./routes/video');
const recipeRoutes = require('./routes/recipe');
const favoriteRoutes = require('./routes/favorite');
const authRoutes = require('./routes/auth');
const inspirationRoutes = require('./routes/inspiration');
const { runDailyInspiration } = require('./jobs/dailyInspiration');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 安全中间件
app.use(helmet());

// CORS 配置：生产环境放宽（方便发链接给朋友玩）；开发仅允许 localhost + 微信
app.use(cors({
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);
      return;
    }
    if (!origin || origin.includes('servicewechat.com') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 请求体解析
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/inspiration', inspirationRoutes);

// 生产环境：托管前端静态文件（一体部署，一个链接即可用）
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }
}

// 每日 6:00 更新灵感（需配置 DASHSCOPE_API_KEY）
cron.schedule('0 6 * * *', () => runDailyInspiration(), { timezone: 'Asia/Shanghai' });

// 404 处理（仅 API；静态与 SPA 已在上面处理）
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 环境: ${process.env.NODE_ENV || 'development'}`);
  // 调试：确认 .env 是否加载（不打印敏感值）
  const ossVars = ['OSS_REGION', 'OSS_BUCKET', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET'];
  const ossLoaded = ossVars.map(k => `${k}=${process.env[k] ? '已设置' : '未设置'}`).join(', ');
  console.log('🔧 OSS 环境变量:', ossLoaded);
  const ossHelper = require('./services/ossHelper');
  if (process.env.VIDEO_PARSER_API_TYPE === 'ytdlp' && ossHelper.isConfigured()) {
    console.log('✅ 视频解析: yt-dlp + OSS，将基于视频内容（下载音频→上传→ASR）生成菜谱');
    const YtdlpParser = require('./services/ytdlpParser');
    YtdlpParser.isFfmpegAvailable().then(ok => {
      if (!ok) console.log('⚠️ 未检测到 ffmpeg，下载音频会失败。请安装：Mac 执行 brew install ffmpeg');
    });
  } else if (process.env.VIDEO_PARSER_API_TYPE === 'ytdlp') {
    console.log('⚠️ 视频解析: 仅 yt-dlp，未配置 OSS，无法稳定识别视频内容，建议配置 OSS');
  }
  console.log('✅ 启动完成，等待请求（解析视频约需 1～2 分钟）...\n');
});
