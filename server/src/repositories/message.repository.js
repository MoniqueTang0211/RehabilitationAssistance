const { readJson, writeJson } = require('../utils/jsonFile')
const { BusinessError } = require('../utils/response')
const { DATA_ERROR } = require('../utils/errorCode')

const PHRASE_FILE = 'quickPhrase.json'
const MESSAGE_FILE = 'message.json'

function readArray(fileName) {
  const records = readJson(fileName)
  if (!Array.isArray(records)) {
    throw new BusinessError(DATA_ERROR, `数据格式错误：${fileName}`)
  }
  return records
}

function findActivePhrases() {
  return readArray(PHRASE_FILE)
    .filter((phrase) => phrase && phrase.isActive === true)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function findActivePhraseById(id) {
  return findActivePhrases().find((phrase) => phrase.id === id) || null
}

function insertMessage(message) {
  const messages = readArray(MESSAGE_FILE)
  messages.push(message)
  writeJson(MESSAGE_FILE, messages)
  return message
}

module.exports = { findActivePhrases, findActivePhraseById, insertMessage }
