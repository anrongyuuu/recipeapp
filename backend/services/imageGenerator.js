const axios = require('axios');

/**
 * 通义万相（DashScope）图片生成服务
 * 文档: https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9
 */
class ImageGenerator {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseUrl = 'https://dashscope.aliyun.com/api/v1/services/aigc/text2image/image-synthesis';
  }

  /**
   * 根据菜谱信息生成图片
   * @param {Object} recipeInfo - { title, description, ingredients?, steps? }
   * @returns {Promise<string>} 图片 URL
   */
  async generateRecipeImage(recipeInfo) {
    if (!this.apiKey) {
      throw new Error('未配置 DASHSCOPE_API_KEY');
    }

    const { title, description, ingredients = [], steps = [] } = recipeInfo;
    
    // 构建图片生成提示词
    let prompt = `一张精美的美食照片，${title}`;
    
    if (description) {
      prompt += `，${description}`;
    }
    
    if (ingredients.length > 0) {
      const mainIngredients = ingredients.slice(0, 3).join('、');
      prompt += `，主要食材：${mainIngredients}`;
    }
    
    prompt += '，高清，专业摄影，美食摄影，诱人的色彩，自然光线，白色背景或简洁背景';
    
    try {
      console.log('🎨 开始生成菜谱图片，提示词:', prompt);
      
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'wanx-v1', // 通义万相模型
          input: {
            prompt: prompt
          },
          parameters: {
            size: '1024*1024', // 图片尺寸
            n: 1, // 生成数量
            style: '<auto>' // 自动风格
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable' // 启用异步模式（推荐）
          },
          timeout: 30000
        }
      );

      // 通义万相返回任务 ID，需要轮询获取结果
      if (response.data.output && response.data.output.task_id) {
        const taskId = response.data.output.task_id;
        console.log('📸 图片生成任务已提交，任务ID:', taskId);
        
        // 轮询获取结果（最多等待 60 秒）
        const imageUrl = await this.pollTaskResult(taskId);
        return imageUrl;
      } else if (response.data.output && response.data.output.results && response.data.output.results.length > 0) {
        // 同步模式直接返回结果
        const imageUrl = response.data.output.results[0].url;
        console.log('✅ 图片生成成功（同步模式）');
        return imageUrl;
      } else {
        throw new Error('图片生成返回格式异常');
      }
    } catch (error) {
      console.error('❌ 图片生成失败:', error.message);
      if (error.response) {
        console.error('响应数据:', error.response.data);
      }
      throw new Error(`图片生成失败: ${error.message}`);
    }
  }

  /**
   * 轮询任务结果
   * @param {string} taskId 
   * @returns {Promise<string>} 图片 URL
   */
  async pollTaskResult(taskId, maxAttempts = 20, interval = 3000) {
    const queryUrl = `${this.baseUrl}/fetch`;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, interval));
        
        const response = await axios.post(
          queryUrl,
          { task_id: taskId },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const taskStatus = response.data.output?.task_status;
        
        if (taskStatus === 'SUCCEEDED') {
          const results = response.data.output?.results;
          if (results && results.length > 0 && results[0].url) {
            console.log('✅ 图片生成成功（异步模式）');
            return results[0].url;
          }
        } else if (taskStatus === 'FAILED') {
          throw new Error('图片生成任务失败');
        }
        // PENDING 或 RUNNING 状态继续轮询
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        // 继续重试
      }
    }
    
    throw new Error('图片生成超时');
  }

  /**
   * 检查服务是否可用
   */
  isAvailable() {
    return !!this.apiKey;
  }
}

module.exports = new ImageGenerator();
