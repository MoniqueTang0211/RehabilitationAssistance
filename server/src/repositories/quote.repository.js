const { readJson } = require('../utils/jsonFile')
const { BusinessError } = require('../utils/response')
const { DATA_ERROR } = require('../utils/errorCode')

const FILE = 'quote.json'

function findActiveByDate(date) {
  const quotes = readJson(FILE)
  if (!Array.isArray(quotes)) {
    throw new BusinessError(DATA_ERROR, '金句数据格式错误')
  }

  return quotes.find((quote) => (
    quote
    && quote.date === date
    && quote.isActive === true
  )) || null
}

module.exports = { findActiveByDate }
