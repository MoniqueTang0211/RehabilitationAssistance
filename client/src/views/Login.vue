<script setup>
// 登录 / 注册页（负责人：A）：同一页面切换登录与注册，注册成功后直接进入首页
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { login, register, resetPassword, getSecurityQuestion, SECURITY_QUESTIONS } from '../api/auth'
import { setLogin } from '../store'
import { showToast } from '../utils/toast'

const router = useRouter()

const mode = ref('login') // 'login' | 'register'
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const age = ref('')
const securityQuestion = ref('')
const securityAnswer = ref('')
const submitting = ref(false)

// 忘记密码弹层：step 为 'username' 时先取密保问题，为 'verify' 时填写答案与新密码
const forgotOpen = ref(false)
const resetting = ref(false)
const rStep = ref('username')
const rUsername = ref('')
const rQuestion = ref('')
const rAnswer = ref('')
const rPassword = ref('')
const rConfirm = ref('')

function openForgot() {
  rStep.value = 'username'
  rUsername.value = username.value.trim()
  rQuestion.value = ''
  rAnswer.value = ''
  rPassword.value = ''
  rConfirm.value = ''
  forgotOpen.value = true
}

// 第一步：按用户名获取密保问题
async function onFetchQuestion() {
  if (resetting.value) return
  if (!rUsername.value.trim()) {
    showToast('请输入用户名')
    return
  }
  resetting.value = true
  try {
    const data = await getSecurityQuestion({ username: rUsername.value.trim() })
    rUsername.value = data.username
    rQuestion.value = data.securityQuestion
    rStep.value = 'verify'
  } catch (e) {
    showToast(e.message || '查询失败，请稍后再试')
  } finally {
    resetting.value = false
  }
}

// 第二步：校验密保答案后重置密码并登录
async function onReset() {
  if (resetting.value) return
  if (!rAnswer.value.trim()) {
    showToast('请输入密保答案')
    return
  }
  if (rPassword.value.length < 6) {
    showToast('新密码至少需要 6 位')
    return
  }
  if (rPassword.value !== rConfirm.value) {
    showToast('两次输入的新密码不一致')
    return
  }
  resetting.value = true
  try {
    const data = await resetPassword({
      username: rUsername.value.trim(),
      securityAnswer: rAnswer.value.trim(),
      password: rPassword.value
    })
    setLogin(data)
    forgotOpen.value = false
    showToast(`密码已重置，欢迎回来，${data.userInfo.name}`)
    router.replace({ name: 'home' })
  } catch (e) {
    showToast(e.message || '重置失败，请稍后再试')
  } finally {
    resetting.value = false
  }
}

