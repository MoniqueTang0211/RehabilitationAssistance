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
