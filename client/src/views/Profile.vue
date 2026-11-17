<script setup>
import { onMounted, ref } from 'vue'
import FontSizeSetting from '../components/FontSizeSetting.vue'
import { getProfile, saveSettings } from '../api/user'
import store, { setFontSize } from '../store'
import { dial } from '../utils/dial'
import { showToast } from '../utils/toast'

const profile = ref(null)
const loading = ref(true)
const loadError = ref('')
const savingFontSize = ref(false)
const emergencyPhone = (import.meta.env.VITE_EMERGENCY_PHONE || '').trim()

document.documentElement.dataset.font = store.fontSize

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

onMounted(loadProfile)
</script>

<template>
  <main class="page-with-tab">
    <h1 class="page-title">个人中心</h1>

    <section class="card profile-card" aria-labelledby="profile-title">
      <h2 id="profile-title" class="section-title">个人信息</h2>
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
      <h2 id="emergency-title" class="section-title">紧急求助</h2>
      <p v-if="!emergencyPhone" class="phone-not-configured">
        紧急求助电话尚未配置，暂不能拨号。
      </p>
      <button
        class="btn-primary"
        type="button"
        :disabled="!emergencyPhone"
        @click="callEmergencyNumber"
      >
        {{ emergencyPhone ? `拨打 ${emergencyPhone}` : '紧急求助电话未配置' }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.section-title {
  margin-bottom: 12px;
  font-size: var(--font-lg);
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
</style>
