// 配置读取（A / 底座负责人维护）：只读 env，业务代码禁止硬编码端口、密钥、地址
require('dotenv').config()

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'elder-rehab-dev-secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  dataDir: process.env.DATA_DIR || './data',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // 百度短语音识别（REST API）：未配置 key 时语音转写接口返回友好提示
  baiduAsr: {
    apiKey: process.env.BAIDU_API_KEY || '',
    secretKey: process.env.BAIDU_SECRET_KEY || '',
    devPid: Number(process.env.BAIDU_ASR_DEV_PID) || 1537 // 1537=普通话输入法模型
  }
}
