<script setup>
// 个人中心页（负责人：C）：用户信息 + 字体三档调节 + 紧急拨号 + 退出登录
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FontSizeSetting from '../components/FontSizeSetting.vue'
import { getProfile, saveSettings } from '../api/user'
import { dial } from '../utils/dial'
import { showToast } from '../utils/toast'
import { clearLogin, setFontSize } from '../store'

const router = useRouter()

const EMERGENCY_PHONE = '120' // 紧急求助电话

const profile = ref(null)
const fontSize = ref('medium')
const saving = ref(false)

onMounted(async () => {
  try {
    profile.value = await getProfile()
    fontSize.value = profile.value.fontSize || 'medium'
  } catch (e) {
    showToast(e.message || '加载失败，请稍后再试')
  }
})

// 切换字体：立即保存到服务端并全局生效
async function onFontChange(size) {
  if (saving.value) return
  saving.value = true
  const prev = fontSize.value
  fontSize.value = size
  setFontSize(size) // 先本地生效，体验更即时
  try {
    await saveSettings({ fontSize: size })
    showToast('字体大小已保存')
  } catch (e) {
    fontSize.value = prev
    setFontSize(prev) // 保存失败回滚
    showToast(e.message || '保存失败，请稍后再试')
  } finally {
    saving.value = false
  }
}

function onLogout() {
  clearLogin()
  showToast('已退出登录')
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="page-title">个人中心</div>

  <!-- 用户信息 -->
  <div v-if="profile" class="card user-card">
    <div class="avatar">{{ profile.name ? profile.name.slice(0, 1) : '用户' }}</div>
    <div class="user-info">
      <div class="user-name">{{ profile.name }}</div>
      <div class="user-meta">{{ profile.age }} 岁 · 用户名：{{ profile.username }}</div>
    </div>
  </div>
  <div v-else class="card user-card loading-tip">加载中…</div>

  <!-- 字体设置 -->
  <div class="card">
    <FontSizeSetting :model-value="fontSize" @update:model-value="onFontChange" />
  </div>

  <!-- 紧急求助 -->
  <div class="card">
    <div class="s-title">紧急求助</div>
    <p class="s-desc">遇到紧急情况，点击按钮一键呼叫急救电话</p>
    <button class="btn-danger" @click="dial(EMERGENCY_PHONE)">📞 呼叫 120 急救</button>
  </div>

  <!-- 退出登录 -->
  <div class="card">
    <button class="btn-logout" @click="onLogout">退出登录</button>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px var(--gap);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: var(--font-xl);
  font-weight: 700;
}

.user-meta {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-top: 6px;
}

.loading-tip {
  justify-content: center;
}

.s-title {
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: 8px;
}

.s-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-bottom: 14px;
}

.btn-danger {
  display: block;
  width: 100%;
  height: var(--btn-height);
  border: none;
  border-radius: var(--radius);
  background: var(--color-danger);
  color: #fff;
  font-size: var(--font-lg);
  font-weight: 600;
}

.btn-danger:active {
  opacity: 0.85;
}

.btn-logout {
  display: block;
  width: 100%;
  height: var(--btn-height);
  border: 2px solid var(--color-text-secondary);
  border-radius: var(--radius);
  background: #fff;
  color: var(--color-text-secondary);
  font-size: var(--font-lg);
}
</style>
