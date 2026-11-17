import request from './request'

export function getTodayQuote() {
  return request.get('/quotes/today')
}
