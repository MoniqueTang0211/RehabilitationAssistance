// 训练项目路由（负责人：B）
const express = require('express')
const router = express.Router()
const taskService = require('../services/task.service')
const { ok } = require('../utils/response')
// TODO(M4联调): 挂载 auth.middleware，全部接口需登录

// GET /api/tasks 启用中的训练项目列表
router.get('/', (req, res) => {
  res.json(ok(taskService.listActiveTasks()))
})

// GET /api/tasks/:id 单个项目图文详情
router.get('/:id', (req, res) => {
  res.json(ok(taskService.getTaskDetail(req.params.id)))
})

module.exports = router
