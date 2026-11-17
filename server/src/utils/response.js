// 统一响应与业务异常（A / 底座负责人维护）
// 全项目响应格式固定：{ code, message, data }

// 成功响应
function ok(data = null, message = 'ok') {
  return { code: 0, message, data }
}

// 业务异常：Service 层抛出，由统一异常中间件捕获转换
class BusinessError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

module.exports = { ok, BusinessError }
