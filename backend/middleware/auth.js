const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');

/**
 * 微信小程序登录验证中间件
 * 从请求头获取code，调用微信API获取openid
 */
const wechatAuth = async (req, res, next) => {
  try {
    const code = (req.headers['x-wechat-code'] || req.body.code || req.query.code || '').trim();
    
    // 生产环境或无 code 时：允许游客模式（阿里云 Web 部署无需微信登录）
    const allowGuest = process.env.NODE_ENV === 'production' || process.env.ALLOW_GUEST === 'true';
    if (!code || code === 'guest' || code === 'web-guest') {
      if (allowGuest) {
        let user = await User.findOne({ openid: 'web_guest' });
        if (!user) {
          user = new User({ openid: 'web_guest', nickname: 'Web 访客' });
          await user.save();
        }
        req.user = user;
        return next();
      }
      return res.status(401).json({ error: '缺少微信登录凭证' });
    }

    // 调用微信API获取openid
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;
    
    if (!appid || !secret) {
      console.warn('⚠️ 未配置微信小程序AppID和Secret，使用模拟openid');
      // 开发环境：使用模拟openid
      req.user = { openid: `dev_${code}`, _id: require('mongoose').Types.ObjectId() };
      return next();
    }
    
    // 开发环境：如果 code 是 test-code，直接使用模拟用户
    if (code === 'test-code' && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ 开发环境：使用测试用户');
      const User = require('../models/User');
      let user = await User.findOne({ openid: 'dev_test_user' });
      if (!user) {
        user = new User({ openid: 'dev_test_user', nickname: '测试用户' });
        await user.save();
      }
      req.user = user;
      return next();
    }

    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid,
        secret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (response.data.errcode) {
      return res.status(401).json({ 
        error: '微信登录失败', 
        details: response.data.errmsg 
      });
    }

    const { openid, session_key } = response.data;
    
    // 查找或创建用户
    let user = await User.findOne({ openid });
    if (!user) {
      user = new User({ openid });
      await user.save();
    }

    req.user = user;
    req.sessionKey = session_key;
    next();
  } catch (error) {
    console.error('微信认证错误:', error);
    res.status(500).json({ error: '认证服务异常' });
  }
};

/**
 * JWT Token验证中间件（可选，用于更安全的API调用）
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '缺少访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的访问令牌' });
  }
};

module.exports = {
  wechatAuth,
  verifyToken
};
