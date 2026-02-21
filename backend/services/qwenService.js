const axios = require('axios');

/**
 * 通义千问 (DashScope) 服务
 * 文档: https://help.aliyun.com/zh/model-studio/
 */
class QwenService {
  constructor() {
    this._apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    this._model = process.env.QWEN_MODEL || 'qwen3.5-plus';
  }
  get apiKey() {
    return process.env.DASHSCOPE_API_KEY || this._apiKey || '';
  }
  get model() {
    return process.env.QWEN_MODEL || this._model || 'qwen3.5-plus';
  }

  /**
   * 调用通义千问（OpenAI 兼容接口，支持 qwen3.5-plus）
   * 超时自动重试 1 次；可设 QWEN_TIMEOUT_MS、QWEN_MODEL
   */
  async chat(messages, options = {}) {
    const apiKey = this.apiKey;
    if (!apiKey || !apiKey.trim()) {
      throw new Error('未配置 DASHSCOPE_API_KEY，请在 backend/.env 中配置');
    }
    const msgList = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];
    const body = {
      model: this.model,
      messages: msgList,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000
    };
    const timeoutMs = Number(process.env.QWEN_TIMEOUT_MS) || options.timeout || 240000;
    const config = {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: timeoutMs
    };

    const doRequest = () => axios.post(this.baseUrl, body, config);

    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await doRequest();
        const data = response.data;
        if (data.error && data.error.message) throw new Error(data.error.message);
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('通义千问返回内容为空');
        return content;
      } catch (err) {
        lastErr = err;
        const isTimeout = err.code === 'ECONNABORTED' || (err.message && err.message.includes('超时'));
        const apiMsg = err.response?.data?.message || err.response?.data?.error;
        if (apiMsg) throw new Error(`通义千问接口异常: ${apiMsg}`);
        if (isTimeout && attempt === 1) {
          console.warn('⏱️ 通义千问首次请求超时，正在重试一次...');
          continue;
        }
        if (isTimeout) throw new Error('通义千问请求超时，请稍后重试或增大 .env 中 QWEN_TIMEOUT_MS');
        throw err;
      }
    }
    throw lastErr;
  }

  /**
   * 根据文本生成结构化菜谱（优化版：支持 ASR 纠错、用量守恒、逻辑排序）
   */
  async generateRecipeFromText(textSource) {
    // 判断是否为 ASR 转写文本（包含【视频旁白/解说转写内容】标记）
    const isAsrText = textSource.includes('【视频旁白/解说转写内容】') || textSource.includes('转写内容');
    
    if (isAsrText) {
      // 提取 ASR 原始文本
      const asrMatch = textSource.match(/【视频旁白\/解说转写内容】\s*\n([\s\S]*?)(?:\n\n【视频标题】|$)/);
      const asrText = asrMatch ? asrMatch[1].trim() : textSource;
      const titleMatch = textSource.match(/【视频标题】(.+?)(?:\n【视频描述】|$)/);
      const videoTitle = titleMatch ? titleMatch[1].trim() : '';
      
      return await this._generateRecipeFromAsr(asrText, videoTitle);
    } else {
      // 非 ASR 文本，使用简化 prompt
      return await this._generateRecipeFromSimpleText(textSource);
    }
  }

  /**
   * 从 ASR 转写文本生成精准菜谱（使用专业 prompt）
   */
  async _generateRecipeFromAsr(asrText, videoTitle) {
    const systemPrompt = `你是一位拥有 20 年经验的资深五星级大厨，精通中文语义纠错与标准菜谱写作逻辑。你的任务是将一段口语化、可能存在识别错误的 ASR 文本（视频旁白）转化为逻辑严密、结构标准、精准可操作的 JSON 菜谱。

核心约束模块：

1. 语义纠错与领域增强 (Contextual Correction)
- 纠错字典：自动修正 ASR 同音字错误（例：生凑->生抽、耗油->蚝油、肉扣->肉蔻、电粉->淀粉、老凑->老抽）。
- 废话过滤：剔除视频中与烹饪无关的内容（如"点赞关注"、"今天天气真好"等）。

2. 用量守恒与逻辑校验 (Ingredient Integrity)
- 禁止盲目合并：同一食材在不同阶段使用时，清单需标注总量，并备注"分次使用"。
- 步骤对齐：烹饪步骤中必须明确标注该步骤所需的具体分量（例如："倒入剩余的 50g 冰糖"），严禁只写"加入冰糖"。
- 单位推断：若旁白仅说"两勺"，请结合常识补全为"汤匙(tbsp)"或"茶匙(tsp)"。

3. 食材格式与排序 (Ingredient Format & Order)
- 每条食材格式为：【数量 食材】，例如 "500g 排骨"、"2个 鸡蛋"。不要标注「主料」「辅料」「调料」等分类标签。
- 顺序要求：按【主要材料 → 配菜 → 调料】的顺序排列（只调整顺序，不输出分类标题）。
- 调料必须写在一行（合并成行，不是隐藏克数）：
  * 同类调料合并为一条字符串，写在同一行，数量都要保留。例如："葱 2根、姜 3片、蒜 3瓣" 或 "葱姜蒜 各适量"；"盐 适量、糖 5g、白胡椒 少许"。
  * 禁止把每种调料单独占一行。调料区应只有少数几行，如一行写葱姜蒜、一行写盐糖胡椒等。
  * 合并是指「多个调料写进同一行」，不是省略数量。

处理逻辑 (Chain of Thought)：
1. 全文扫描：识别菜名，调取内置"标准菜谱知识库"作为辅助参考。
2. 量化提取：记录每个食材在每个动作点出现的数值，计算总和。
3. 结构重组：将食材按 主要材料→配菜→调料 顺序排列；调料按「葱姜蒜一行、盐糖酱醋等一行」等方式合并成行，每行内保留各自数量。
4. 格式检查：确保输出为合法 JSON，ingredients 仅使用「数量 食材」格式，调料已合并为少数几行。

输出格式要求：
- 严格按 JSON 格式返回，不要包含任何多余解释
- ingredients 数组：仅【数量 食材】格式，按 主要材料-配菜-调料 顺序；调料必须合并写在一行（如 "葱 2根、姜 3片、蒜 3瓣"、"盐 适量、糖 5g、白胡椒 少许"），不要每种调料单独一行
- steps 数组中的格式：["1. 锅中倒入50g冰糖，小火炒制出糖色...", "2. 放入排骨翻炒均匀..."]
- 必须包含 tips 字段`;

    const userPrompt = `待处理文本：

${asrText}

${videoTitle ? `\n视频标题：${videoTitle}` : ''}

请根据以上 ASR 转写内容，生成一份精准的菜谱 JSON。严格按照以下格式返回（不要 markdown 代码块，直接返回 JSON）：

{
  "title": "菜名（简洁，可包含emoji）",
  "description": "简短描述（一句话）",
  "time": "预计耗时（如：30 min）",
  "type": "早餐/午餐/晚餐/其他",
  "emoji": "🍳",
  "ingredients": [
    "500g 排骨",
    "20g 西兰花",
    "葱 2根、姜 3片、蒜 3瓣",
    "盐 适量、糖 5g、白胡椒 少许"
  ],
  "steps": [
    "1. 锅中倒入50g冰糖，小火炒制出糖色...",
    "2. 放入排骨翻炒均匀，随后加入剩余的50g冰糖和适量水..."
  ],
  "tips": "关于火候、食材替代或避坑的专业建议"
}`;

    const content = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.3, // 降低温度以提高准确性
      max_tokens: 3000  // 增加 token 限制以支持详细步骤
    });

    return this._parseRecipeJson(content);
  }

  /**
   * 从简单文本生成菜谱（非 ASR，使用简化 prompt）
   */
  async _generateRecipeFromSimpleText(textSource) {
    const prompt = `你是一个专业的菜谱生成助手。根据以下内容，生成一份详细的菜谱。

内容来源：
${textSource}

请生成一份结构化的菜谱，严格以JSON格式返回，不要包含其他说明文字。

食材要求：
- 格式为【数量 食材】，如 "2个 鸡蛋"、"30ml 牛奶"。
- 不标注主料/辅料/调料，但顺序按：主要材料 → 配菜 → 调料。
- 调料必须合并写在一行（多料一行、数量保留）：如 "葱 2根、姜 3片、蒜 3瓣"、"盐 适量、糖 5g、白胡椒 少许"。不要每种调料单独一行。

{
  "title": "菜谱标题（简洁有趣，包含emoji）",
  "description": "简短描述（一句话）",
  "time": "XX min",
  "type": "早餐/午餐/晚餐/其他",
  "emoji": "🍳",
  "ingredients": ["2个 鸡蛋", "30ml 牛奶", "葱 2根、姜 3片、蒜 3瓣", "盐 适量、糖 5g"],
  "steps": ["步骤1", "步骤2"],
  "tips": "可选的专业建议"
}`;

    const content = await this.chat([
      {
        role: 'system',
        content: '你是一个专业的菜谱生成助手，擅长根据视频或文字内容生成详细、实用的菜谱。只返回JSON，不要markdown代码块。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    return this._parseRecipeJson(content);
  }

  /**
   * 生成每日灵感菜谱
   */
  async generateDailyInspiration(count = 3, mealType = null) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];

    const typeHint = mealType ? `，类型为「${mealType}」` : '，包含早餐、午餐、晚餐各一道';

    const prompt = `今天是${dateStr} ${weekday}。请为今日灵感推荐 ${count} 道家常菜谱${typeHint}。

每道菜谱严格以JSON格式返回，整体为一个数组：
[
  {
    "title": "菜谱标题 🍳",
    "description": "简短描述",
    "time": "XX min",
    "type": "早餐/午餐/晚餐",
    "emoji": "🍳",
    "ingredients": ["食材1", "食材2"],
    "steps": ["步骤1", "步骤2"]
  }
]

只返回JSON数组，不要其他说明。`;

    const content = await this.chat([
      {
        role: 'system',
        content: '你是美食推荐助手，根据日期和时节推荐适合的家常菜谱。只返回JSON数组。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const recipes = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      return Array.isArray(recipes) ? recipes : [recipes];
    } catch (e) {
      console.error('解析每日灵感失败:', e);
      return [];
    }
  }

  _parseRecipeJson(content) {
    try {
      // 尝试提取 JSON（可能被 markdown 代码块包裹）
      let jsonStr = content.trim();
      
      // 移除 markdown 代码块标记
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      
      // 提取 JSON 对象
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('未找到有效的 JSON 对象');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);

      const colorMap = { '早餐': '#FFF7ED', '午餐': '#F5F3FF', '晚餐': '#EFF6FF', '其他': '#F0F9FF' };
      const validTypes = ['早餐', '午餐', '晚餐', '其他'];
      const rawType = (recipeData.type || '其他').trim();
      const type = validTypes.includes(rawType) ? rawType : (validTypes.find(t => rawType.includes(t)) || '其他');

      // 处理 ingredients：如果包含【主料】【辅料】【调料】标记，保持原样；否则添加 emoji
      let ingredients = recipeData.ingredients || [];
      if (ingredients.length > 0 && !ingredients[0].includes('【')) {
        // 如果没有分类标记，尝试添加 emoji（兼容旧格式）
        ingredients = ingredients.map(ing => {
          if (!ing.includes('🥚') && !ing.includes('🥛') && !ing.includes('🧂')) {
            // 简单 emoji 映射
            if (ing.includes('鸡蛋') || ing.includes('蛋')) return ing + ' 🥚';
            if (ing.includes('牛奶') || ing.includes('奶')) return ing + ' 🥛';
            if (ing.includes('盐') || ing.includes('糖') || ing.includes('油')) return ing + ' 🧂';
          }
          return ing;
        });
      }
      
      return {
        title: recipeData.title || '美味菜谱 🍳',
        description: recipeData.description || 'AI生成的精美菜谱',
        time: recipeData.time || '15 min',
        type: type,
        emoji: recipeData.emoji || '🍳',
        ingredients: ingredients,
        steps: recipeData.steps || [],
        tips: recipeData.tips || '',
        color: colorMap[type] || '#F0F9FF'
      };
    } catch (e) {
      console.error('菜谱JSON解析失败:', e.message);
      console.error('原始内容:', content.substring(0, 500));
      throw new Error('菜谱JSON解析失败: ' + e.message);
    }
  }
}

module.exports = new QwenService();
