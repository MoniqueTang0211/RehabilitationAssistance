const messageRepository = require('../repositories/message.repository')
const { MESSAGE_TYPE } = require('../models/enums')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, NOT_FOUND } = require('../utils/errorCode')
const { genId, now } = require('../utils/helper')

const MAX_CONTENT_LENGTH = 200

function listPhrases() {
  return messageRepository.findActivePhrases()
}

function createMessage(userId, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BusinessError(PARAM_ERROR, '留言参数格式不正确')
  }

  const { type } = input
  if (!MESSAGE_TYPE.includes(type)) {
    throw new BusinessError(PARAM_ERROR, '留言类型不正确')
  }

  let quickPhraseId = null
  let content

  if (type === 'quick') {
    if (typeof input.quickPhraseId !== 'string' || !input.quickPhraseId.trim()) {
      throw new BusinessError(PARAM_ERROR, '请选择有效的快捷语句')
    }

    const phrase = messageRepository.findActivePhraseById(input.quickPhraseId.trim())
    if (!phrase) {
      throw new BusinessError(NOT_FOUND, '快捷语句不存在或已停用')
    }

    quickPhraseId = phrase.id
    content = phrase.content
  } else {
    if (typeof input.content !== 'string') {
      throw new BusinessError(PARAM_ERROR, '留言内容不能为空')
    }

    content = input.content.trim()
    if (!content) {
      throw new BusinessError(PARAM_ERROR, '留言内容不能为空')
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new BusinessError(PARAM_ERROR, '留言内容不能超过 200 字')
    }
  }

  return messageRepository.insertMessage({
    id: genId(),
    userId,
    type,
    quickPhraseId,
    content,
    status: 'pending',
    createdAt: now()
  })
}

module.exports = { listPhrases, createMessage }
