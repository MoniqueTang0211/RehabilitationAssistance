// axios 实例与拦截器（A / 底座负责人维护，他人修改需 review）
import axios from 'axios'
import { redirectToLogin } from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  timeout: 10000,
  headers: { 'X-Client': 'h5' }
})

// 请求拦截：统一注入 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一按 { code, message, data } 拆包；非 0 抛出含 code/message 的错误
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 0) {
      return res.data // 页面拿到的直接是业务数据
    }
    // 40101：未登录 / token 失效，清登录态跳登录页
    if (res.code === 40101) {
      redirectToLogin()
    }
    return Promise.reject(res) // { code, message }
  },
  (error) => {
    // HTTP 层错误（网络断开、500 等），包装为统一结构
    return Promise.reject({ code: 50001, message: '服务异常，请稍后再试' })
  }
)

export default request
