// 登录路由（负责人：A）
// TODO(A)：POST /login —— 校验用户名密码（bcryptjs 比对），签发 JWT，返回 token 与用户基础信息
const express = require('express')
const router = express.Router()

module.exports = router
