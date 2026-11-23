<script setup>
// 康复训练页（负责人：B）：今日完成度 + 任务列表 + 打卡 + 历史记录
import { ref, computed, onMounted } from 'vue'
import TaskCard from '../components/TaskCard.vue'
import ProgressBar from '../components/ProgressBar.vue'
import AppIcon from '../components/AppIcon.vue'
import { getTodayPlan, checkin, cancelCheckin, getRecords } from '../api/plan'
import { showToast } from '../utils/toast'

const tasks = ref([]) // 今日任务
const records = ref([]) // 历史打卡记录
const loading = ref(true)
const busyTaskId = ref('') // 正在提交打卡的任务，防止连点
const cancelingTaskId = ref('') // 正在撤销打卡的任务，防止连点

const doneCount = computed(() => tasks.value.filter((t) => t.status === 'done').length)
const todayPercent = computed(() =>
  tasks.value.length === 0 ? 0 : Math.round((doneCount.value / tasks.value.length) * 100)
)

async function load() {
  loading.value = true
  try {
    tasks.value = await getTodayPlan()
    records.value = await getRecords()
  } catch (e) {
    showToast(e.message || '加载失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

async function onCheckin(item) {
  if (item.status === 'done' || busyTaskId.value) return
  busyTaskId.value = item.taskId
  try {
    const data = await checkin(item.taskId)
    const target = tasks.value.find((t) => t.taskId === item.taskId)
    if (target) {
      target.status = data.record.status
      target.checkedAt = data.record.checkedAt
    }
    // 历史记录同步更新，避免重新请求
    const rec = records.value.find((r) => r.id && r.taskId === item.taskId && r.status === 'pending')
    if (rec) {
      rec.status = 'done'
      rec.checkedAt = data.record.checkedAt
    }
    showToast('打卡成功，继续加油！')
  } catch (e) {
    showToast(e.message || '打卡失败，请稍后再试')
    if (e.code === 40901) {
      item.status = 'done' // 重复打卡兜底：刷新为已完成
    }
  } finally {
    busyTaskId.value = ''
  }
}

// 撤销打卡：还原为未完成，同步今日任务与历史记录
async function onCancelCheckin(item) {
  if (item.status !== 'done' || cancelingTaskId.value || busyTaskId.value) return
  cancelingTaskId.value = item.taskId
  try {
    const data = await cancelCheckin(item.taskId)
    const target = tasks.value.find((t) => t.taskId === item.taskId)
    if (target) {
      target.status = data.record.status
      target.checkedAt = data.record.checkedAt
    }
    const dateStr = new Date().toISOString().slice(0, 10)
    const rec = records.value.find(
      (r) => r.taskId === item.taskId && r.date === dateStr && r.status === 'done'
    )
    if (rec) {
      rec.status = 'pending'
      rec.checkedAt = null
    }
    showToast('已撤销打卡。')
  } catch (e) {
    showToast(e.message || '撤销失败，请稍后再试')
  } finally {
    cancelingTaskId.value = ''
  }
}

// 历史记录按日期分组倒序（今天的不重复展示，今日进度已在上方）
const historyGroups = computed(() => {
  const dateStr = new Date().toISOString().slice(0, 10)
  const byDate = {}
  for (const r of records.value) {
    if (r.date === dateStr) continue
    ;(byDate[r.date] = byDate[r.date] || []).push(r)
  }
  return Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => ({
      date,
      items: byDate[date],
      done: byDate[date].filter((r) => r.status === 'done').length
    }))
})

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(load)
</script>

<template>
  <main class="page-with-tab">
    <div class="page-title"><AppIcon name="dumbbell" :size="32" />今日康复训练</div>

    <!-- 今日完成度 -->
    <div v-if="!loading && tasks.length > 0" class="card summary">
      <div class="summary-text">今日完成 {{ doneCount }} / {{ tasks.length }} 项</div>
      <ProgressBar :percent="todayPercent" />
    </div>

    <div v-if="loading" class="card empty-tip">加载中…</div>
    <div v-else-if="tasks.length === 0" class="card empty-tip">今日暂无任务，好好休息</div>

    <template v-else>
      <TaskCard
        v-for="item in tasks"
        :key="item.taskId"
        :item="item"
        :busy="busyTaskId === item.taskId || cancelingTaskId === item.taskId"
        @checkin="onCheckin"
        @cancel="onCancelCheckin"
      />
    </template>

    <!-- 历史打卡记录 -->
    <div v-if="!loading && historyGroups.length > 0" class="history">
      <div class="history-title"><AppIcon name="clock" :size="26" />历史打卡记录</div>
      <div v-for="g in historyGroups" :key="g.date" class="card history-card">
        <div class="history-date">
          {{ g.date }}
          <span class="history-stat">完成 {{ g.done }} / {{ g.items.length }} 项</span>
        </div>
        <div v-for="r in g.items" :key="r.id" class="history-item">
          <span>{{ r.title }}</span>
          <span class="history-right" :class="{ missed: r.status !== 'done' }">
            {{ r.status === 'done' ? `已打卡 ${fmtTime(r.checkedAt)}` : '未完成' }}
          </span>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.summary {
  margin-bottom: var(--gap);
}

.summary-text {
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  font-size: var(--font-lg);
  color: var(--color-text-secondary);
  padding: 40px var(--gap);
}

.history {
  margin-top: 24px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: 12px;
}

.history-title .app-icon {
  color: var(--color-primary);
}

.history-card {
  margin-bottom: 12px;
}

.history-date {
  font-size: var(--font-base);
  font-weight: 700;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.history-stat {
  float: right;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.history-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-base);
  padding: 8px 0;
}

.history-right {
  color: var(--color-primary);
}

.history-right.missed {
  color: var(--color-text-secondary);
}
</style>
