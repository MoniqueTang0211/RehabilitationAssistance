// 用户信息与设置接口（负责人：A）
import request from './request'

// 本人姓名、年龄、字体档位
export function getProfile() {
  return request.get('/user/profile')
}

// 保存字体档位
export function saveSettings({ fontSize }) {
  return request.put('/user/settings', { fontSize })
}

// 设置或修改密保问题（需当前密码），返回 { securityQuestion, hasSecurityQuestion }
export function saveSecurityQuestion({ currentPassword, securityQuestion, securityAnswer }) {
  return request.put('/user/security-question', { currentPassword, securityQuestion, securityAnswer })
}