function switchMode(next) {
  if (submitting.value) return
  mode.value = next
  password.value = ''
  confirmPassword.value = ''
  age.value = ''
  securityQuestion.value = ''
  securityAnswer.value = ''
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
    if (!securityQuestion.value) {
      showToast('请选择密保问题')
      return
    }
    const answer = securityAnswer.value.trim()
    if (answer.length < 2 || answer.length > 30) {
      showToast('密保答案需为 2-30 个字')
      return
    }
  }
  submitting.value = true
  try {
    const payload = {
      username: username.value.trim(),
      password: password.value,
      name: name.value.trim(),
      age: age.value === '' ? undefined : Number(age.value),
      securityQuestion: securityQuestion.value,
      securityAnswer: securityAnswer.value.trim()
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
      <label v-if="mode === 'register'" class="field">
        <span class="field-label">密保问题（忘记密码时使用）</span>
        <select v-model="securityQuestion">
          <option value="" disabled>请选择密保问题</option>
          <option v-for="q in SECURITY_QUESTIONS" :key="q" :value="q">{{ q }}</option>
        </select>
      </label>
      <label v-if="mode === 'register'" class="field">
        <span class="field-label">密保答案</span>
        <input
          v-model="securityAnswer"
          type="text"
          placeholder="请填写答案（2-30 个字，请记牢）"
          autocomplete="off"
        />
      </label>
      <button class="btn-primary" type="submit" :disabled="submitting">
        {{ submitting ? '请稍候…' : mode === 'login' ? '登 录' : '注 册' }}
      </button>
      <div class="login-actions">
        <button
          v-if="mode === 'login'"
          class="btn-switch btn-forgot"
          type="button"
          :disabled="submitting"
          @click="openForgot"
        >
          忘记密码
        </button>
        <button
          class="btn-switch"
          type="button"
          :disabled="submitting"
          @click="switchMode(mode === 'login' ? 'register' : 'login')"
        >
          {{ mode === 'login' ? '点此注册' : '已有账号？返回登录' }}
        </button>
      </div>
    </form>

    <div v-if="forgotOpen" class="forgot-mask" @click.self="forgotOpen = false">
      <form
        class="forgot-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        @submit.prevent="onReset"
      >
        <h2 id="forgot-title" class="forgot-title">找回密码</h2>

        <template v-if="rStep === 'username'">
          <p class="forgot-tip">请输入用户名，答对注册时设置的密保问题后才能重置密码。</p>
          <label class="field">
            <span class="field-label">用户名</span>
            <input v-model="rUsername" type="text" placeholder="请输入用户名" autocomplete="username" />
          </label>
          <button class="btn-primary" type="button" :disabled="resetting" @click="onFetchQuestion">
            {{ resetting ? '请稍候…' : '下一步' }}
          </button>
          <button class="btn-cancel" type="button" :disabled="resetting" @click="forgotOpen = false">
            取消
          </button>
        </template>

        <template v-else>
          <p class="forgot-tip">请回答密保问题并设置新密码。</p>
          <label class="field">
            <span class="field-label">用户名</span>
            <input :value="rUsername" type="text" readonly class="field-readonly" />
          </label>
          <label class="field">
            <span class="field-label">密保问题</span>
            <input :value="rQuestion" type="text" readonly class="field-readonly" />
          </label>
          <label class="field">
            <span class="field-label">你的答案</span>
            <input v-model="rAnswer" type="text" placeholder="请输入密保答案" autocomplete="off" />
          </label>
          <label class="field">
            <span class="field-label">新密码</span>
            <input
              v-model="rPassword"
              type="password"
              placeholder="请设置新密码（至少 6 位）"
              autocomplete="new-password"
            />
          </label>
          <label class="field">
            <span class="field-label">确认新密码</span>
            <input
              v-model="rConfirm"
              type="password"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
            />
          </label>
          <button class="btn-primary" type="submit" :disabled="resetting">
            {{ resetting ? '请稍候…' : '重置密码并登录' }}
          </button>
          <button class="btn-cancel" type="button" :disabled="resetting" @click="rStep = 'username'">
            上一步
          </button>
        </template>
      </form>
    </div>
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

.field input,
.field select {
  width: 100%;
  height: var(--btn-height);
  border: 2px solid #ddd;
  border-radius: var(--radius);
  padding: 0 16px;
  font-size: var(--font-lg);
  background-color: #fff;
  color: var(--color-text);
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.field-readonly {
  background-color: var(--color-bg) !important;
  color: var(--color-text-secondary);
}

.login-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-switch {
  flex: 1;
  display: block;
  width: 100%;
  height: var(--btn-height);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius);
  background-color: transparent;
  color: var(--color-primary);
  font-size: var(--font-base);
  font-weight: 600;
}

.btn-forgot {
  flex: 0 0 38%;
}

.btn-switch:active {
  background-color: var(--color-primary-light);
}

.btn-switch:disabled {
  opacity: 0.5;
}

.forgot-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap);
  background-color: rgba(0, 0, 0, 0.45);
}

.forgot-panel {
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 24px var(--gap);
  border-radius: 20px;
  background-color: var(--color-card);
}

.forgot-title {
  font-size: var(--font-lg);
  margin-bottom: 8px;
}

.forgot-tip {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}

.btn-cancel {
  display: block;
  width: 100%;
  height: var(--btn-height);
  margin-top: 12px;
  border: 2px solid #ccc;
  border-radius: var(--radius);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-base);
  font-weight: 600;
}

.btn-cancel:disabled {
  opacity: 0.5;
}
</style>
