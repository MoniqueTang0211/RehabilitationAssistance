<script setup>
// 任务卡片组件（负责人：B）
// 点击标题用 jQuery 做图文指引展开/收起动画（作业要求 jQuery 局部交互）
// props：item 任务数据（含 status）、busy 是否提交中；按钮触发打卡
import { ref } from 'vue'
import $ from 'jquery'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  item: { type: Object, required: true },
  busy: { type: Boolean, default: false }
})

const emit = defineEmits(['checkin', 'cancel'])

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
        <div class="task-meta">
          <AppIcon name="clock" :size="18" />
          <span class="task-meta-text">建议 {{ item.duration }} 分钟</span>
        </div>
      </div>
      <span class="task-head-right">
        <span class="badge" :class="{ done: item.status === 'done' }">
          <AppIcon v-if="item.status === 'done'" name="check" :size="18" />
          {{ item.status === 'done' ? '已打卡' : '待打卡' }}
        </span>
        <span
          class="detail-toggle"
          role="button"
          :aria-label="expanded ? '收起图文指引' : '查看图文指引'"
          :aria-expanded="expanded"
        >
          <AppIcon class="task-chevron" :class="{ open: expanded }" name="chevron-down" :size="26" />
        </span>
      </span>
    </div>

    <!-- 图文指引：默认收起，点击标题 jQuery slideToggle 展开 -->
    <div ref="detailEl" class="task-detail">
      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="task-img" />
      <p class="task-desc">{{ item.description }}</p>
    </div>

    <button
      v-if="item.status === 'done'"
      class="task-cancel-btn"
      :disabled="busy"
      @click="emit('cancel', item)"
    >
      <AppIcon name="close" :size="22" />{{ busy ? '撤销中…' : '撤销打卡' }}
    </button>
    <button
      v-else
      class="btn-primary task-checkin-btn"
      :disabled="busy"
      @click="emit('checkin', item)"
    >
      <AppIcon v-if="busy" name="clock" :size="24" />
      {{ busy ? '提交中…' : '完成打卡' }}
    </button>
  </div>
</template>

<style scoped>
.task-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: var(--font-lg);
  font-weight: 700;
}

.task-meta {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.task-meta .app-icon {
  margin-top: 5px;
}

.task-meta-text {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.task-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.detail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  cursor: pointer;
}

.task-chevron {
  color: var(--color-primary);
  transition: transform 0.2s ease;
}

.task-chevron.open {
  transform: rotate(180deg);
}

.badge {
  display: flex;
  align-items: center;
  gap: 4px;
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

.task-checkin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.task-cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: var(--btn-height);
  margin-top: 4px;
  border: 2px solid var(--color-danger);
  border-radius: var(--radius);
  background: var(--color-card);
  color: var(--color-danger);
  font: inherit;
  font-size: var(--font-lg);
  font-weight: 600;
}

.task-cancel-btn:active {
  opacity: 0.85;
}

.task-cancel-btn:disabled {
  opacity: 0.5;
}
</style>
