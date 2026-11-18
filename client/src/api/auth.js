// 登录 / 注册接口（负责人：A）
import request from './request'

// 用户名密码登录，返回 { token, userInfo }
export function login({ username, password }) {
  return request.post('/auth/login', { username, password })
}

// 注册新账号，成功直接返回 { token, userInfo }
export function register({ username, password, name, age }) {
  return request.post('/auth/register', { username, password, name, age })
}
