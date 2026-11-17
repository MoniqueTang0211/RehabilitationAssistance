<script setup>
import { onMounted, ref } from 'vue'
import MessageForm from '../components/MessageForm.vue'
import AppIcon from '../components/AppIcon.vue'
import { getPhrases, sendMessage } from '../api/message'
import { showToast } from '../utils/toast'

const phrases = ref([])
const phrasesLoading = ref(true)
const phrasesError = ref('')
const submitting = ref(false)
const draft = ref('')

async function loadPhrases() {
  phrasesLoading.value = true
  phrasesError.value = ''

  try {
    const result = await getPhrases()
    if (!Array.isArray(result)) {
      throw new Error('快捷语句数据格式不正确')
    }
    phrases.value = result
  } catch (error) {
    phrasesError.value = error.message || '暂时无法获取快捷语句，请稍后重试'
  } finally {
    phrasesLoading.value = false
  }
}

async function submitMessage(payload) {
  if (submitting.value) {
    return
  }

  submitting.value = true
  try {
    await sendMessage(payload)
    if (payload.type === 'custom') {
      draft.value = ''
    }
    showToast('留言已发送，谢谢你告诉我们。')
  } catch (error) {
    showToast(error.message || '留言发送失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function submitQuickPhrase(phrase) {
  return submitMessage({ type: 'quick', quickPhraseId: phrase.id })
}

function submitCustomMessage(content) {
  return submitMessage({ type: 'custom', content })
}

onMounted(loadPhrases)
</script>

<template>
  <main class="page-with-tab">
    <h1 class="page-title"><AppIcon name="message" :size="32" />求助留言</h1>

    <section class="section" aria-labelledby="phrases-title">
      <h2 id="phrases-title" class="section-title">
        <AppIcon name="zap" :size="26" />快捷语句
      </h2>
      <p v-if="phrasesLoading" class="section-message" role="status">
        正在加载快捷语句…
      </p>
      <div v-else-if="phrasesError" class="section-message error-message" role="alert">
        <p>{{ phrasesError }}</p>
        <button class="btn-primary retry-button" type="button" @click="loadPhrases">
          重试
        </button>
      </div>
      <p v-else-if="phrases.length === 0" class="section-message">
        暂无快捷语句，你可以在下方写留言。
      </p>
      <div v-else class="phrase-list">
        <button
          v-for="phrase in phrases"
          :key="phrase.id"
          class="phrase-button"
          type="button"
          :disabled="submitting"
          @click="submitQuickPhrase(phrase)"
        >
          {{ phrase.content }}
        </button>
      </div>
    </section>

    <section class="section" aria-labelledby="custom-message-title">
      <h2 id="custom-message-title" class="section-title">
        <AppIcon name="edit" :size="26" />自定义留言
      </h2>
      <MessageForm
        v-model="draft"
        :submitting="submitting"
        @submit="submitCustomMessage"
      />
    </section>
  </main>
</template>

<style scoped>
.section {
  margin-bottom: var(--gap);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--gap) 12px;
  font-size: var(--font-lg);
}

.section-title .app-icon {
  color: var(--color-primary);
}

.section-message {
  margin: 0 var(--gap);
  padding: var(--gap);
  font-size: var(--font-base);
  text-align: center;
}

.error-message {
  color: var(--color-danger);
}

.retry-button {
  margin-top: 12px;
}

.phrase-list {
  display: grid;
  gap: 12px;
  padding: 0 var(--gap);
}

.phrase-button {
  min-height: var(--btn-height);
  padding: 12px 16px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius);
  background: var(--color-primary-light);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-base);
  text-align: left;
}

.phrase-button:disabled {
  opacity: 0.6;
}
</style>
