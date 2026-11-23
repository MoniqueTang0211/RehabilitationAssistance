const express = require('express')
const messageService = require('../services/message.service')
const { ok } = require('../utils/response')

const router = express.Router()

router.get('/phrases', (req, res) => {
  res.json(ok(messageService.listPhrases()))
})

router.get('/messages', (req, res) => {
  res.json(ok(messageService.listMyPendingMessages(req.userId)))
})

router.post('/messages', (req, res) => {
  res.json(ok(messageService.createMessage(req.userId, req.body)))
})

router.delete('/messages/:id', (req, res) => {
  res.json(ok(messageService.revokeMessage(req.userId, req.params.id)))
})

module.exports = router
