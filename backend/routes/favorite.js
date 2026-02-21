const express = require('express');
const router = express.Router();
const { wechatAuth } = require('../middleware/auth');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

/**
 * 获取收藏列表
 * GET /api/favorite
 */
router.get('/', wechatAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title description emoji time type color imageUrl createdAt')
      .select('favorites');
    
    res.json({
      success: true,
      data: user.favorites || []
    });
  } catch (error) {
    res.status(500).json({ error: '获取收藏列表失败', details: error.message });
  }
});

/**
 * 添加收藏
 * POST /api/favorite
 * Body: { recipeId: string }
 */
router.post('/', wechatAuth, async (req, res) => {
  try {
    const { recipeId } = req.body;
    
    if (!recipeId) {
      return res.status(400).json({ error: '请提供菜谱ID' });
    }
    
    // 检查菜谱是否存在
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }
    
    // 检查是否已收藏
    const user = await User.findById(req.user._id);
    if (user.favorites.includes(recipeId)) {
      return res.json({
        success: true,
        message: '已收藏',
        data: { isFavorite: true }
      });
    }
    
    // 添加收藏
    user.favorites.push(recipeId);
    await user.save();
    
    // 更新菜谱收藏数
    recipe.favoriteCount += 1;
    await recipe.save();
    
    res.json({
      success: true,
      message: '收藏成功',
      data: { isFavorite: true }
    });
  } catch (error) {
    res.status(500).json({ error: '收藏失败', details: error.message });
  }
});

/**
 * 取消收藏
 * DELETE /api/favorite/:recipeId
 */
router.delete('/:recipeId', wechatAuth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    const user = await User.findById(req.user._id);
    const recipeIndex = user.favorites.indexOf(recipeId);
    
    if (recipeIndex === -1) {
      return res.status(404).json({ error: '未收藏此菜谱' });
    }
    
    // 移除收藏
    user.favorites.splice(recipeIndex, 1);
    await user.save();
    
    // 更新菜谱收藏数
    const recipe = await Recipe.findById(recipeId);
    if (recipe && recipe.favoriteCount > 0) {
      recipe.favoriteCount -= 1;
      await recipe.save();
    }
    
    res.json({
      success: true,
      message: '已取消收藏',
      data: { isFavorite: false }
    });
  } catch (error) {
    res.status(500).json({ error: '取消收藏失败', details: error.message });
  }
});

/**
 * 检查是否已收藏
 * GET /api/favorite/check/:recipeId
 */
router.get('/check/:recipeId', wechatAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isFavorite = user.favorites.includes(req.params.recipeId);
    
    res.json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    res.status(500).json({ error: '检查收藏状态失败', details: error.message });
  }
});

module.exports = router;
