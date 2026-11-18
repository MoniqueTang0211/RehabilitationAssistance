// 用户信息与设置业务（负责人：A）
const bcrypt = require('bcryptjs')
const userRepository = require('../repositories/user.repository')
const { pickProfile, normalizeAnswer, SECURITY_QUESTIONS } = require('./auth.service')
const enums = require('../models/enums')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, NOT_FOUND, UNAUTHORIZED } = require('../utils/errorCode')

// 本人信息（以 token 解析的 userId 为准，忽略前端传入的任何 userId）
function getProfile(userId) {
  const user = userRepository.findById(userId)
  if (!user) {
    throw new BusinessError(NOT_FOUND, '用户不存在')
  }
  return pickProfile(user)
}

// 保存字体档位（白名单校验后写回）
function saveSettings(userId, fontSize) {
  if (!enums.FONT_SIZE.includes(fontSize)) {
    throw new BusinessError(PARAM_ERROR, '字体档位不合法')
  }
  const user = userRepository.findById(userId)
  if (!user) {
    throw new BusinessError(NOT_FOUND, '用户不存在')
  }
  user.fontSize = fontSize
  userRepository.update(user)
  return pickProfile(user)
}

// 设置或修改密保问题：需验证当前密码，答案归一化后 bcrypt 加密存储
async function saveSecurityQuestion(userId, { currentPassword, securityQuestion, securityAnswer } = {}) {
  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new BusinessError(PARAM_ERROR, '请输入当前密码')
  }
  if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
    throw new BusinessError(PARAM_ERROR, '请选择密保问题')
  }
  const answer = typeof securityAnswer === 'string' ? securityAnswer.trim() : ''
  if (answer.length < 2 || answer.length > 30) {
    throw new BusinessError(PARAM_ERROR, '密保答案需为 2-30 个字')
  }
  const user = userRepository.findById(userId)
  if (!user) {
    throw new BusinessError(NOT_FOUND, '用户不存在')
  }
  const matched = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!matched) {
    throw new BusinessError(UNAUTHORIZED, '当前密码不正确')
  }
  const securityAnswerHash = await bcrypt.hash(normalizeAnswer(answer), 10)
  userRepository.update({ ...user, securityQuestion, securityAnswerHash })
  return { securityQuestion, hasSecurityQuestion: true }
}

module.exports = { getProfile, saveSettings, saveSecurityQuestion }
