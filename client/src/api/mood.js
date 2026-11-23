import request from './request'

export function getTodayMood() {
  return request.get('/moods/today')
}

export function getRecentMoods() {
  return request.get('/moods/recent')
}

export function saveTodayMood(payload) {
  return request.put('/moods/today', payload)
}
