// JWT 校验中间件（负责人：A）：校验通过后将 userId 挂到 req.userId，业务层以此过滤数据
const jwt = require('jsonwebtoken')
const config = require('../config')
const { BusinessError } = require('../utils/response')
const { UNAUTHORIZED } = require('../utils/errorCode')

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    return next(new BusinessError(UNAUTHORIZED, '未登录'))
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.userId = decoded.userId
    next()
  } catch (err) {
    next(new BusinessError(UNAUTHORIZED, '登录已失效，请重新登录'))
  }
}
