// 登录 / 注册业务（负责人：A）：校验密码（bcryptjs）、签发 JWT
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const userRepository = require('../repositories/user.repository')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, UNAUTHORIZED, DUPLICATE } = require('../utils/errorCode')

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

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
  return buildLoginResult(user)
}

// 注册：校验参数 → 查重 → bcrypt 加密 → 落库 → 直接返回登录态
async function register({ username, password, name, age } = {}) {
  const uname = typeof username === 'string' ? username.trim() : ''
  if (!USERNAME_RE.test(uname)) {
    throw new BusinessError(PARAM_ERROR, '用户名需为 3-20 位字母、数字或下划线')
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 32) {
    throw new BusinessError(PARAM_ERROR, '密码长度需为 6-32 位')
  }
  const nickname = typeof name === 'string' ? name.trim() : ''
  if (!nickname || nickname.length > 20) {
    throw new BusinessError(PARAM_ERROR, '请输入称呼（不超过 20 字）')
  }
  let ageValue = null
  if (age !== undefined && age !== null && age !== '') {
    ageValue = Number(age)
    if (!Number.isInteger(ageValue) || ageValue < 1 || ageValue > 120) {
      throw new BusinessError(PARAM_ERROR, '年龄需为 1-120 的整数')
    }
  }
  if (userRepository.findByName(uname)) {
    throw new BusinessError(DUPLICATE, '该用户名已被注册，请更换一个')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = userRepository.create({
    username: uname,
    passwordHash,
    name: nickname,
    age: ageValue,
    fontSize: 'medium',
    createdAt: new Date().toISOString()
  })
  return buildLoginResult(user)
}

function buildLoginResult(user) {
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

module.exports = { login, register, pickProfile }
