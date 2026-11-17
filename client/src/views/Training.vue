<script setup>
// 康复训练页（负责人：B）：今日任务列表 + 打卡
import { ref, onMounted } from 'vue'
import TaskCard from '../components/TaskCard.vue'
import { getTodayPlan, checkin } from '../api/plan'

const tasks = ref([])
const loading = ref(true)
const busyTaskId = ref('') // 正在提交打卡的任务，防止连点

async function load() {
  loading.value = true
  try {
    tasks.value = await getTodayPlan()
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

// TODO(M4联调): 换成 utils/toast（A 完成后替换此占位实现）
function showToast(msg) {
  alert(msg)
}

onMounted(load)
</script>

<template>
  <div class="page-title">今日康复训练</div>

  <div v-if="loading" class="card empty-tip">加载中…</div>
  <div v-else-if="tasks.length === 0" class="card empty-tip">今日暂无任务，好好休息</div>

  <template v-else>
    <TaskCard
      v-for="item in tasks"
      :key="item.taskId"
      :item="item"
      :busy="busyTaskId === item.taskId"
      @checkin="onCheckin"
    />
  </template>
</template>

<style scoped>
.empty-tip {
  text-align: center;
  font-size: var(--font-lg);
  color: var(--color-text-secondary);
  padding: 40px var(--gap);
}
</style>
