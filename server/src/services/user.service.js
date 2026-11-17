// 用户信息与设置业务（负责人：A）
const userRepository = require('../repositories/user.repository')
const { pickProfile } = require('./auth.service')
const enums = require('../models/enums')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, NOT_FOUND } = require('../utils/errorCode')

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

module.exports = { getProfile, saveSettings }
