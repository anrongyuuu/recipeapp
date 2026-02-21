const axios = require('axios');
const cheerio = require('cheerio');
const YtdlpParser = require('./ytdlpParser');

/**
 * 解析视频链接，提取视频信息
 * 支持：抖音、B站、快手等平台
 */
class VideoParser {
  /**
   * 检测视频平台类型
   */
  static detectPlatform(url) {
    if (url.includes('douyin.com') || url.includes('iesdouyin.com')) {
      return 'douyin';
    }
    if (url.includes('bilibili.com')) {
      return 'bilibili';
    }
    if (url.includes('kuaishou.com') || url.includes('chenzhongtech.com')) {
      return 'kuaishou';
    }
    if (url.includes('xiaohongshu.com')) {
      return 'xiaohongshu';
    }
    return 'unknown';
  }

  /**
   * 解析抖音视频
   */
  static async parseDouyin(url) {
    try {
      // 注意：抖音有反爬虫机制，实际项目中可能需要使用第三方API服务
      // 这里提供一个基础框架
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });

      const $ = cheerio.load(response.data);
      
      // 提取视频信息（实际解析逻辑需要根据抖音页面结构调整）
      const title = $('title').text() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      
      return {
        platform: 'douyin',
        title: title.replace(' - 抖音', '').trim(),
        description,
        url,
        mediaUrl: null
      };
    } catch (error) {
      throw new Error(`解析抖音视频失败: ${error.message}`);
    }
  }

  /**
   * 解析B站视频
   */
  static async parseBilibili(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });

      const $ = cheerio.load(response.data);
      const title = $('title').text() || '';
      const description = $('meta[name="description"]').attr('content') || '';

      return {
        platform: 'bilibili',
        title: title.replace('_哔哩哔哩_bilibili', '').trim(),
        description,
        url,
        mediaUrl: null
      };
    } catch (error) {
      throw new Error(`解析B站视频失败: ${error.message}`);
    }
  }

  /**
   * 通用解析方法
   */
  static async parse(url) {
    const platform = this.detectPlatform(url);
    
    if (platform === 'douyin') {
      return await this.parseDouyin(url);
    } else if (platform === 'bilibili') {
      return await this.parseBilibili(url);
    } else {
      // 对于不支持的平台，返回基础信息
      return {
        platform: 'unknown',
        title: '未知平台视频',
        description: `视频链接: ${url}`,
        url,
        mediaUrl: null
      };
    }
  }

  /**
   * 使用第三方API解析（推荐用于生产环境）
   * 支持多种常见解析 API 格式
   * 若第三方返回 media_url / video_url，可用于阿里云 ASR 转写
   */
  static async parseWithAPI(url) {
    const apiKey = process.env.VIDEO_PARSER_API_KEY;
    const apiUrl = process.env.VIDEO_PARSER_API_URL;
    const apiType = (process.env.VIDEO_PARSER_API_TYPE || 'custom').toLowerCase();

    // yt-dlp：本地命令，不需要 API URL
    if (apiType === 'ytdlp') {
      try {
        const available = await YtdlpParser.isAvailable();
        if (!available) {
          console.warn('yt-dlp 未安装或不可用，回退到基础解析');
          return await this.parse(url);
        }
        const result = await YtdlpParser.parse(url);
        console.log(`✅ yt-dlp 解析成功: ${result.title}, 媒体链接: ${result.mediaUrl ? '已获取' : '未获取'}`);
        return result;
      } catch (e) {
        console.error('yt-dlp 解析失败:', e.message);
        const base = await this.parse(url);
        return { ...base, mediaUrl: null };
      }
    }

    // 如果没有配置 API URL，尝试基础解析（仅获取标题和描述）
    if (!apiUrl) {
      console.log('未配置视频解析 API URL，使用基础解析（仅获取标题和描述）');
      return await this.parse(url);
    }

    try {
      let response;
      const platform = this.detectPlatform(url);

      // 根据 API 类型选择不同的调用方式
      switch (apiType) {
        case 'yaohu': // 妖狐数据 API
          response = await axios.get(apiUrl, {
            params: { url },
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 20000
          });
          break;

        case 'litchi': // Litchi API
          response = await axios.post(apiUrl, 
            { url, platform },
            { 
              headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 20000
            }
          );
          break;

        case 'ucmao': // parse-ucmao-backend 开源方案
          response = await axios.post(apiUrl, 
            { url },
            { 
              headers: { 'Content-Type': 'application/json' },
              timeout: 20000
            }
          );
          break;

        default: // custom 等 // 自定义 API（默认格式）
          const requestBody = apiKey ? { url, api_key: apiKey } : { url };
          response = await axios.post(apiUrl, 
            requestBody,
            { 
              headers: { 'Content-Type': 'application/json' },
              timeout: 20000
            }
          );
      }

      const d = response.data;
      
      // ucmao 返回格式检查
      if (apiType === 'ucmao') {
        // ucmao 可能返回: { succ: false, retdesc: "..." } 或 { code: 200, data: {...} }
        if (d.succ === false || d.retcode !== 200) {
          console.warn('ucmao 解析失败:', d.retdesc || d.message || '未知错误');
          // 回退到基础解析
          const base = await this.parse(url);
          return { ...base, mediaUrl: null };
        }
        // ucmao 成功返回: { code: 200, data: {...} } 或直接是 data
        const data = d.data || d;
        return {
          platform: data.platform || platform || 'unknown',
          title: data.title || data.video_title || data.name || '未知视频',
          description: data.description || data.desc || data.intro || '',
          url: url,
          thumbnail: data.thumbnail || data.cover || data.pic || data.image || '',
          mediaUrl: data.video_url || data.media_url || data.video_direct_url || null
        };
      }
      
      // 其他 API 格式
      const data = d.data || d.result || d;

      // 统一处理返回结果（适配不同 API 的字段名）
      const result = {
        platform: data.platform || platform || 'unknown',
        title: data.title || data.video_title || data.name || '未知视频',
        description: data.description || data.desc || data.intro || '',
        url: url,
        thumbnail: data.thumbnail || data.cover || data.pic || data.image || '',
        // 优先获取视频直链（用于 ASR 转写）
        mediaUrl: data.media_url || 
                  data.video_url || 
                  data.video_direct_url || 
                  data.nwm_video_url ||  // 无水印视频链接
                  data.play_url ||
                  data.url ||
                  data.audio_url || 
                  null
      };

      // 验证 mediaUrl 是否有效（必须是可访问的 URL）
      if (result.mediaUrl && !result.mediaUrl.startsWith('http')) {
        console.warn('解析到的 mediaUrl 格式不正确，忽略:', result.mediaUrl);
        result.mediaUrl = null;
      }

      console.log(`✅ 视频解析成功: ${result.title}, 媒体链接: ${result.mediaUrl ? '已获取' : '未获取'}`);
      return result;

    } catch (error) {
      console.error('❌ 第三方API解析失败:', error.message);
      console.log('回退到基础解析（仅获取标题和描述）');
      const base = await this.parse(url);
      return { ...base, mediaUrl: null };
    }
  }
}

module.exports = VideoParser;
