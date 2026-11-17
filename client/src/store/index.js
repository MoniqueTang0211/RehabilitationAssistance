// 跨页面共享状态：登录态、用户信息、字号档位
// TODO(底座)：按需补充字段与 action，保持轻量，不引入 pinia
import { reactive } from 'vue'

const state = reactive({
  token: localStorage.getItem('token') || '',
  userInfo: null, // { id, username, name, age, fontSize }
  fontSize: localStorage.getItem('fontSize') || 'medium'
})

// 登录成功后调用：保存 token 与用户信息
export function setLogin({ token, userInfo }) {
  state.token = token
  state.userInfo = userInfo
  localStorage.setItem('token', token)
}

// 退出登录：清空本地登录态（401 时也调用此方法）
export function clearLogin() {
  state.token = ''
  state.userInfo = null
  localStorage.removeItem('token')
}

export function setFontSize(size) {
  state.fontSize = size
  localStorage.setItem('fontSize', size)
}

export default state
