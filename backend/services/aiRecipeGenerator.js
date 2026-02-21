const qwenService = require('./qwenService');
const aliyunAsrService = require('./aliyunAsrService');
const contentSafetyService = require('./contentSafetyService');

/**
 * AI 菜谱生成服务
 * 1. 若有音视频 URL：阿里云 ASR 转写 → 通义千问生成结构化菜谱
 * 2. 若仅有标题/描述：通义千问直接生成
 */
class AIRecipeGenerator {
  /**
   * 根据视频信息生成菜谱
   * @param {Object} videoInfo - { title, description, mediaUrl? }
   */
  async generateWithAI(videoInfo) {
    let textSource = `视频标题：${videoInfo.title || '未知'}\n视频描述：${videoInfo.description || '无'}`;

    // 若有音视频直链且 ASR 可用，先转写
    if (videoInfo.mediaUrl && aliyunAsrService.isAvailable()) {
      try {
        console.log('🎤 正在 ASR 转写（约 30 秒～2 分钟）...');
        const transcript = await aliyunAsrService.transcribe(videoInfo.mediaUrl);
        if (transcript && transcript.length > 20) {
          // 安全检查：检查转写内容
          console.log('🔒 检查 ASR 转写内容安全性...');
          const transcriptCheck = await contentSafetyService.checkTranscript(transcript);
          if (!transcriptCheck.safe) {
            throw new Error(`转写内容包含不当内容: ${transcriptCheck.reason}`);
          }
          if (!transcriptCheck.isFoodRelated) {
            throw new Error('转写内容与美食无关，请上传美食相关视频');
          }
          console.log('✅ ASR 转写内容安全检查通过');
          
          textSource = `【视频旁白/解说转写内容】\n${transcript}\n\n【视频标题】${videoInfo.title || ''}\n【视频描述】${videoInfo.description || ''}`;
          console.log('✅ ASR 转写完成，字数:', transcript.length);
        }
      } catch (e) {
        if (e.message.includes('不当内容') || e.message.includes('与美食无关')) {
          throw e; // 安全相关错误直接抛出
        }
        console.warn('ASR 转写失败，使用标题和描述:', e.message);
      }
    }

    // 通义千问生成菜谱
    try {
      console.log('📝 正在通义千问生成菜谱...');
      const recipeData = await qwenService.generateRecipeFromText(textSource);
      
      // 最终安全检查：检查生成的菜谱内容
      console.log('🔒 检查生成的菜谱内容安全性...');
      const recipeCheck = await contentSafetyService.checkRecipe(recipeData);
      if (!recipeCheck.safe) {
        throw new Error(`生成的菜谱包含不当内容: ${recipeCheck.reason}`);
      }
      console.log('✅ 菜谱内容安全检查通过');
      
      return recipeData;
    } catch (e) {
      if (e.message && (e.message.includes('不当内容') || e.message.includes('安全检查'))) {
        throw e; // 安全相关错误直接抛出
      }
      console.error('通义千问生成失败，使用模拟数据:', e.message);
      return this.generateMock(videoInfo);
    }
  }

  /**
   * 模拟菜谱（当 AI 服务不可用时）
   */
  generateMock(videoInfo) {
    const mockRecipes = {
      '早餐': {
        title: '元气厚蛋烧 🍳',
        description: '嫩滑多汁，唤醒一整天的活力。',
        time: '10 min',
        type: '早餐',
        emoji: '🍳',
        color: '#FFF7ED',
        ingredients: ['3个 鸡蛋 🥚', '30ml 牛奶 🥛', '适量 盐和葱花 🧂'],
        steps: [
          '鸡蛋打散加入牛奶和葱花。',
          '平底锅刷油，分三次倒入蛋液。',
          '每次卷起后再倒入新蛋液。',
          '切段即可享用。'
        ]
      },
      '午餐': {
        title: '照烧鸡腿饭 🍗',
        description: '浓郁酱汁裹着嫩鸡肉，午间充能必备。',
        time: '25 min',
        type: '午餐',
        emoji: '🍗',
        color: '#F5F3FF',
        ingredients: ['2个 鸡腿 🍗', '1碗 米饭 🍚', '照烧汁 🍯', '西兰花 🥦'],
        steps: [
          '鸡腿去骨，鸡皮朝下煎至出油。',
          '倒入照烧汁小火焖煮至浓稠。',
          '西兰花焯水备用。',
          '切块摆盘，淋上汤汁。'
        ]
      },
      '晚餐': {
        title: '暖心番茄面 🍅',
        description: '酸甜开胃，深夜最温柔的抚慰。',
        time: '15 min',
        type: '晚餐',
        emoji: '🍅',
        color: '#EFF6FF',
        ingredients: ['2个 大番茄 🍅', '1把 手擀面 🍜', '1个 鸡蛋 🥚'],
        steps: [
          '番茄切碎炒出汁水。',
          '加入足量开水煮沸。',
          '下入面条煮熟，最后打入蛋花。',
          '加少许盐调味即可。'
        ]
      }
    };

    let type = '其他';
    const title = (videoInfo.title || '').toLowerCase();
    if (title.includes('早餐') || title.includes('早') || title.includes('蛋')) type = '早餐';
    else if (title.includes('午餐') || title.includes('午') || title.includes('饭')) type = '午餐';
    else if (title.includes('晚餐') || title.includes('晚') || title.includes('面')) type = '晚餐';

    const recipe = { ...mockRecipes[type] || mockRecipes['午餐'] };
    if (videoInfo.title && !videoInfo.title.includes('菜谱')) {
      recipe.title = videoInfo.title + ' 🍳';
    }
    return recipe;
  }

  getColorByType(type) {
    const colorMap = { '早餐': '#FFF7ED', '午餐': '#F5F3FF', '晚餐': '#EFF6FF', '其他': '#F0F9FF' };
    return colorMap[type] || '#F0F9FF';
  }
}

module.exports = new AIRecipeGenerator();
