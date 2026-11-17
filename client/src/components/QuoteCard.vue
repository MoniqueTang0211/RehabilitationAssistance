<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  quote: {
    type: Object,
    default: null
  }
})
</script>

<template>
  <article class="card quote-card" aria-live="polite">
    <div class="quote-icon">
      <AppIcon name="quote" :size="32" />
    </div>
    <blockquote v-if="quote && quote.content" class="quote-text">
      “{{ quote.content }}”
    </blockquote>
    <p v-else class="quote-text">
      愿你今天安心康复，每一点进步都值得肯定。
    </p>
    <time v-if="quote && quote.date" class="quote-date" :datetime="quote.date">
      {{ quote.date }}
    </time>
  </article>
</template>

<style scoped>
.quote-card {
  border-left: 5px solid var(--color-primary);
}

.quote-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  color: var(--color-primary);
}

.quote-text {
  color: var(--color-text);
  font-size: var(--font-lg);
  line-height: 1.8;
  text-align: center;
}

.quote-date {
  display: block;
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: var(--font-base);
  text-align: right;
}
</style>
