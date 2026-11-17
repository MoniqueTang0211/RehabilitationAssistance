// JWT 校验中间件（负责人：A）
// TODO(A)：解析 Authorization: Bearer <token>，校验通过后将 userId 挂到 req.userId
// 校验失败返回 40101（通过 next(BusinessError) 交给异常中间件）
const { BusinessError } = require('../utils/response')
const { UNAUTHORIZED } = require('../utils/errorCode')

module.exports = function authMiddleware(req, res, next) {
  next(new BusinessError(UNAUTHORIZED, '未登录'))
}
