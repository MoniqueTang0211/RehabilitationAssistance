import request from './request'

// 上传录音（16k 单声道 16bit PCM WAV 的 base64），返回 { text }
// 识别需上传约 2.6MB 并等待百度 ASR 返回，单独放宽超时时间
export function transcribeSpeech(audioBase64) {
  return request.post('/speech/transcribe', { audio: audioBase64 }, { timeout: 30000 })
}
