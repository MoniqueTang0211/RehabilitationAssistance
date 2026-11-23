// 语音转写服务：调用百度短语音识别 REST API（方案2，替换浏览器 Web Speech API）
// 前端录音统一解码重采样为 16k / 单声道 / 16bit PCM WAV，以 base64 上传，本服务负责校验与转写。
const config = require('../config')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, SERVER_ERROR } = require('../utils/errorCode')

const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token'
const ASR_URL = 'https://vop.baidu.com/server_api'
const CUID = 'elder-rehab-server'

const SAMPLE_RATE = 16000
const BYTES_PER_SECOND = SAMPLE_RATE * 2 // 16bit 单声道
const MAX_SECONDS = 60
const MAX_BYTES = BYTES_PER_SECOND * MAX_SECONDS // 1,920,000
const MAX_BASE64_LENGTH = Math.ceil(MAX_BYTES / 3) * 4 + 1024 // 留出余量

// access_token 有效期约 30 天，进程内缓存并提前 5 分钟刷新
let tokenCache = { value: '', expiresAt: 0 }

async function getAccessToken() {
  const { apiKey, secretKey } = config.baiduAsr
  if (!apiKey || !secretKey) {
    throw new BusinessError(SERVER_ERROR, '语音识别服务尚未开通，请联系管理员配置百度语音识别密钥，或改用文字留言。')
  }

  const now = Date.now()
  if (tokenCache.value && tokenCache.expiresAt > now) {
    return tokenCache.value
  }

  const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`
  let payload
  try {
    const response = await fetch(url, { method: 'POST' })
    payload = await response.json()
  } catch {
    throw new BusinessError(SERVER_ERROR, '连接语音识别服务失败，请检查网络后重试。')
  }

  if (!payload || !payload.access_token) {
    const errorDescription = payload && payload.error_description ? payload.error_description : ''
    throw new BusinessError(SERVER_ERROR, `语音识别服务鉴权失败${errorDescription ? `：${errorDescription}` : '，请检查密钥配置'}。`)
  }

  const expiresInMs = Math.max(Number(payload.expires_in) || 0, 60) * 1000
  tokenCache = {
    value: payload.access_token,
    expiresAt: now + expiresInMs - 5 * 60 * 1000
  }
  return tokenCache.value
}

// 解析 WAV（RIFF）的 fmt / data 块，返回 PCM 数据；不符合 16k/单声道/16bit 的输入一律拒绝
function parsePcmWav(buffer) {
  if (buffer.length < 44) {
    throw new BusinessError(PARAM_ERROR, '语音数据不完整，请重新录音。')
  }
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new BusinessError(PARAM_ERROR, '语音数据格式不正确，请重新录音。')
  }

  let fmt = null
  let pcm = null
  let offset = 12
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const bodyStart = offset + 8
    if (bodyStart + chunkSize > buffer.length) {
      break
    }
    if (chunkId === 'fmt ') {
      fmt = {
        audioFormat: buffer.readUInt16LE(bodyStart),
        channels: buffer.readUInt16LE(bodyStart + 2),
        sampleRate: buffer.readUInt32LE(bodyStart + 4),
        bitsPerSample: buffer.readUInt16LE(bodyStart + 14)
      }
    } else if (chunkId === 'data') {
      pcm = buffer.subarray(bodyStart, bodyStart + chunkSize)
    }
    offset = bodyStart + chunkSize + (chunkSize % 2)
  }

  if (!fmt || !pcm) {
    throw new BusinessError(PARAM_ERROR, '语音数据格式不正确，请重新录音。')
  }
  if (fmt.audioFormat !== 1 || fmt.channels !== 1 || fmt.sampleRate !== SAMPLE_RATE || fmt.bitsPerSample !== 16) {
    throw new BusinessError(PARAM_ERROR, '语音采样格式不受支持，请重新录音。')
  }
  if (pcm.length === 0) {
    throw new BusinessError(PARAM_ERROR, '没有录到声音，请重新录音。')
  }
  if (pcm.length > MAX_BYTES) {
    throw new BusinessError(PARAM_ERROR, '录音时长不能超过 60 秒，请重新录音。')
  }
  return pcm
}

// 百度短语音识别常见错误码 -> 用户可读提示
function describeBaiduError(errNo, errMsg) {
  const messages = {
    3300: '语音识别请求参数有误，请重新录音。',
    3301: '没有听清内容，请靠近麦克风重新录音。',
    3307: '语音数据有误，请重新录音。',
    3309: '语音识别服务暂时不可用，请稍后重试。',
    3310: '语音识别请求超时，请稍后重试。',
    3311: '语音识别内部错误，请稍后重试。',
    3312: '录音过长或音频格式不支持，请重新录制约 60 秒内的语音。',
    3314: '录音过长，请控制在 60 秒以内。'
  }
  return messages[errNo] || `语音识别失败（${errNo}），请稍后重试或改用文字留言。`
}

async function transcribe(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BusinessError(PARAM_ERROR, '语音转写请求参数不正确')
  }

  const { audio } = input
  if (typeof audio !== 'string' || !audio) {
    throw new BusinessError(PARAM_ERROR, '请提供录音数据')
  }
  if (audio.length > MAX_BASE64_LENGTH) {
    throw new BusinessError(PARAM_ERROR, '录音数据过大，请重新录制约 60 秒内的语音。')
  }

  let buffer
  try {
    buffer = Buffer.from(audio, 'base64')
  } catch {
    throw new BusinessError(PARAM_ERROR, '录音数据解析失败，请重新录音。')
  }

  const pcm = parsePcmWav(buffer)

  const token = await getAccessToken()
  const body = {
    format: 'pcm',
    rate: SAMPLE_RATE,
    channel: 1,
    cuid: CUID,
    token,
    dev_pid: config.baiduAsr.devPid,
    speech: pcm.toString('base64'),
    len: pcm.length
  }

  let result
  try {
    const response = await fetch(ASR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    result = await response.json()
  } catch {
    throw new BusinessError(SERVER_ERROR, '连接语音识别服务失败，请检查网络后重试。')
  }

  // token 失效（3300/3308 等）时清缓存重试一次
  if (result && (result.err_no === 3308 || (result.err_no === 3300 && /token/i.test(String(result.err_msg || ''))))) {
    tokenCache = { value: '', expiresAt: 0 }
    const freshToken = await getAccessToken()
    try {
      const retry = await fetch(ASR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, token: freshToken })
      })
      result = await retry.json()
    } catch {
      throw new BusinessError(SERVER_ERROR, '连接语音识别服务失败，请检查网络后重试。')
    }
  }

  if (!result || result.err_no !== 0) {
    const errNo = result ? result.err_no : -1
    throw new BusinessError(SERVER_ERROR, describeBaiduError(errNo, result && result.err_msg))
  }

  const text = Array.isArray(result.result) && typeof result.result[0] === 'string'
    ? result.result[0].trim()
    : ''
  if (!text) {
    throw new BusinessError(PARAM_ERROR, '没有听清内容，请靠近麦克风重新录音。')
  }

  return { text }
}

module.exports = { transcribe }
