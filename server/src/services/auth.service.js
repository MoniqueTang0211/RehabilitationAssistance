// 登录业务（负责人：A）：校验密码（bcryptjs）、签发 JWT
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const userRepository = require('../repositories/user.repository')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, UNAUTHORIZED } = require('../utils/errorCode')

async function login(username, password) {
  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    throw new BusinessError(PARAM_ERROR, '请输入用户名和密码')
  }
  const user = userRepository.findByName(username.trim())
  // 用户不存在与密码错误返回同一提示，避免暴露账号是否存在
  if (!user) {
    throw new BusinessError(UNAUTHORIZED, '用户名或密码错误')
  }
  const matched = await bcrypt.compare(password, user.passwordHash)
  if (!matched) {
    throw new BusinessError(UNAUTHORIZED, '用户名或密码错误')
  }
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpire })
  return {
    token,
    userInfo: pickProfile(user)
  }
}

// 对外只暴露安全字段，禁止返回 passwordHash
function pickProfile(user) {
  return { id: user.id, username: user.username, name: user.name, age: user.age, fontSize: user.fontSize }
}

module.exports = { login, pickProfile }
