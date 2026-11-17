const quoteRepository = require('../repositories/quote.repository')
const { today } = require('../utils/helper')

async function getTodayQuote() {
  return quoteRepository.findActiveByDate(today())
}

module.exports = { getTodayQuote }
