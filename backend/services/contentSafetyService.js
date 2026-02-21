const qwenService = require('./qwenService');

/**
 * 内容安全检查服务
 * 1. 检查视频是否为美食相关
 * 2. 检查是否包含敏感词汇或不当内容
 */
class ContentSafetyService {
  constructor() {
    // 敏感词列表（可扩展）
    this.sensitiveKeywords = [
      // 暴力/危险
      '人肉', '人体', '器官', '血液', '尸体',
      // 违法/不当
      '毒品', '违禁', '非法',
      // 其他敏感内容
      '政治', '色情', '暴力'
    ];
    
    // 非美食关键词（如果视频标题/描述主要包含这些，可能不是美食视频）
    this.nonFoodKeywords = [
      '游戏', '音乐', '电影', '电视剧', '综艺', '新闻', '体育', '科技',
      '教育', '旅游', '汽车', '房产', '财经', '时尚', '美妆', '健身',
      '宠物', '搞笑', '段子', '剧情', '动画', '动漫', '直播', '聊天'
    ];
  }

  /**
   * 检查文本是否包含敏感词
   */
  containsSensitiveWords(text) {
    if (!text || typeof text !== 'string') return false;
    const lowerText = text.toLowerCase();
    return this.sensitiveKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * 检查是否为美食相关内容（基于关键词）
   */
  isFoodRelated(text) {
    if (!text || typeof text !== 'string') return false;
    const lowerText = text.toLowerCase();
    
    // 美食相关关键词
    const foodKeywords = [
      '菜', '饭', '汤', '面', '肉', '鱼', '虾', '鸡', '鸭', '鹅', '牛', '羊', '猪',
      '炒', '煮', '蒸', '炸', '烤', '炖', '煎', '烧', '卤', '拌', '腌',
      '食谱', '菜谱', '做法', '教程', '制作', '烹饪', '料理', '美食', '小吃',
      '早餐', '午餐', '晚餐', '夜宵', '点心', '甜品', '蛋糕', '面包',
      '调料', '食材', '配料', '佐料', '香料'
    ];
    
    // 非美食关键词（如果大量出现，可能不是美食视频）
    const nonFoodCount = this.nonFoodKeywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
    const foodCount = foodKeywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
    
    // 如果非美食关键词明显多于美食关键词，可能不是美食视频
    if (nonFoodCount > 2 && foodCount < 2) {
      return false;
    }
    
    // 至少包含一个美食关键词
    return foodCount > 0;
  }

  /**
   * 使用 AI 进行内容审核（更精准）
   */
  async checkContentWithAI(text) {
    if (!qwenService.apiKey) {
      // 如果没有配置 API Key，回退到关键词检查
      return {
        safe: !this.containsSensitiveWords(text),
        isFoodRelated: this.isFoodRelated(text),
        reason: '使用关键词检查（未配置 AI 审核）'
      };
    }

    try {
      const prompt = `请审核以下文本内容，判断：
1. 是否为美食/烹饪相关内容
2. 是否包含敏感、不当、违法或危险内容（如涉及人肉、毒品、暴力、色情等）

文本内容：
${text.substring(0, 2000)}  // 限制长度避免超 token

请严格以 JSON 格式返回：
{
  "isFoodRelated": true/false,
  "isSafe": true/false,
  "reason": "如果不安全或非美食，说明原因"
}`;

      const response = await qwenService.chat([
        {
          role: 'system',
          content: '你是内容安全审核助手，负责判断文本是否为美食相关内容，以及是否包含敏感、不当、违法或危险内容。只返回 JSON，不要其他说明。'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.1, // 降低温度以提高准确性
        max_tokens: 500
      });

      // 解析 AI 返回的 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          safe: result.isSafe !== false, // 默认安全
          isFoodRelated: result.isFoodRelated === true,
          reason: result.reason || ''
        };
      }
    } catch (e) {
      console.warn('AI 内容审核失败，回退到关键词检查:', e.message);
    }

    // 回退到关键词检查
    return {
      safe: !this.containsSensitiveWords(text),
      isFoodRelated: this.isFoodRelated(text),
      reason: '使用关键词检查（AI 审核失败）'
    };
  }

  /**
   * 检查视频信息（标题+描述）
   */
  async checkVideoInfo(videoInfo) {
    const text = `${videoInfo.title || ''} ${videoInfo.description || ''}`.trim();
    if (!text) {
      return { safe: true, isFoodRelated: false, reason: '视频信息为空' };
    }

    // 快速关键词检查
    if (this.containsSensitiveWords(text)) {
      return {
        safe: false,
        isFoodRelated: false,
        reason: '包含敏感词汇'
      };
    }

    // 使用 AI 进行更精准的检查
    return await this.checkContentWithAI(text);
  }

  /**
   * 检查 ASR 转写文本
   */
  async checkTranscript(transcript) {
    if (!transcript || transcript.length < 10) {
      return { safe: true, isFoodRelated: false, reason: '转写文本为空或过短' };
    }

    // 快速关键词检查
    if (this.containsSensitiveWords(transcript)) {
      return {
        safe: false,
        isFoodRelated: false,
        reason: '转写内容包含敏感词汇'
      };
    }

    // 使用 AI 进行更精准的检查
    return await this.checkContentWithAI(transcript);
  }

  /**
   * 检查生成的菜谱内容
   */
  async checkRecipe(recipeData) {
    const text = [
      recipeData.title || '',
      recipeData.description || '',
      ...(recipeData.ingredients || []),
      ...(recipeData.steps || [])
    ].join(' ');

    // 快速关键词检查
    if (this.containsSensitiveWords(text)) {
      return {
        safe: false,
        reason: '菜谱内容包含敏感词汇'
      };
    }

    // 使用 AI 进行更精准的检查
    const result = await this.checkContentWithAI(text);
    return {
      safe: result.safe,
      reason: result.reason
    };
  }
}

module.exports = new ContentSafetyService();
