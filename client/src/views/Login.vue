<script setup>
// 登录页（负责人：A）：用户名/密码表单 → login → setLogin → 跳首页
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'
import { setLogin } from '../store'
import { showToast } from '../utils/toast'

const router = useRouter()

const username = ref('')
const password = ref('')
const submitting = ref(false)

async function onSubmit() {
  if (submitting.value) return
  if (!username.value.trim() || !password.value) {
    showToast('请输入用户名和密码')
    return
  }
  submitting.value = true
  try {
    const data = await login({ username: username.value.trim(), password: password.value })
    setLogin(data) // 保存 token 与用户信息
    showToast(`欢迎回来，${data.userInfo.name}`)
    router.replace({ name: 'home' })
  } catch (e) {
    showToast(e.message || '登录失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <h1 class="login-title">老年康复辅助平台</h1>
    <p class="login-sub">请登录您的账号</p>

    <form class="login-form card" @submit.prevent="onSubmit">
      <label class="field">
        <span class="field-label">用户名</span>
        <input v-model="username" type="text" placeholder="请输入用户名" autocomplete="username" />
      </label>
      <label class="field">
        <span class="field-label">密码</span>
        <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
      </label>
      <button class="btn-primary" type="submit" :disabled="submitting">
        {{ submitting ? '登录中…' : '登 录' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  padding-top: 80px;
}

.login-title {
  text-align: center;
  font-size: var(--font-xl);
  color: var(--color-primary);
}

.login-sub {
  text-align: center;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 12px 0 32px;
}

.field {
  display: block;
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.field input {
  width: 100%;
  height: var(--btn-height);
  border: 2px solid #ddd;
  border-radius: var(--radius);
  padding: 0 16px;
  font-size: var(--font-lg);
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
