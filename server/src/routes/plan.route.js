// 每日任务与打卡路由（负责人：B）
const express = require('express')
const router = express.Router()
const planService = require('../services/plan.service')
const config = require('../config')
const { ok, BusinessError } = require('../utils/response')
const { PARAM_ERROR } = require('../utils/errorCode')
// TODO(M4联调): 挂载 auth.middleware 后删除 currentUserId，userId 一律取 req.userId

// 开发期无鉴权：先用固定用户联调
function currentUserId(req) {
  return req.userId || config.devUserId
}

// GET /api/plans/today 今日任务及状态（无记录时自动生成）
router.get('/today', (req, res) => {
  res.json(ok(planService.getTodayPlan(currentUserId(req))))
})

// POST /api/plans/checkin 提交打卡，返回最新进度
router.post('/checkin', (req, res, next) => {
  const { taskId } = req.body || {}
  if (!taskId || typeof taskId !== 'string') {
    return next(new BusinessError(PARAM_ERROR, '缺少 taskId 参数'))
  }
  res.json(ok(planService.checkin(currentUserId(req), taskId)))
})

// GET /api/plans/records 历史打卡记录
router.get('/records', (req, res) => {
  res.json(ok(planService.getRecords(currentUserId(req))))
})

module.exports = router
