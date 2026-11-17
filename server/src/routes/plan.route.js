// 每日任务与打卡路由（负责人：B）
// 全局 auth.middleware 已挂载（见 app.js），userId 一律取 req.userId
const express = require('express')
const router = express.Router()
const planService = require('../services/plan.service')
const { ok, BusinessError } = require('../utils/response')
const { PARAM_ERROR } = require('../utils/errorCode')

// GET /api/plans/today 今日任务及状态（无记录时自动生成）
router.get('/today', (req, res) => {
  res.json(ok(planService.getTodayPlan(req.userId)))
})

// POST /api/plans/checkin 提交打卡，返回最新进度
router.post('/checkin', (req, res, next) => {
  const { taskId } = req.body || {}
  if (!taskId || typeof taskId !== 'string') {
    return next(new BusinessError(PARAM_ERROR, '缺少 taskId 参数'))
  }
  res.json(ok(planService.checkin(req.userId, taskId)))
})

// GET /api/plans/records 历史打卡记录
router.get('/records', (req, res) => {
  res.json(ok(planService.getRecords(req.userId)))
})

module.exports = router
