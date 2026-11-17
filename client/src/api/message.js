import request from './request'

export function getPhrases() {
  return request.get('/phrases')
}

export function sendMessage(payload) {
  return request.post('/messages', payload)
}
