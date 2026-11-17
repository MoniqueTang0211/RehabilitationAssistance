// 登录接口（负责人：A）
import request from './request'

// 用户名密码登录，返回 { token, userInfo }
export function login({ username, password }) {
  return request.post('/auth/login', { username, password })
}
