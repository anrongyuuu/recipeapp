const qwenService = require('../services/qwenService');
const DailyInspiration = require('../models/DailyInspiration');

/**
 * 每日灵感定时任务
 * 使用通义千问生成当日推荐菜谱并写入数据库
 */
async function runDailyInspiration() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    if (!process.env.DASHSCOPE_API_KEY) {
      console.warn('⚠️ 未配置 DASHSCOPE_API_KEY，跳过每日灵感生成');
      return;
    }

    const recipes = await qwenService.generateDailyInspiration(6);
    if (!recipes || recipes.length === 0) {
      console.warn('每日灵感生成结果为空');
      return;
    }

    const colorMap = { '早餐': '#FFF7ED', '午餐': '#F5F3FF', '晚餐': '#EFF6FF', '其他': '#F0F9FF' };
    const items = recipes.map(r => ({
      title: r.title || '今日推荐 🍳',
      description: r.description || '',
      emoji: r.emoji || '🍳',
      type: r.type || '其他',
      time: r.time || '15 min',
      color: colorMap[r.type] || '#F0F9FF',
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      imageUrl: r.imageUrl || ''
    }));

    await DailyInspiration.findOneAndUpdate(
      { date: today },
      { recipes: items, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`✅ 每日灵感已更新: ${items.length} 道菜谱`);
  } catch (e) {
    console.error('❌ 每日灵感生成失败:', e);
  }
}

module.exports = { runDailyInspiration };
