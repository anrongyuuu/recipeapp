/**
 * 测试 yt-dlp 解析
 * 运行: node scripts/test-ytdlp.js [视频链接]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const YtdlpParser = require('../services/ytdlpParser');

const url = process.argv[2] || 'https://www.bilibili.com/video/BV1Kf6FB5EuS/';

async function main() {
  console.log('🔍 检查 yt-dlp 是否可用...');
  const ok = await YtdlpParser.isAvailable();
  if (!ok) {
    console.error('❌ yt-dlp 未安装或不在 PATH 中');
    console.error('   安装: brew install yt-dlp');
    process.exit(1);
  }
  console.log('✅ yt-dlp 可用\n');

  console.log('📹 解析链接:', url);
  try {
    const result = await YtdlpParser.parse(url);
    console.log('\n✅ 解析结果:');
    console.log('  平台:', result.platform);
    console.log('  标题:', result.title);
    console.log('  描述长度:', (result.description || '').length, '字符');
    console.log('  封面:', result.thumbnail ? '有' : '无');
    console.log('  媒体直链:', result.mediaUrl ? '已获取' : '未获取');
    if (result.mediaUrl) {
      console.log('  URL 前缀:', result.mediaUrl.slice(0, 60) + '...');
    }
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

main();
