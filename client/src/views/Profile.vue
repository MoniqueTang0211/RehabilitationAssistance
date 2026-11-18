<script setup>
// 个人中心页（负责人：C）：用户信息 + 字体三档调节 + 紧急拨号 + 退出登录
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FontSizeSetting from '../components/FontSizeSetting.vue'
import AppIcon from '../components/AppIcon.vue'
import { getProfile, saveSettings } from '../api/user'
import store, { setFontSize, clearLogin, settings, setSetting } from '../store'
import { dial } from '../utils/dial'
import { showToast } from '../utils/toast'

const router = useRouter()

const profile = ref(null)
const loading = ref(true)
const loadError = ref('')
const savingFontSize = ref(false)
const settingsOpen = ref(false)
const emergencyPhone = (import.meta.env.VITE_EMERGENCY_PHONE || '').trim()

async function loadProfile() {
  loading.value = true
  loadError.value = ''

  try {
    profile.value = await getProfile()
    setFontSize(profile.value.fontSize)
    document.documentElement.dataset.font = profile.value.fontSize
  } catch (error) {
    loadError.value = error.message || '暂时无法获取个人信息，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function changeFontSize(fontSize) {
  if (savingFontSize.value) {
    return
  }

  savingFontSize.value = true
  try {
    profile.value = await saveSettings({ fontSize })
    setFontSize(profile.value.fontSize)
    document.documentElement.dataset.font = profile.value.fontSize
    showToast('字体设置已保存')
  } catch (error) {
    showToast(error.message || '字体设置保存失败，请稍后重试')
  } finally {
    savingFontSize.value = false
  }
}

function callEmergencyNumber() {
  try {
    dial(emergencyPhone)
  } catch (error) {
    showToast(error.message || '无法拨打该号码')
  }
}

function onLogout() {
  clearLogin()
  showToast('已退出登录')
  router.replace({ name: 'login' })
}

function toggleSetting(key) {
  setSetting(key, !settings[key])
}

onMounted(loadProfile)
</script>

<template>
  <main class="page-with-tab">
    <div class="page-header">
      <h1 class="page-title"><AppIcon name="user" :size="32" />个人中心</h1>
      <button class="settings-btn" type="button" @click="settingsOpen = true">
        <AppIcon name="settings" :size="24" />设置
      </button>
    </div>

    <section class="card profile-card" aria-labelledby="profile-title">
      <h2 id="profile-title" class="section-title">
        <AppIcon name="heart" :size="26" />个人信息
      </h2>
      <p v-if="loading" role="status">正在加载个人信息…</p>
      <div v-else-if="loadError" class="error-message" role="alert">
        <p>{{ loadError }}</p>
        <button class="btn-primary retry-button" type="button" @click="loadProfile">
          重试
        </button>
      </div>
      <dl v-else-if="profile" class="profile-details">
        <div>
          <dt>姓名</dt>
          <dd>{{ profile.name }}</dd>
        </div>
        <div v-if="profile.age">
          <dt>年龄</dt>
          <dd>{{ profile.age }} 岁</dd>
        </div>
      </dl>
    </section>

    <FontSizeSetting
      :font-size="profile?.fontSize || store.fontSize"
      :disabled="savingFontSize"
      @change="changeFontSize"
    />

    <section class="card emergency-card" aria-labelledby="emergency-title">
      <h2 id="emergency-title" class="section-title">
        <AppIcon name="phone" :size="26" />紧急求助
      </h2>
      <p v-if="!emergencyPhone" class="phone-not-configured">
        紧急求助电话尚未配置，暂不能拨号。
      </p>
      <button
        class="btn-primary emergency-btn"
        type="button"
        :disabled="!emergencyPhone"
        @click="callEmergencyNumber"
      >
        <AppIcon name="phone" :size="24" />
        {{ emergencyPhone ? `拨打 ${emergencyPhone}` : '紧急求助电话未配置' }}
      </button>
    </section>

    <section class="card logout-card">
      <button class="btn-logout" type="button" @click="onLogout">
        <AppIcon name="logout" :size="24" />
        退出登录
      </button>
    </section>

    <div v-if="settingsOpen" class="settings-mask" @click.self="settingsOpen = false">
      <section
        class="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div class="settings-head">
          <h2 id="settings-title" class="settings-title">系统设置</h2>
          <button class="icon-btn" type="button" aria-label="关闭设置" @click="settingsOpen = false">
            <AppIcon name="close" :size="28" />
          </button>
        </div>

        <div class="setting-row">
          <div class="setting-text">
            <p class="setting-name">护眼模式</p>
            <p class="setting-desc">米黄暖色背景，减少强光刺激</p>
          </div>
          <button
            class="switch"
            :class="{ on: settings.eyeCare }"
            type="button"
            role="switch"
            aria-label="护眼模式"
            :aria-checked="settings.eyeCare"
            @click="toggleSetting('eyeCare')"
          >
            <span class="switch-knob" />
          </button>
        </div>

        <div class="setting-row">
          <div class="setting-text">
            <p class="setting-name">训练提醒</p>
            <p class="setting-desc">进入首页时提醒今天未完成的训练</p>
          </div>
          <button
            class="switch"
            :class="{ on: settings.reminders }"
            type="button"
            role="switch"
            aria-label="训练提醒"
            :aria-checked="settings.reminders"
            @click="toggleSetting('reminders')"
          >
            <span class="switch-knob" />
          </button>
        </div>

        <button class="btn-primary settings-done" type="button" @click="settingsOpen = false">
          完成
        </button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: var(--gap);
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius);
  background-color: transparent;
  color: var(--color-primary);
  font-size: var(--font-base);
  font-weight: 600;
}

.settings-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
}

.settings-panel {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px var(--gap) calc(var(--gap) + 8px);
  border-radius: 20px 20px 0 0;
  background-color: var(--color-card);
}

.settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.settings-title {
  font-size: var(--font-lg);
}

.icon-btn {
  padding: 4px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.setting-text {
  flex: 1;
}

.setting-name {
  margin-bottom: 4px;
  font-size: var(--font-base);
  font-weight: 600;
}

.setting-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.switch {
  position: relative;
  flex-shrink: 0;
  width: 62px;
  height: 36px;
  border: none;
  border-radius: 18px;
  background-color: #c9c9c9;
}

.switch.on {
  background-color: var(--color-primary);
}

.switch-knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #fff;
  transition: left 0.2s;
}

.switch.on .switch-knob {
  left: 30px;
}

.settings-done {
  margin-top: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: var(--font-lg);
}

.section-title .app-icon {
  color: var(--color-primary);
}

.profile-details {
  display: grid;
  gap: 12px;
  font-size: var(--font-base);
}

.profile-details div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.profile-details dt {
  color: var(--color-text-secondary);
}

.profile-details dd {
  font-weight: 600;
}

.error-message {
  color: var(--color-danger);
  font-size: var(--font-base);
}

.retry-button {
  margin-top: 12px;
}

.phone-not-configured {
  margin-bottom: 12px;
  color: var(--color-text-secondary);
  font-size: var(--font-base);
}

.emergency-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: var(--btn-height);
  border: 2px solid var(--color-text-secondary);
  border-radius: var(--radius);
  background: #fff;
  color: var(--color-text-secondary);
  font-size: var(--font-lg);
}
</style>
