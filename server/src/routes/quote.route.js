const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const quoteService = require('../services/quote.service')
const { ok } = require('../utils/response')

const router = express.Router()

router.get('/today', authMiddleware, (req, res, next) => {
  quoteService.getTodayQuote()
    .then((quote) => res.json(ok(quote)))
    .catch(next)
})

module.exports = router
