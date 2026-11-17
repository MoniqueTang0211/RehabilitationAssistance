// 统一异常捕获中间件（A / 底座负责人维护）
// Controller 不写 try/catch，所有异常统一到这里转换为 { code, message, data: null }
const { BusinessError } = require('../utils/response')
const { SERVER_ERROR } = require('../utils/errorCode')

module.exports = function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof BusinessError) {
    if (err.code >= 50000) {
      console.error(`[ERROR] ${new Date().toISOString()} code=${err.code} message=${err.message}\n${err.stack}`)
    } else {
      console.warn(`[WARN] ${new Date().toISOString()} code=${err.code} message=${err.message}`)
    }
    return res.status(200).json({ code: err.code, message: err.message, data: null })
  }
  // 未预期异常
  console.error(`[ERROR] ${new Date().toISOString()} ${err.stack}`)
  res.status(200).json({ code: SERVER_ERROR, message: '服务异常，请稍后再试', data: null })
}
