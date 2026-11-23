import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// 接口基址从前端环境变量读取，禁止在业务代码中写死后端地址
export default defineConfig({
  plugins: [vue(), basicSsl()], // 自签 HTTPS：手机真机调试麦克风/语音需要安全上下文
  server: {
    port: 5173,
    host: true, // 允许局域网手机访问
    proxy: {
      // 手机真机调试：API 走 vite 同源代理，避免 3000 端口被防火墙拦截
      '/api': 'http://localhost:3000'
    }
  }
})
