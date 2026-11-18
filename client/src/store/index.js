// 跨页面共享状态：登录态、用户信息、字号档位、系统设置
// 轻量 reactive，不引入 pinia
import { reactive } from 'vue'

const state = reactive({
  token: localStorage.getItem('token') || '',
  userInfo: null, // { id, username, name, age, fontSize }
  fontSize: localStorage.getItem('fontSize') || 'medium'
})

// 系统设置：护眼模式、训练提醒
const SETTING_KEYS = {
  eyeCare: 'rehab-eye-care',
  reminders: 'rehab-reminders'
}

export const settings = reactive({
  eyeCare: localStorage.getItem(SETTING_KEYS.eyeCare) === '1',
  reminders: localStorage.getItem(SETTING_KEYS.reminders) !== '0'
})

// 把设置挂到根元素，触发 global.css 的主题切换
export function applySettings() {
  document.documentElement.dataset.eye = settings.eyeCare ? 'on' : 'off'
}

export function setSetting(key, value) {
  settings[key] = value
  localStorage.setItem(SETTING_KEYS[key], value ? '1' : '0')
  applySettings()
}

applySettings()

// 把字号档位挂到页面根元素，触发 variables.css 的 data-font 变量切换
export function applyFontSize(size) {
  document.documentElement.dataset.font = size
}

// 登录成功后调用：保存 token 与用户信息，并同步字号档位
export function setLogin({ token, userInfo }) {
  state.token = token
  state.userInfo = userInfo
  localStorage.setItem('token', token)
  if (userInfo && userInfo.fontSize) {
    setFontSize(userInfo.fontSize)
  }
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
  applyFontSize(size)
}

// 应用启动时调用：恢复上次选择的字号
applyFontSize(state.fontSize)

export default state
