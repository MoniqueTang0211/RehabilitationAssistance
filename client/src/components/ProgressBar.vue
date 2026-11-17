<script setup>
// 进度条组件（负责人：B）：大字号百分比 + 可视化进度条，Home 页消费
defineProps({
  percent: { type: Number, default: 0 }
})
</script>

<template>
  <div>
    <div class="progress-num">已完成 {{ percent }}%</div>
    <div class="progress-track">
      <div class="progress-bar" :style="{ width: percent + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.progress-num {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.progress-track {
  height: 16px;
  background: var(--color-primary-light);
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 8px;
  transition: width 0.4s ease;
}
</style>
