const express = require('express');
const router = express.Router();
const DailyInspiration = require('../models/DailyInspiration');
const { runDailyInspiration } = require('../jobs/dailyInspiration');

/**
 * 获取今日灵感菜谱
 * GET /api/inspiration/daily
 * Query: { type?: 早餐|午餐|晚餐 }
 */
router.get('/daily', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let doc = await DailyInspiration.findOne({ date: today }).lean();
    if (!doc) {
      doc = { recipes: [], date: today };
    }

    let recipes = doc.recipes || [];
    if (req.query.type && ['早餐', '午餐', '晚餐'].includes(req.query.type)) {
      recipes = recipes.filter(r => r.type === req.query.type);
    }

    res.json({
      success: true,
      data: recipes,
      date: today.toISOString().slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: '获取每日灵感失败', details: error.message });
  }
});

/**
 * 获取灵感列表（仅今日每日灵感，不混入用户解析的公开菜谱，避免重复与错乱）
 * GET /api/inspiration/list
 */
router.get('/list', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyDoc = await DailyInspiration.findOne({ date: today }).lean();
    const dailyRecipes = (dailyDoc?.recipes || []).map((r, i) => ({
      ...r,
      id: `insp_${i}_${(r.type || '其他').slice(0, 2)}_${(r.title || '').slice(0, 10)}`,
      source: 'daily'
    }));

    const typeOrder = { '早餐': 0, '午餐': 1, '晚餐': 2, '其他': 3 };
    const list = dailyRecipes.sort(
      (a, b) => (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3)
    );

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({ error: '获取灵感列表失败', details: error.message });
  }
});

/**
 * 手动触发每日灵感更新（需配置 DASHSCOPE_API_KEY）
 * POST /api/inspiration/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    await runDailyInspiration();
    res.json({ success: true, message: '每日灵感已更新' });
  } catch (error) {
    res.status(500).json({ error: '更新失败', details: error.message });
  }
});

module.exports = router;
