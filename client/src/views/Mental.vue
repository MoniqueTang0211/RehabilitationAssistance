<script setup>
import { onMounted, ref } from 'vue'
import QuoteCard from '../components/QuoteCard.vue'
import { getTodayQuote } from '../api/quote'

const quote = ref(null)
const loading = ref(true)
const errorMessage = ref('')

async function loadTodayQuote() {
  loading.value = true
  errorMessage.value = ''

  try {
    quote.value = await getTodayQuote()
  } catch (error) {
    errorMessage.value = error.message || '暂时无法获取金句，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadTodayQuote)
</script>

<template>
  <main>
    <h1 class="page-title">心理关怀</h1>
    <p v-if="loading" class="page-message" role="status">正在为你准备今日金句…</p>
    <div v-else-if="errorMessage" class="page-message error-message" role="alert">
      <p>{{ errorMessage }}</p>
      <button class="btn-primary retry-button" type="button" @click="loadTodayQuote">
        重试
      </button>
    </div>
    <QuoteCard v-else :quote="quote" />
  </main>
</template>

<style scoped>
.page-message {
  margin: 0 var(--gap);
  padding: var(--gap);
  font-size: var(--font-base);
  text-align: center;
}

.error-message {
  color: var(--color-danger);
}

.retry-button {
  margin-top: var(--gap);
}
</style>
