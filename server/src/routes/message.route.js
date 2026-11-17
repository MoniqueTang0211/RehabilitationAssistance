const express = require('express')
const messageService = require('../services/message.service')
const { ok } = require('../utils/response')

const router = express.Router()

router.get('/phrases', (req, res) => {
  res.json(ok(messageService.listPhrases()))
})

router.post('/messages', (req, res) => {
  res.json(ok(messageService.createMessage(req.userId, req.body)))
})

module.exports = router
