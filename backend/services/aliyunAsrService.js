const axios = require('axios');

/**
 * 阿里云 录音文件识别
 * 支持两种方式（通过 ASR_PROVIDER 选择）：
 * - dashscope：百炼 Paraformer，使用 DASHSCOPE_API_KEY
 * - isi2：智能语音交互 2.0，使用 NLS_APPKEY + 阿里云 AccessKey（可与 OSS 共用）
 */
const PROVIDER = (process.env.ASR_PROVIDER || 'dashscope').toLowerCase();
const IS_ISI2 = PROVIDER === 'isi2';

// 智能语音 2.0 地域对应 domain
const ISI2_DOMAINS = {
  'cn-shanghai': 'https://filetrans.cn-shanghai.aliyuncs.com',
  'cn-beijing': 'https://filetrans.cn-beijing.aliyuncs.com',
  'cn-shenzhen': 'https://filetrans.cn-shenzhen.aliyuncs.com'
};

class AliyunAsrService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.submitUrl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription';
    this.model = process.env.ASR_MODEL || 'paraformer-v2';
    this.pollInterval = 2000;
    this.maxWaitTime = 5 * 60 * 1000;

    // 智能语音 2.0
    this.nlsAppKey = process.env.NLS_APPKEY;
    this.nlsRegion = process.env.NLS_REGION || 'cn-shanghai';
    this.isi2AccessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || process.env.OSS_ACCESS_KEY_ID;
    this.isi2AccessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || process.env.OSS_ACCESS_KEY_SECRET;
    this._isi2Client = null;
  }

  _getIsi2Client() {
    if (this._isi2Client) return this._isi2Client;
    if (!this.isi2AccessKeyId || !this.isi2AccessKeySecret) return null;
    const endpoint = ISI2_DOMAINS[this.nlsRegion] || ISI2_DOMAINS['cn-shanghai'];
    try {
      const RPCClient = require('@alicloud/pop-core').RPCClient;
      this._isi2Client = new RPCClient({
        accessKeyId: this.isi2AccessKeyId,
        accessKeySecret: this.isi2AccessKeySecret,
        endpoint,
        apiVersion: '2018-08-17'
      });
      return this._isi2Client;
    } catch (e) {
      console.warn('智能语音 2.0 客户端初始化失败:', e.message);
      return null;
    }
  }

  /**
   * 提交任务（百炼）
   */
  async _submitTaskDashScope(fileUrls) {
    const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    if (urls.length === 0 || !urls[0]) throw new Error('请提供有效的音视频文件 URL');

    const response = await axios.post(
      this.submitUrl,
      {
        model: this.model,
        input: { file_urls: urls },
        parameters: { language_hints: ['zh', 'en'], disfluency_removal_enabled: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable'
        },
        timeout: 30000
      }
    );

    if (response.data.code) {
      throw new Error(response.data.message || '提交识别任务失败');
    }
    const taskId = response.data?.output?.task_id;
    if (!taskId) throw new Error('未获取到任务 ID');
    return taskId;
  }

  /**
   * 提交任务（智能语音 2.0）
   */
  async _submitTaskIsi2(fileUrl) {
    const client = this._getIsi2Client();
    if (!client) throw new Error('未配置智能语音 2.0：ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET（或 OSS 的 AK/SK）');
    if (!this.nlsAppKey) throw new Error('未配置 NLS_APPKEY（智能语音交互控制台项目 AppKey）');

    const taskBody = {
      appkey: this.nlsAppKey,
      file_link: fileUrl,
      version: '4.0',
      enable_words: false
    };

    let res;
    try {
      res = await client.request('SubmitTask', {
        task: JSON.stringify(taskBody)
      }, { method: 'POST', timeout: 30000 });
    } catch (e) {
      const errMsg = e && e.message ? e.message : String(e || '未知错误');
      throw new Error(`提交 ASR 任务失败: ${errMsg}`);
    }

    if (!res || typeof res !== 'object') {
      throw new Error('提交 ASR 任务失败：返回数据格式错误');
    }

    const statusText = res.StatusText || res.statusText || '';
    const taskId = res.TaskId || res.taskId;

    if (String(statusText).toUpperCase() !== 'SUCCESS' || !taskId) {
      const errMsg = res.Message || res.message || '提交识别任务失败';
      throw new Error(errMsg);
    }
    return taskId;
  }

  /**
   * 查询结果（百炼）
   */
  async _getTaskResultDashScope(taskId) {
    const response = await axios.get(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );
    if (response.data.code) {
      throw new Error(response.data.message || '查询任务失败');
    }
    return response.data.output;
  }

  /**
   * 查询结果（智能语音 2.0）
   */
  async _getTaskResultIsi2(taskId) {
    const client = this._getIsi2Client();
    if (!client) throw new Error('智能语音 2.0 客户端未初始化');

    const res = await client.request('GetTaskResult', {
      taskId
    }, { method: 'GET', timeout: 15000 });

    if (!res || typeof res !== 'object') {
      return { statusText: '', statusCode: null, result: null };
    }

    return {
      statusText: res.StatusText || res.statusText || '',
      statusCode: res.StatusCode ?? res.statusCode ?? null,
      result: res.Result || res.result || null
    };
  }

  _extractTranscriptDashScope(transcriptionData) {
    if (!transcriptionData?.transcripts) return '';
    const parts = [];
    for (const t of transcriptionData.transcripts) {
      if (t.sentences) {
        for (const s of t.sentences) {
          if (s.text) parts.push(s.text);
        }
      } else if (t.text) {
        parts.push(t.text);
      }
    }
    return parts.join('\n').trim();
  }

  /**
   * 识别音视频并返回转写文本（同步等待完成）
   */
  async transcribe(fileUrl) {
    if (IS_ISI2) {
      return this._transcribeIsi2(fileUrl);
    }
    return this._transcribeDashScope(fileUrl);
  }

  async _transcribeIsi2(fileUrl) {
    const taskId = await this._submitTaskIsi2(fileUrl);
    const startTime = Date.now();
    const pollInterval = 3000;

    while (Date.now() - startTime < this.maxWaitTime) {
      const output = await this._getTaskResultIsi2(taskId);
      if (!output || typeof output !== 'object') {
        throw new Error('获取识别结果失败：返回数据格式错误');
      }
      const statusText = String(output.statusText || '').toUpperCase();

      if (statusText === 'SUCCESS') {
        const result = output.result;
        if (!result || !result.Sentences && !result.sentences) {
          return '';
        }
        const sentences = result.Sentences || result.sentences || [];
        const texts = sentences.map(s => (s.Text || s.text || '').trim()).filter(Boolean);
        return texts.join('\n').trim();
      }

      if (statusText === 'FILE_DOWNLOAD_FAILED' || statusText === 'FAILED' || (output.statusCode && output.statusCode !== 21050001 && output.statusCode !== 21050002)) {
        throw new Error('语音识别任务失败: ' + (output.statusText || output.statusCode || ''));
      }

      await new Promise(r => setTimeout(r, pollInterval));
    }

    throw new Error('语音识别超时');
  }

  async _transcribeDashScope(fileUrl) {
    const taskId = await this._submitTaskDashScope(fileUrl);
    const startTime = Date.now();

    while (Date.now() - startTime < this.maxWaitTime) {
      const output = await this._getTaskResultDashScope(taskId);
      const status = output.task_status;

      if (status === 'SUCCEEDED') {
        const results = output.results || [];
        const transcripts = [];
        for (const r of results) {
          if (r.transcription_url && r.subtask_status === 'SUCCEEDED') {
            try {
              const res = await axios.get(r.transcription_url);
              const text = this._extractTranscriptDashScope(res.data);
              if (text) transcripts.push(text);
            } catch (e) {
              console.warn('获取转写结果失败:', e.message);
            }
          }
        }
        return transcripts.join('\n\n').trim() || '';
      }

      if (status === 'FAILED') {
        throw new Error('语音识别任务失败');
      }

      await new Promise(r => setTimeout(r, this.pollInterval));
    }

    throw new Error('语音识别超时');
  }

  isAvailable() {
    if (IS_ISI2) {
      return !!(this.nlsAppKey && this.isi2AccessKeyId && this.isi2AccessKeySecret && this._getIsi2Client());
    }
    return !!this.apiKey;
  }
}

module.exports = new AliyunAsrService();
