// 用户信息与设置路由（负责人：A）
const express = require('express')
const router = express.Router()
const userService = require('../services/user.service')
const { ok, BusinessError } = require('../utils/response')
const { PARAM_ERROR } = require('../utils/errorCode')

// GET /api/user/profile 本人姓名、年龄、字体档位
router.get('/profile', (req, res) => {
  res.json(ok(userService.getProfile(req.userId)))
})

// PUT /api/user/settings 保存字体档位
router.put('/settings', (req, res, next) => {
  const { fontSize } = req.body || {}
  if (!fontSize) {
    return next(new BusinessError(PARAM_ERROR, '缺少 fontSize 参数'))
  }
  res.json(ok(userService.saveSettings(req.userId, fontSize)))
})

// PUT /api/user/security-question 设置或修改密保问题（需登录 + 当前密码）
router.put('/security-question', async (req, res, next) => {
  try {
    const data = await userService.saveSecurityQuestion(req.userId, req.body || {})
    res.json(ok(data))
  } catch (err) {
    next(err)
  }
})

module.exports = router
