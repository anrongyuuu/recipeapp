const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');

let _client = null;

function hasEnv() {
  return !!(process.env.OSS_REGION && process.env.OSS_BUCKET && process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET);
}

function getClient() {
  if (_client) return _client;
  if (!hasEnv()) return null;
  
  // 确保所有参数都是非空字符串
  const region = String(process.env.OSS_REGION || '').trim();
  const bucket = String(process.env.OSS_BUCKET || '').trim();
  const accessKeyId = String(process.env.OSS_ACCESS_KEY_ID || '').trim();
  const accessKeySecret = String(process.env.OSS_ACCESS_KEY_SECRET || '').trim();
  
  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    console.error('OSS 配置不完整:', {
      region: region || '未设置',
      bucket: bucket || '未设置',
      accessKeyId: accessKeyId ? '已设置' : '未设置',
      accessKeySecret: accessKeySecret ? '已设置' : '未设置'
    });
    return null;
  }
  
  // 验证 region 格式（应该是 oss-cn-xxx 格式）
  if (!region.match(/^oss-cn-[a-z0-9-]+$/i)) {
    console.warn(`OSS_REGION 格式可能不正确: ${region}，期望格式: oss-cn-hangzhou`);
  }
  
  try {
    const OSS = require('ali-oss');
    
    // 构建 endpoint（region 格式：oss-cn-hangzhou -> https://oss-cn-hangzhou.aliyuncs.com）
    let endpoint = `https://${region}.aliyuncs.com`;
    if (!region.startsWith('oss-')) {
      endpoint = `https://oss-${region}.aliyuncs.com`;
    }
    
    // 显式传入所有参数，确保类型正确
    // 注意：ali-oss 的 signatureUrl 需要 accessKeyId/accessKeySecret 在客户端实例中正确保存
    const config = {
      region: String(region),
      bucket: String(bucket),
      accessKeyId: String(accessKeyId),
      accessKeySecret: String(accessKeySecret),
      endpoint: endpoint
    };
    
    _client = new OSS(config);
    
    // 验证 client 创建成功，并检查内部属性
    if (!_client || typeof _client.put !== 'function' || typeof _client.signatureUrl !== 'function') {
      throw new Error('OSS 客户端创建失败：缺少必要方法');
    }
    
    // 验证关键属性是否存在（ali-oss 内部可能使用这些属性）
    if (!_client.options || !_client.options.accessKeyId || !_client.options.accessKeySecret) {
      console.warn('OSS 客户端内部配置可能不完整，尝试重新初始化...');
      // 如果内部配置丢失，重新创建
      _client = new OSS(config);
    }
    
    return _client;
  } catch (e) {
    console.error('OSS 初始化失败（ali-oss 报错）:', e.message);
    if (e.code) console.error('  错误码:', e.code);
    if (e.stack) console.error('  堆栈:', e.stack);
    _client = null;
    return null;
  }
}

/**
 * 是否已配置 OSS（用于决定是否走「下载音频 → 上传 → ASR」流程）
 */
function isConfigured() {
  return hasEnv() && !!getClient();
}

/**
 * 上传本地文件到 OSS 并返回可公网访问的签名 URL（供阿里云 ASR 拉取）
 * @param {string} localPath - 本地文件路径
 * @param {string} [objectName] - OSS 对象名，不传则自动生成
 * @returns {Promise<string>} 签名 GET URL，有效期 1 小时
 */
