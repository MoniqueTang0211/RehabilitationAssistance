<script setup>
// 首页（负责人：A）：康复进度展示（ProgressBar 组件）+ 当前阶段 + 去训练入口
import { ref, onMounted } from 'vue'
import ProgressBar from '../components/ProgressBar.vue'
import AppIcon from '../components/AppIcon.vue'
import { getProgress } from '../api/progress'
import { showToast } from '../utils/toast'

const stageMap = { early: '康复初期', middle: '康复中期', late: '康复后期' }

const progress = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    progress.value = await getProgress()
  } catch (e) {
    showToast(e.message || '加载失败，请稍后再试')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page-with-tab">
    <div class="page-title"><AppIcon name="home" :size="32" />您好，今天也要加油</div>

    <div v-if="loading" class="card loading-tip">加载中…</div>

    <template v-else-if="progress">
      <div class="card">
        <div class="stage">当前阶段：{{ stageMap[progress.stage] || '康复初期' }}</div>
        <ProgressBar :percent="progress.totalPercent" />
        <p class="tip">完成今日训练任务，进度会自动更新</p>
      </div>

      <div class="card entry">
        <router-link to="/training">
          <button class="btn-primary entry-btn">
            去做今日训练
            <AppIcon name="arrow-right" :size="26" />
          </button>
        </router-link>
      </div>
    </template>
  </main>
</template>

<style scoped>
.loading-tip {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px var(--gap);
}

.stage {
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: 16px;
}

.tip {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-top: 14px;
}

.entry a {
  text-decoration: none;
}

.entry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
