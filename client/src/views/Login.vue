<script setup>
// 登录 / 注册页（负责人：A）：同一页面切换登录与注册，注册成功后直接进入首页
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { login, register } from '../api/auth'
import { setLogin } from '../store'
import { showToast } from '../utils/toast'

const router = useRouter()

const mode = ref('login') // 'login' | 'register'
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const age = ref('')
const submitting = ref(false)

function switchMode(next) {
  if (submitting.value) return
  mode.value = next
  password.value = ''
  confirmPassword.value = ''
  age.value = ''
}

async function onSubmit() {
  if (submitting.value) return
  if (!username.value.trim() || !password.value) {
    showToast('请输入用户名和密码')
    return
  }
  if (mode.value === 'register') {
    if (!name.value.trim()) {
      showToast('请输入您的称呼')
      return
    }
    if (password.value.length < 6) {
      showToast('密码至少需要 6 位')
      return
    }
    if (password.value !== confirmPassword.value) {
      showToast('两次输入的密码不一致')
      return
    }
  }
  submitting.value = true
  try {
    const payload = {
      username: username.value.trim(),
      password: password.value,
      name: name.value.trim(),
      age: age.value === '' ? undefined : Number(age.value)
    }
    const data = mode.value === 'login'
      ? await login(payload)
      : await register(payload)
    setLogin(data) // 保存 token 与用户信息
    showToast(mode.value === 'login' ? `欢迎回来，${data.userInfo.name}` : `注册成功，欢迎您，${data.userInfo.name}`)
    router.replace({ name: 'home' })
  } catch (e) {
    showToast(e.message || (mode.value === 'login' ? '登录失败，请稍后再试' : '注册失败，请稍后再试'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-logo">
      <AppIcon name="activity" :size="64" />
    </div>
    <h1 class="login-title">老年康复辅助平台</h1>
    <p class="login-sub">{{ mode === 'login' ? '请登录您的账号' : '创建新账号' }}</p>

    <form class="login-form card" @submit.prevent="onSubmit">
      <label class="field">
        <span class="field-label">用户名</span>
        <input v-model="username" type="text" placeholder="请输入用户名" autocomplete="username" />
      </label>
      <label v-if="mode === 'register'" class="field">
        <span class="field-label">称呼</span>
        <input v-model="name" type="text" placeholder="请输入您的称呼，如：张爷爷" autocomplete="name" />
      </label>
      <label v-if="mode === 'register'" class="field">
        <span class="field-label">年龄（选填）</span>
        <input v-model="age" type="number" inputmode="numeric" min="1" max="120" placeholder="请输入年龄" />
      </label>
      <label class="field">
        <span class="field-label">密码</span>
        <input
          v-model="password"
          type="password"
          :placeholder="mode === 'register' ? '请设置密码（至少 6 位）' : '请输入密码'"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
        />
      </label>
      <label v-if="mode === 'register'" class="field">
        <span class="field-label">确认密码</span>
        <input v-model="confirmPassword" type="password" placeholder="请再次输入密码" autocomplete="new-password" />
      </label>
      <button class="btn-primary" type="submit" :disabled="submitting">
        {{ submitting ? '请稍候…' : mode === 'login' ? '登 录' : '注 册' }}
      </button>
      <button
        class="btn-switch"
        type="button"
        :disabled="submitting"
        @click="switchMode(mode === 'login' ? 'register' : 'login')"
      >
        {{ mode === 'login' ? '还没有账号？点此注册' : '已有账号？返回登录' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  padding-top: 80px;
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--color-primary);
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

.btn-switch {
  display: block;
  width: 100%;
  height: var(--btn-height);
  margin-top: 12px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius);
  background-color: transparent;
  color: var(--color-primary);
  font-size: var(--font-base);
  font-weight: 600;
}

.btn-switch:active {
  background-color: var(--color-primary-light);
}

.btn-switch:disabled {
  opacity: 0.5;
}
</style>
