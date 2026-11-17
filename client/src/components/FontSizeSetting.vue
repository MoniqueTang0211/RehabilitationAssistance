<script setup>
// 字体设置组件（负责人：C）：小/中/大三档切换，选中态高亮
// props：modelValue 当前档位；emit('update:modelValue', size) 供父组件保存
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'medium' }
})
const emit = defineEmits(['update:modelValue'])

const options = [
  { value: 'small', label: '小', sample: 'A' },
  { value: 'medium', label: '中（推荐）', sample: 'A' },
  { value: 'large', label: '大', sample: 'A' }
]

const current = computed(() => props.modelValue)

function pick(value) {
  if (value !== current.value) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <div class="font-setting">
    <div class="font-title">字体大小</div>
    <div class="font-options">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="font-option"
        :class="{ active: opt.value === current, ['size-' + opt.value]: true }"
        @click="pick(opt.value)"
      >
        <span class="sample" :class="'sample-' + opt.value">{{ opt.sample }}</span>
        <span>{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.font-title {
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: 16px;
}

.font-options {
  display: flex;
  gap: 12px;
}

.font-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 2px solid #ddd;
  border-radius: var(--radius);
  background: #fff;
  font-size: var(--font-base);
  color: var(--color-text);
}

.font-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 700;
}

.sample {
  line-height: 1;
  font-weight: 700;
}

.sample-small {
  font-size: 20px;
}

.sample-medium {
  font-size: 28px;
}

.sample-large {
  font-size: 38px;
}
</style>
