<script setup>
// 任务卡片组件（负责人：B）
// 点击标题用 jQuery 做图文指引展开/收起动画（作业要求 jQuery 局部交互）
// props：item 任务数据（含 status）、busy 是否提交中；按钮触发打卡
import { ref } from 'vue'
import $ from 'jquery'

const props = defineProps({
  item: { type: Object, required: true },
  busy: { type: Boolean, default: false }
})

const emit = defineEmits(['checkin'])

const detailEl = ref(null)
const expanded = ref(false)

function toggleDetail() {
  expanded.value = !expanded.value
  $(detailEl.value).stop().slideToggle(200)
}
</script>

<template>
  <div class="card task-card">
    <div class="task-head" @click="toggleDetail">
      <div class="task-info">
        <div class="task-title">{{ item.title }}</div>
        <div class="task-meta">建议 {{ item.duration }} 分钟 · 点击{{ expanded ? '收起' : '查看' }}图文指引</div>
      </div>
      <span class="badge" :class="{ done: item.status === 'done' }">
        {{ item.status === 'done' ? '已打卡' : '待打卡' }}
      </span>
    </div>

    <!-- 图文指引：默认收起，点击标题 jQuery slideToggle 展开 -->
    <div ref="detailEl" class="task-detail">
      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="task-img" />
      <p class="task-desc">{{ item.description }}</p>
    </div>

    <button
      class="btn-primary"
      :disabled="item.status === 'done' || busy"
      @click="emit('checkin', item)"
    >
      {{ item.status === 'done' ? '已完成打卡' : busy ? '提交中…' : '完成打卡' }}
    </button>
  </div>
</template>

<style scoped>
.task-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
}

.task-title {
  font-size: var(--font-lg);
  font-weight: 700;
}

.task-meta {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.badge {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: var(--font-base);
  background: var(--color-warning);
  color: #fff;
}

.badge.done {
  background: var(--color-primary);
}

.task-detail {
  display: none; /* 初始收起，由 Training 页用 jQuery slideDown 展开 */
  padding-bottom: 12px;
}

.task-img {
  width: 100%;
  border-radius: var(--radius);
  margin-bottom: 10px;
}

.task-desc {
  font-size: var(--font-base);
  line-height: 1.8;
  color: var(--color-text);
}

button {
  margin-top: 4px;
}
</style>
