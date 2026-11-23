import request from './request'

export function getPhrases() {
  return request.get('/phrases')
}

export function sendMessage(payload) {
  return request.post('/messages', payload)
}

export function getMyMessages() {
  return request.get('/messages')
}

export function revokeMessage(id) {
  return request.delete(`/messages/${id}`)
}
