import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 接口基址从前端环境变量读取，禁止在业务代码中写死后端地址
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true // 允许局域网手机访问
  }
})
