const express = require('express')
const moodService = require('../services/mood.service')
const { ok } = require('../utils/response')

const router = express.Router()

// 当日心情（当天没有记录时 data 返回 null）
router.get('/today', (req, res, next) => {
  moodService.getTodayMood(req.userId)
    .then((record) => res.json(ok(record)))
    .catch(next)
})

// 近 7 天心情记录（不足的日期用空记录补齐）
router.get('/recent', (req, res, next) => {
  moodService.getRecentMoods(req.userId)
    .then((list) => res.json(ok(list)))
    .catch(next)
})

// 保存今日心情（mood 与 note 可只传其一，重复保存为更新）
router.put('/today', (req, res, next) => {
  moodService.saveTodayMood(req.userId, req.body)
    .then((record) => res.json(ok(record)))
    .catch(next)
})

module.exports = router
