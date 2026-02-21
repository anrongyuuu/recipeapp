const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { wechatAuth } = require('../middleware/auth');
const VideoParser = require('../services/videoParser');
const YtdlpParser = require('../services/ytdlpParser');
const ossHelper = require('../services/ossHelper');
const aiRecipeGenerator = require('../services/aiRecipeGenerator');
const Recipe = require('../models/Recipe');

/**
 * 解析视频并生成菜谱
 * 产品要求：必须基于视频内容（旁白/解说）生成菜谱，不能仅靠标题。
 * 当使用 yt-dlp 且配置了 OSS 时：下载音频 → 上传 OSS → 用可访问 URL 做 ASR → 通义千问根据转写生成菜谱。
 * POST /api/video/parse
 * Body: { url: string }
 */
router.post('/parse', wechatAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '请提供有效的视频链接' });
    }

    // 解析视频信息（标题、描述、缩略图等）
    console.log('📹 开始解析视频:', url);
    const videoInfo = await VideoParser.parseWithAPI(url);

    // 视频封面：若有 thumbnail 且配置了 OSS，下载并上传到 OSS，得到长期可用的 URL
    if (videoInfo.thumbnail && videoInfo.thumbnail.startsWith('http') && ossHelper.isConfigured()) {
      try {
        console.log('🖼️ 正在持久化视频封面到 OSS...');
        videoInfo.thumbnail = await ossHelper.uploadImageFromUrl(videoInfo.thumbnail);
      } catch (e) {
        console.warn('封面持久化失败，保留原链接:', e.message);
      }
    }

    const useYtdlpWithOss = process.env.VIDEO_PARSER_API_TYPE === 'ytdlp' && ossHelper.isConfigured();
    let audioPath = null;

    if (useYtdlpWithOss) {
      // 使用 OSS 时不再用解析得到的流地址（易 403），仅用上传后的签名 URL
      videoInfo.mediaUrl = null;
      try {
        console.log('🎵 下载视频音频（yt-dlp，依赖 ffmpeg）...');
        audioPath = await YtdlpParser.downloadAudio(url);
        console.log('☁️ 上传音频到 OSS 以获取可访问 URL...');
        const signedUrl = await ossHelper.uploadAndGetUrl(audioPath);
        const ok = await ossHelper.checkUrlAccessible(signedUrl);
        if (!ok) {
          console.warn('OSS 签名 URL 无法访问，跳过 ASR');
        } else {
          videoInfo.mediaUrl = signedUrl;
          console.log('✅ 已得到可访问音频 URL，将用于 ASR 转写');
        }
      } catch (e) {
        const errMsg = e && e.message ? e.message : (e && e.toString ? e.toString() : String(e || '未知错误'));
        console.warn('下载/上传音频失败，回退到标题+描述（产品要求应识别视频内容，此仅为降级）:', errMsg);
        if (e && e.stack) console.error('错误堆栈:', e.stack);
      } finally {
        if (audioPath) {
          try {
            const dir = path.dirname(audioPath);
            if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
          } catch (_) {}
        }
      }
    }
    
    console.log('🤖 开始生成菜谱（通义千问 + 阿里云 ASR）...');
    let recipeData;
    let isFallback = false;
    try {
      const result = await aiRecipeGenerator.generateWithAI(videoInfo);
      recipeData = result.recipeData ?? result;
      isFallback = result.isFallback === true;
      if (isFallback) console.warn('⚠️ 本次返回模拟菜谱，请检查 DASHSCOPE 或 QWEN_TIMEOUT_MS');
    } catch (e) {
      if (e.message && (e.message.includes('不当内容') || e.message.includes('与美食无关') || e.message.includes('安全检查'))) {
        return res.status(400).json({ error: '内容不符合要求', details: e.message });
      }
      throw e;
    }
    
    const recipe = new Recipe({
      ...recipeData,
      videoUrl: url,
      videoSource: videoInfo.platform,
      userId: req.user._id,
      imageUrl: videoInfo.thumbnail || recipeData.imageUrl || ''
    });
    
    await recipe.save();
    
    res.json({
      success: true,
      data: {
        id: recipe._id,
        ...recipeData,
        videoUrl: url,
        videoSource: videoInfo.platform,
        isFallback: isFallback
      }
    });
  } catch (error) {
    console.error('解析视频失败:', error);
    res.status(500).json({ 
      error: '解析视频失败', 
      details: error.message 
    });
  }
});

/**
 * 获取视频解析状态（用于轮询）
 * GET /api/video/status/:recipeId
 */
router.get('/status/:recipeId', wechatAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    
    if (!recipe) {
      return res.status(404).json({ error: '菜谱不存在' });
    }
    
    res.json({
      success: true,
      data: {
        status: 'completed',
        recipe: recipe
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取状态失败', details: error.message });
  }
});

module.exports = router;
