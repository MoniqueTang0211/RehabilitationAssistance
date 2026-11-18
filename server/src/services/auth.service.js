// 登录 / 注册业务（负责人：A）：校验密码（bcryptjs）、签发 JWT
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const userRepository = require('../repositories/user.repository')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, UNAUTHORIZED, DUPLICATE } = require('../utils/errorCode')

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

// 注册时可选的安全问题（与前端保持一致）
const SECURITY_QUESTIONS = [
  '您母亲的姓名是？',
  '您出生的城市是？',
  '您第一只宠物的名字是？',
  '您小学班主任的姓名是？',
  '您最喜欢吃的一道菜是？'
]

// 答案统一去空格、转小写后再比较
function normalizeAnswer(answer) {
  return String(answer).trim().toLowerCase()
}

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
async function register({ username, password, name, age, securityQuestion, securityAnswer } = {}) {
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
  // 密保问题与答案用于「忘记密码」时验证身份
  if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
    throw new BusinessError(PARAM_ERROR, '请选择密保问题')
  }
  const answer = typeof securityAnswer === 'string' ? securityAnswer.trim() : ''
  if (answer.length < 2 || answer.length > 30) {
    throw new BusinessError(PARAM_ERROR, '密保答案需为 2-30 个字')
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
  const securityAnswerHash = await bcrypt.hash(normalizeAnswer(answer), 10)
  const user = userRepository.create({
    username: uname,
    passwordHash,
    name: nickname,
    age: ageValue,
    fontSize: 'medium',
    securityQuestion,
    securityAnswerHash,
    createdAt: new Date().toISOString()
  })
  return buildLoginResult(user)
}

// 找回密码第一步：根据用户名返回该账号的密保问题
async function getSecurityQuestion({ username } = {}) {
  const uname = typeof username === 'string' ? username.trim() : ''
  if (!uname) {
    throw new BusinessError(PARAM_ERROR, '请输入用户名')
  }
  const user = userRepository.findByName(uname)
  if (!user) {
    throw new BusinessError(UNAUTHORIZED, '该用户名不存在，请核对后重试')
  }
  if (!user.securityQuestion || !user.securityAnswerHash) {
    throw new BusinessError(UNAUTHORIZED, '该账号未设置密保问题，请联系家属或康复师协助重置')
  }
  return { username: user.username, securityQuestion: user.securityQuestion }
}

// 忘记密码：用「用户名 + 密保答案」验证身份，验证通过后设置新密码
async function resetPassword({ username, securityAnswer, password } = {}) {
  const uname = typeof username === 'string' ? username.trim() : ''
  const answer = typeof securityAnswer === 'string' ? securityAnswer.trim() : ''
  if (!uname || !answer) {
    throw new BusinessError(PARAM_ERROR, '请输入用户名和密保答案')
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 32) {
    throw new BusinessError(PARAM_ERROR, '新密码长度需为 6-32 位')
  }
  const user = userRepository.findByName(uname)
  if (!user) {
    throw new BusinessError(UNAUTHORIZED, '该用户名不存在，请核对后重试')
  }
  if (!user.securityQuestion || !user.securityAnswerHash) {
    throw new BusinessError(UNAUTHORIZED, '该账号未设置密保问题，请联系家属或康复师协助重置')
  }
  const matched = await bcrypt.compare(normalizeAnswer(answer), user.securityAnswerHash)
  if (!matched) {
    throw new BusinessError(UNAUTHORIZED, '密保答案不正确，请核对后重试')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const updated = userRepository.update({ ...user, passwordHash })
  return buildLoginResult(updated)
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
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    age: user.age,
    fontSize: user.fontSize,
    hasSecurityQuestion: Boolean(user.securityAnswerHash)
  }
}

module.exports = {
  login,
  register,
  getSecurityQuestion,
  resetPassword,
  pickProfile,
  normalizeAnswer,
  SECURITY_QUESTIONS
}
