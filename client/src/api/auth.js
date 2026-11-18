// 登录 / 注册接口（负责人：A）
import request from './request'

// 注册时可选的安全问题（需与后端 auth.service.js 保持一致）
export const SECURITY_QUESTIONS = [
  '您母亲的姓名是？',
  '您出生的城市是？',
  '您第一只宠物的名字是？',
  '您小学班主任的姓名是？',
  '您最喜欢吃的一道菜是？'
]

// 用户名密码登录，返回 { token, userInfo }
export function login({ username, password }) {
  return request.post('/auth/login', { username, password })
}

// 注册新账号，成功直接返回 { token, userInfo }
export function register({ username, password, name, age, securityQuestion, securityAnswer }) {
  return request.post('/auth/register', { username, password, name, age, securityQuestion, securityAnswer })
}

// 找回密码第一步：按用户名换取密保问题，返回 { username, securityQuestion }
export function getSecurityQuestion({ username }) {
  return request.post('/auth/security-question', { username })
}

// 找回密码第二步：用户名 + 密保答案验证后重置，成功直接返回 { token, userInfo }
export function resetPassword({ username, securityAnswer, password }) {
  return request.post('/auth/reset-password', { username, securityAnswer, password })
}
