const express = require('express');
const router = express.Router();
const { wechatAuth } = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const imageGenerator = require('../services/imageGenerator');

/**
 * 获取菜谱详情
 * GET /api/recipe/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('userId', 'nickname avatar')
      .select('-__v');
    
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }
    
    // 增加浏览量
    recipe.viewCount += 1;
    await recipe.save();
    
    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    res.status(500).json({ error: '获取菜谱失败', details: error.message });
  }
});

/**
 * 为菜谱生成图片（AI 生图）
 * POST /api/recipe/:id/generate-image
 */
router.post('/:id/generate-image', wechatAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }

    if (!imageGenerator.isAvailable()) {
      return res.status(503).json({ error: '图片生成服务未配置' });
    }

    // 如果已有图片，直接返回
    if (recipe.imageUrl && recipe.imageUrl.trim()) {
      return res.json({
        success: true,
        data: { imageUrl: recipe.imageUrl },
        cached: true
      });
    }

    console.log(`🎨 开始为菜谱生成图片: ${recipe.title}`);
    
    // 生成图片
    const imageUrl = await imageGenerator.generateRecipeImage({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || []
    });

    // 保存图片 URL 到数据库
    recipe.imageUrl = imageUrl;
    await recipe.save();

    console.log(`✅ 图片生成成功并已保存: ${imageUrl}`);

    res.json({
      success: true,
      data: { imageUrl }
    });
  } catch (error) {
    console.error('图片生成失败:', error);
    res.status(500).json({ 
      error: '图片生成失败', 
      details: error.message 
    });
  }
});

/**
 * 获取灵感菜谱列表（公开菜谱）
 * GET /api/recipe/inspiration
 * Query: { type?: string, page?: number, limit?: number }
 */
router.get('/inspiration/list', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { isPublic: true };
    if (type && ['早餐', '午餐', '晚餐', '其他'].includes(type)) {
      query.type = type;
    }
    
    const recipes = await Recipe.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title description emoji time type color imageUrl favoriteCount')
      .lean();
    
    const total = await Recipe.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        list: recipes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取菜谱列表失败', details: error.message });
  }
});

/**
 * 搜索菜谱
 * GET /api/recipe/search
 * Query: { keyword: string, page?: number, limit?: number }
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const recipes = await Recipe.find({
      isPublic: true,
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title description emoji time type color imageUrl')
      .lean();
    
    res.json({
      success: true,
      data: {
        list: recipes,
        keyword
      }
    });
  } catch (error) {
    res.status(500).json({ error: '搜索失败', details: error.message });
  }
});

/**
 * 获取用户创建的菜谱
 * GET /api/recipe/my
 */
router.get('/my/list', wechatAuth, async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('title description emoji time type color createdAt')
      .lean();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    res.status(500).json({ error: '获取我的菜谱失败', details: error.message });
  }
});

module.exports = router;
