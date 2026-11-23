const express = require('express')
const speechService = require('../services/speech.service')
const { ok } = require('../utils/response')

const router = express.Router()

// POST /api/speech/transcribe  { audio: "<16k 单声道 16bit PCM WAV 的 base64>" } -> { text }
router.post('/transcribe', (req, res, next) => {
  speechService.transcribe(req.body).then((data) => {
    res.json(ok(data))
  }).catch(next)
})

module.exports = router
