const express = require('express');
const router = express.Router();
const { wechatAuth } = require('../middleware/auth');
const User = require('../models/User');

/**
 * 微信小程序登录
 * POST /api/auth/login
 * Body: { code: string }
 */
router.post('/login', wechatAuth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        userId: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败', details: error.message });
  }
});

/**
 * 获取用户信息
 * GET /api/auth/user
 */
router.get('/user', wechatAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title emoji time type')
      .select('-openid');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败', details: error.message });
  }
});

/**
 * 更新用户信息
 * PUT /api/auth/user
 * Body: { nickname?: string, avatar?: string }
 */
router.put('/user', wechatAuth, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const user = await User.findById(req.user._id);
    
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        userId: user._id,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: '更新用户信息失败', details: error.message });
  }
});

module.exports = router;
