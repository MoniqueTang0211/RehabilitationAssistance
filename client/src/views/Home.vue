<script setup>
// 首页（负责人：A）：康复进度 + 今日任务概览 + 每日心情记录
import { computed, onMounted, ref } from 'vue'
import ProgressBar from '../components/ProgressBar.vue'
import AppIcon from '../components/AppIcon.vue'
import { getProgress } from '../api/progress'
import { getTodayPlan } from '../api/plan'
import { getRecentMoods } from '../api/mood'
import { settings } from '../store'
import { showToast } from '../utils/toast'

const stageMap = { early: '康复初期', middle: '康复中期', late: '康复后期' }

const MOOD_LABELS = {
  great: '很好',
  good: '还不错',
  normal: '一般',
  tired: '有点累',
  unwell: '不舒服'
}

const progress = ref(null)
const loading = ref(true)

const tasks = ref([])
const tasksLoading = ref(true)

// 近 7 天心情记录，来自服务端账号下的保存记录
const moodRecords = ref([])

function buildMoodRecords(list) {
  const now = new Date()
  return (Array.isArray(list) ? list : []).map((item, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = item.date || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      key,
      dateText: i === 0 ? '今天' : `${d.getMonth() + 1}月${d.getDate()}日`,
      moodText: MOOD_LABELS[item.mood] || '',
      note: item.note || ''
    }
  })
}

async function loadMoodRecords() {
  try {
    moodRecords.value = buildMoodRecords(await getRecentMoods())
  } catch {
    // 加载失败不阻塞首页，保持空列表
  }
}

const doneCount = computed(() => tasks.value.filter((t) => t.status === 'done').length)
const totalCount = computed(() => tasks.value.length)
const allDone = computed(() => totalCount.value > 0 && doneCount.value === totalCount.value)
const remainMinutes = computed(() =>
  tasks.value.filter((t) => t.status !== 'done').reduce((sum, t) => sum + (t.duration || 0), 0)
)
// 首页只展示前 3 条，完整列表在训练页
const previewTasks = computed(() => tasks.value.slice(0, 3))

async function loadProgress() {
  try {
    progress.value = await getProgress()
  } catch (e) {
    showToast(e.message || '加载失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

// 概览类数据加载失败不阻塞首页主体
async function loadTodayPlan() {
  try {
    const result = await getTodayPlan()
    tasks.value = Array.isArray(result) ? result : []
    // 设置中开启「训练提醒」时，进首页提示未完成的训练
    const pending = tasks.value.filter((t) => t.status !== 'done').length
    if (settings.reminders && pending > 0) {
      setTimeout(() => showToast(`今天还有 ${pending} 项训练没完成，记得做哦`, 3000), 800)
    }
  } catch (e) {
    tasks.value = []
  } finally {
    tasksLoading.value = false
  }
}

onMounted(() => {
  loadProgress()
  loadTodayPlan()
  loadMoodRecords()
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

      <section class="card" aria-labelledby="today-task-title">
        <div class="section-head">
          <h2 id="today-task-title" class="section-title">
            <AppIcon name="dumbbell" :size="26" />今日任务
          </h2>
          <span v-if="totalCount > 0" class="task-count">{{ doneCount }}/{{ totalCount }} 已完成</span>
        </div>

        <p v-if="tasksLoading" class="section-message" role="status">正在加载今日任务…</p>
        <p v-else-if="totalCount === 0" class="section-message">今日暂无训练任务。</p>
        <template v-else>
          <ul class="task-preview">
            <li v-for="task in previewTasks" :key="task.id" class="task-item">
              <span class="task-status" :class="{ done: task.status === 'done' }">
                <AppIcon :name="task.status === 'done' ? 'check' : 'clock'" :size="22" />
              </span>
              <span class="task-name">{{ task.title }}</span>
              <span class="task-meta">
                {{ task.status === 'done' ? '已完成' : `${task.duration} 分钟` }}
              </span>
            </li>
          </ul>
          <p class="task-summary">
            {{ allDone ? '今天的任务都完成了，真棒！' : `还剩 ${remainMinutes} 分钟，慢慢来，不着急。` }}
          </p>
          <router-link v-if="totalCount > previewTasks.length" class="task-more" to="/training">
            查看全部 {{ totalCount }} 项任务
            <AppIcon name="arrow-right" :size="22" />
          </router-link>
        </template>
      </section>

      <section class="card" aria-labelledby="mood-record-title">
        <div class="section-head">
          <h2 id="mood-record-title" class="section-title">
            <AppIcon name="heart" :size="26" />每日心情记录
          </h2>
          <router-link class="record-link" to="/mental">去记录</router-link>
        </div>

        <table class="mood-table">
          <thead>
            <tr>
              <th scope="col">日期</th>
              <th scope="col">心情</th>
              <th scope="col">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in moodRecords" :key="record.key">
              <td class="date-cell">{{ record.dateText }}</td>
              <td :class="record.moodText ? 'mood-cell' : 'muted'">
                {{ record.moodText || '未记录' }}
              </td>
              <td :class="record.note ? 'note-cell' : 'muted'">{{ record.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
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

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-lg);
}

.section-title .app-icon {
  color: var(--color-primary);
}

.task-count {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.section-message {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.task-preview {
  display: grid;
  gap: 12px;
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-base);
}

.task-status {
  display: flex;
  color: var(--color-text-secondary);
}

.task-status.done {
  color: var(--color-primary);
}

.task-name {
  flex: 1;
}

.task-meta {
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.task-summary {
  margin-top: 14px;
  font-size: var(--font-base);
  color: var(--color-primary);
}

.task-more {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
  font-size: var(--font-base);
  color: var(--color-primary);
  text-decoration: none;
}

.record-link {
  font-size: var(--font-base);
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.mood-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-base);
}

.mood-table th,
.mood-table td {
  padding: 10px 6px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.mood-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.mood-table tbody tr:last-child td {
  border-bottom: none;
}

.date-cell {
  white-space: nowrap;
}

.mood-cell {
  color: var(--color-primary);
  font-weight: 600;
  white-space: nowrap;
}

.note-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  color: var(--color-text-secondary);
}
</style>
