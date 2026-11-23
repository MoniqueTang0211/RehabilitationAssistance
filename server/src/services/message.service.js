const messageRepository = require('../repositories/message.repository')
const { MESSAGE_TYPE } = require('../models/enums')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR, NOT_FOUND, FORBIDDEN } = require('../utils/errorCode')
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

// 我的待查看留言（可撤销），按发送时间倒序
function listMyPendingMessages(userId) {
  return messageRepository
    .findMessagesByUser(userId)
    .filter((message) => message.status === 'pending')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

// 撤销误发的留言：仅本人、且尚未被查看时允许
function revokeMessage(userId, messageId) {
  if (typeof messageId !== 'string' || !messageId.trim()) {
    throw new BusinessError(PARAM_ERROR, '留言编号不正确')
  }

  const message = messageRepository.findMessageById(messageId.trim())
  if (!message) {
    throw new BusinessError(NOT_FOUND, '留言不存在或已撤销')
  }
  if (message.userId !== userId) {
    throw new BusinessError(FORBIDDEN, '无权撤销该留言')
  }
  if (message.status !== 'pending') {
    throw new BusinessError(FORBIDDEN, '留言已被查看，无法撤销')
  }

  messageRepository.deleteMessageById(message.id)
  return { id: message.id }
}

module.exports = { listPhrases, createMessage, listMyPendingMessages, revokeMessage }
