// 康复进度路由（负责人：A）
const express = require('express')
const router = express.Router()
const progressService = require('../services/progress.service')
const { ok } = require('../utils/response')

// GET /api/progress 本人康复阶段与总进度
router.get('/', (req, res) => {
  res.json(ok(progressService.getProgress(req.userId)))
})

module.exports = router
