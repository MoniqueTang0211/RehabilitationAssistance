// 每日任务与打卡路由（负责人：B）
// TODO(B)：GET /today —— 本人今日任务及状态（需登录）
// TODO(B)：POST /checkin —— 提交打卡，返回最新进度；重复打卡返回 40901（需登录）
// TODO(B)：GET /records —— 本人历史打卡记录（需登录）
const express = require('express')
const router = express.Router()

module.exports = router
