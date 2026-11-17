<script setup>
// 字体设置组件（负责人：C）：小/中/大三档切换，选中态高亮
// props：fontSize 当前档位、disabled 保存中禁用；emit('change', size) 供父组件保存
import AppIcon from './AppIcon.vue'

defineProps({
  fontSize: {
    type: String,
    default: 'medium'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])

const options = [
  { value: 'small', label: '小字' },
  { value: 'medium', label: '标准字' },
  { value: 'large', label: '大字' }
]
</script>

<template>
  <section class="card font-size-setting" aria-labelledby="font-size-title">
    <h2 id="font-size-title" class="setting-title">
      <AppIcon name="type" :size="26" />字体大小
    </h2>
    <div class="font-options">
      <button
        v-for="option in options"
        :key="option.value"
        class="font-option"
        :class="{ selected: fontSize === option.value }"
        type="button"
        :aria-pressed="fontSize === option.value"
        :disabled="disabled"
        @click="emit('change', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.setting-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: var(--font-lg);
}

.setting-title .app-icon {
  color: var(--color-primary);
}

.font-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.font-option {
  min-height: var(--btn-height);
  padding: 8px;
  border: 2px solid #bdbdbd;
  border-radius: var(--radius);
  background: var(--color-card);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.font-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  font-weight: 700;
}

.font-option:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

.font-option:disabled {
  cursor: wait;
  opacity: 0.6;
}
</style>
