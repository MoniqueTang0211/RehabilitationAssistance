// 路由与登录守卫（A / 底座负责人维护，他人修改需 review）
// 5 条业务路由 + 登录页，全部页面已在 views/ 建好占位
import { createRouter, createWebHashHistory } from 'vue-router'
import { clearLogin } from '../store'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { title: '登录' } },
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { title: '首页' } },
  { path: '/training', name: 'training', component: () => import('../views/Training.vue'), meta: { title: '康复训练' } },
  { path: '/mental', name: 'mental', component: () => import('../views/Mental.vue'), meta: { title: '心理关怀' } },
  { path: '/message', name: 'message', component: () => import('../views/Message.vue'), meta: { title: '求助留言' } },
  { path: '/profile', name: 'profile', component: () => import('../views/Profile.vue'), meta: { title: '个人中心' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 登录守卫：除登录页外均需持有 token
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'login' && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'home' }
  }
})

// 401 统一处理：清登录态并跳登录页（供 request.js 调用）
export function redirectToLogin() {
  clearLogin()
  router.push({ name: 'login' })
}

export default router
