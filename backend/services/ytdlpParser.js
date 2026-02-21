const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');

const execFileAsync = promisify(execFile);

/**
 * 使用 yt-dlp 解析视频信息
 * 需要：yt-dlp（系统安装）、ffmpeg（优先用项目自带 @ffmpeg-installer/ffmpeg，无需 Homebrew）
 * 返回标题、描述、封面、视频/音频直链（可用于 ASR）
 */
class YtdlpParser {
  static getCommand() {
    return process.env.YT_DLP_PATH || 'yt-dlp';
  }

  /** ffmpeg 路径：优先环境变量 → 项目自带 @ffmpeg-installer/ffmpeg → 系统 ffmpeg */
  static getFfmpegCommand() {
    if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
    try {
      return require('@ffmpeg-installer/ffmpeg').path;
    } catch (e) {
      return 'ffmpeg';
    }
  }

  /** ffprobe 路径（与 ffmpeg 同目录或环境变量） */
  static getFfprobeCommand() {
    if (process.env.FFPROBE_PATH) return process.env.FFPROBE_PATH;
    const ff = this.getFfmpegCommand();
    const dir = path.dirname(ff);
    const base = path.basename(ff);
    if (base.toLowerCase() === 'ffmpeg') return path.join(dir, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    return 'ffprobe';
  }

  /**
   * 检查 yt-dlp 是否可用
   */
  static async isAvailable() {
    try {
      await execFileAsync(this.getCommand(), ['--version'], { timeout: 3000 });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 检查 ffmpeg 是否可用（下载音频 -x 必须；优先用项目自带的无需系统安装）
   */
  static async isFfmpegAvailable() {
    const ffmpeg = this.getFfmpegCommand();
    try {
      await execFileAsync(ffmpeg, ['-version'], { timeout: 3000 });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 下载前必须通过，否则抛错并提示
   */
  static async ensureFfmpegForDownload() {
    const ok = await this.isFfmpegAvailable();
    if (ok) return;
    const useBundled = !process.env.FFMPEG_PATH && (() => { try { require.resolve('@ffmpeg-installer/ffmpeg'); return true; } catch (_) { return false; } })();
    const hint = useBundled
      ? '请在本项目 backend 目录执行：npm install'
      : process.platform === 'darwin'
        ? '请安装 ffmpeg（如 brew install ffmpeg），或在本项目 backend 执行 npm install 使用自带 ffmpeg'
        : process.platform === 'win32'
          ? '请安装 ffmpeg 并加入 PATH，或在本项目 backend 执行 npm install'
          : '请安装 ffmpeg（如 apt install ffmpeg）或在本项目 backend 执行 npm install';
    throw new Error(`yt-dlp 提取音频需要 ffmpeg，当前未检测到。${hint}`);
  }

  /**
   * 使用 yt-dlp 解析视频，返回元数据 + 最佳音视频 URL
   */
  static async parse(url) {
    const cmd = this.getCommand();
    const args = [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-check-certificate',
      url
    ];

    try {
      const { stdout, stderr } = await execFileAsync(cmd, args, {
        timeout: 30000,
        maxBuffer: 2 * 1024 * 1024
      });

      if (stderr && !stdout) {
        throw new Error(stderr.trim() || 'yt-dlp 无输出');
      }

      const data = JSON.parse(stdout.trim());

      const title = data.title || data.fulltitle || '未知视频';
      const description = (data.description || '').slice(0, 500);
      const thumbnail = data.thumbnail || (data.thumbnails && data.thumbnails[0] && data.thumbnails[0].url) || '';

      // 从 formats 中优先取音频或视频直链（用于 ASR 需公网可访问，yt-dlp 的 URL 可能有时效）
      let mediaUrl = data.url || null;
      if (!mediaUrl && data.formats && data.formats.length > 0) {
        const withUrl = data.formats.filter(f => f.url && f.url.startsWith('http'));
        const best = withUrl.find(f => f.vcodec !== 'none' || f.acodec !== 'none') || withUrl[0];
        mediaUrl = best ? best.url : null;
      }

      const platform = this._detectPlatform(url);

      return {
        platform,
        title,
        description,
        url,
        thumbnail,
        mediaUrl: mediaUrl && mediaUrl.startsWith('http') ? mediaUrl : null
      };
    } catch (e) {
      const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
      throw new Error(`yt-dlp 解析失败: ${msg}`);
    }
  }

  /**
   * 下载视频音频到本地文件（用于上传 OSS 后做 ASR）
   * 依赖：yt-dlp、ffmpeg/ffprobe（未安装会抛错并提示）
   * 自动转换为 16kHz 采样率（符合阿里云 ASR 要求）
   * @param {string} url - 视频链接
   * @returns {Promise<string>} 本地音频文件路径（16kHz m4a）
   */
  static async downloadAudio(url) {
    await this.ensureFfmpegForDownload();

    const cmd = this.getCommand();
    const ext = 'm4a';
    const tmpDir = os.tmpdir();
    const tmpSub = path.join(tmpDir, `recipe-asr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpSub, { recursive: true });
    const outPath = path.join(tmpSub, `audio.%(ext)s`);

    const args = [
      '-x',
      '--audio-format', ext,
      '--audio-quality', '0',
      '--no-warnings',
      '--no-check-certificate',
      '-o', outPath,
      '--max-filesize', '50M',
      '--no-playlist',
      '--postprocessor-args', 'ffmpeg:-ar 16000', // 转换为 16kHz 采样率
      url
    ];

    const ffmpegDir = path.dirname(this.getFfmpegCommand());
    const env = { ...process.env, PATH: ffmpegDir + path.delimiter + (process.env.PATH || '') };
    await execFileAsync(cmd, args, {
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
      env
    });

    const finalPath = path.join(tmpSub, `audio.${ext}`);
    if (!fs.existsSync(finalPath)) {
      const files = fs.readdirSync(tmpSub);
      const audioFile = files.find(f => /\.(m4a|webm|mp3)$/i.test(f));
      if (audioFile) {
        const foundPath = path.join(tmpSub, audioFile);
        // 如果找到的文件不是 16kHz，用 ffmpeg 转换
        return await this._ensure16kHz(foundPath, tmpSub);
      }
      throw new Error('yt-dlp 未生成音频文件');
    }
    
    // 验证并确保是 16kHz
    return await this._ensure16kHz(finalPath, tmpSub);
  }

  /**
   * 确保音频文件是 16kHz 采样率（阿里云 ASR 要求）
   */
  static async _ensure16kHz(audioPath, tmpDir) {
    const ffmpeg = this.getFfmpegCommand();
    const outputPath = path.join(tmpDir, 'audio_16k.m4a');
    
    try {
      // 使用 ffmpeg 转换为 16kHz 单声道 m4a
      await execFileAsync(ffmpeg, [
        '-i', audioPath,
        '-ar', '16000',  // 采样率 16kHz
        '-ac', '1',      // 单声道
        '-c:a', 'aac',   // 编码为 AAC
        '-b:a', '64k',   // 比特率 64k
        '-y',            // 覆盖输出文件
        outputPath
      ], {
        timeout: 60000,
        maxBuffer: 2 * 1024 * 1024
      });
      
      if (fs.existsSync(outputPath)) {
        // 删除原始文件（如果不同）
        if (audioPath !== outputPath && fs.existsSync(audioPath)) {
          try { fs.unlinkSync(audioPath); } catch (_) {}
        }
        return outputPath;
      }
    } catch (e) {
      console.warn('ffmpeg 转换采样率失败，使用原始文件:', e.message);
    }
    
    // 如果转换失败，返回原始文件（让 ASR 服务自己处理）
    return audioPath;
  }

  static _detectPlatform(url) {
    if (url.includes('douyin.com') || url.includes('iesdouyin.com')) return 'douyin';
    if (url.includes('bilibili.com')) return 'bilibili';
    if (url.includes('kuaishou.com') || url.includes('chenzhongtech.com')) return 'kuaishou';
    if (url.includes('xiaohongshu.com')) return 'xiaohongshu';
    return 'unknown';
  }
}

module.exports = YtdlpParser;