async function uploadAndGetUrl(localPath, objectName) {
  const client = getClient();
  if (!client) throw new Error('OSS 未配置');
  if (!fs.existsSync(localPath)) throw new Error('本地文件不存在: ' + localPath);
  
  // 验证 client 方法存在
  if (typeof client.put !== 'function' || typeof client.signatureUrl !== 'function') {
    throw new Error('OSS 客户端方法不完整，请检查配置');
  }

  const name = objectName || `recipe-asr/${Date.now()}-${path.basename(localPath)}`;
  
  // 分步执行，便于定位错误
  try {
    console.log('📤 开始上传到 OSS:', name);
    await client.put(name, localPath);
    console.log('✅ OSS 上传成功');
  } catch (e) {
    const errMsg = e && e.message ? e.message : String(e || '上传失败');
    console.error('❌ OSS put() 失败:', errMsg);
    if (e && e.stack) console.error('堆栈:', e.stack);
    throw new Error(`OSS 上传失败: ${errMsg}`);
  }
  
  try {
    console.log('🔗 生成签名 URL...');
    
    // 重新创建客户端，确保配置完整（ali-oss 6.23.0 可能在 signatureUrl 时需要重新初始化）
    const region = String(process.env.OSS_REGION || '').trim();
    const bucket = String(process.env.OSS_BUCKET || '').trim();
    const accessKeyId = String(process.env.OSS_ACCESS_KEY_ID || '').trim();
    const accessKeySecret = String(process.env.OSS_ACCESS_KEY_SECRET || '').trim();
    
    if (!region || !bucket || !accessKeyId || !accessKeySecret) {
      throw new Error('OSS 配置不完整');
    }
    
    const OSS = require('ali-oss');
    const endpoint = `https://${region}.aliyuncs.com`;
    
    // 创建一个新的客户端实例专门用于生成签名 URL
    const urlClient = new OSS({
      region: region,
      bucket: bucket,
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
      endpoint: endpoint
    });
    
    // 使用新客户端生成签名 URL（正确格式：signatureUrl(name, options)）
    const url = urlClient.signatureUrl(name, { method: 'GET', expires: 3600 });
    if (!url || typeof url !== 'string') {
      throw new Error('OSS 签名 URL 生成失败：返回非字符串');
    }
    console.log('✅ 签名 URL 生成成功');
    return url;
  } catch (e) {
    const errMsg = e && e.message ? e.message : String(e || '签名 URL 生成失败');
    console.error('❌ OSS signatureUrl() 失败:', errMsg);
    if (e && e.stack) console.error('堆栈:', e.stack);
    throw new Error(`OSS 签名 URL 生成失败: ${errMsg}`);
  }
}

/**
 * 从图片 URL 下载并上传到 OSS，返回可长期使用的签名 URL（用于视频封面等）
 * 这样封面不依赖平台外链是否过期，且访问稳定。
 * @param {string} imageUrl - 图片地址（如 yt-dlp 返回的 thumbnail）
 * @returns {Promise<string>} 签名 URL，默认 30 天有效
 */
async function uploadImageFromUrl(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error('无效的图片 URL');
  }
  const client = getClient();
  if (!client) throw new Error('OSS 未配置');

  let ext = '.jpg';
  try {
    const u = new URL(imageUrl);
    const p = (u.pathname || '').split('?')[0];
    if (p && path.extname(p)) ext = path.extname(p);
  } catch (_) {}
  const tmpFile = path.join(os.tmpdir(), `recipe-cover-${Date.now()}${ext}`);

  try {
    console.log('📥 下载视频封面:', imageUrl);
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024, // 5MB
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeApp/1.0)',
        'Referer': new URL(imageUrl).origin + '/'
      },
      validateStatus: (status) => status === 200
    });
    fs.writeFileSync(tmpFile, res.data);
    const objectName = `recipe-cover/${Date.now()}-${path.basename(tmpFile)}`;
    console.log('📤 上传封面到 OSS:', objectName);
    await client.put(objectName, tmpFile);

    const region = String(process.env.OSS_REGION || '').trim();
    const bucket = String(process.env.OSS_BUCKET || '').trim();
    const accessKeyId = String(process.env.OSS_ACCESS_KEY_ID || '').trim();
    const accessKeySecret = String(process.env.OSS_ACCESS_KEY_SECRET || '').trim();
    if (!region || !bucket || !accessKeyId || !accessKeySecret) {
      throw new Error('OSS 配置不完整');
    }
    const OSS = require('ali-oss');
    const urlClient = new OSS({
      region,
      bucket,
      accessKeyId,
      accessKeySecret,
      endpoint: `https://${region}.aliyuncs.com`
    });
    // 封面图用 30 天有效期，避免存库的 URL 很快过期
    const url = urlClient.signatureUrl(objectName, { method: 'GET', expires: 86400 * 30 });
    if (!url || typeof url !== 'string') throw new Error('签名 URL 生成失败');
    console.log('✅ 封面已上传并生成 30 天有效 URL');
    return url;
  } finally {
    try {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    } catch (_) {}
  }
}

/**
 * 检查 URL 是否可被外网访问（用于上传后确认 ASR 能拉取，避免 403）
 */
async function checkUrlAccessible(url) {
  if (!url || !url.startsWith('http')) return false;
  try {
    const res = await axios.head(url, { timeout: 10000, maxRedirects: 3, validateStatus: () => true });
    if (res.status === 200) return true;
    if (res.status === 403 || res.status === 405) {
      const getRes = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 3,
        validateStatus: () => true,
        headers: { Range: 'bytes=0-0' },
        maxContentLength: 1
      });
      return getRes.status === 200 || getRes.status === 206;
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  isConfigured,
  uploadAndGetUrl,
  uploadImageFromUrl,
  checkUrlAccessible,
  getClient
};
