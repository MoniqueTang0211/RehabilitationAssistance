// 登录路由（负责人：A）
const express = require('express')
const router = express.Router()
const authService = require('../services/auth.service')

// POST /api/auth/login 用户名密码登录，返回 token 与用户基础信息（无需登录）
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {}
    const data = await authService.login(username, password)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
