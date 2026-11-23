<script setup>
import { computed, onMounted, ref } from 'vue'
import MessageForm from '../components/MessageForm.vue'
import AppIcon from '../components/AppIcon.vue'
import { getMyMessages, getPhrases, revokeMessage, sendMessage } from '../api/message'
import { showToast } from '../utils/toast'

const phrases = ref([])
const phrasesLoading = ref(true)
const phrasesError = ref('')
const submitting = ref(false)
const draft = ref('')
const selectedPhraseId = ref(null)
const sentMessages = ref([])
const revokingId = ref(null)

const selectedPhrase = computed(
  () => phrases.value.find((phrase) => phrase.id === selectedPhraseId.value) || null
)

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

async function loadSentMessages() {
  try {
    const result = await getMyMessages()
    sentMessages.value = Array.isArray(result) ? result : []
  } catch (error) {
    sentMessages.value = []
  }
}

async function submitMessage(payload) {
  if (submitting.value) {
    return null
  }

  submitting.value = true
  try {
    const message = await sendMessage(payload)
    if (payload.type === 'custom') {
      draft.value = ''
    }
    if (message && message.id) {
      sentMessages.value = [message, ...sentMessages.value.filter((item) => item.id !== message.id)]
    }
    showToast('留言已发送，谢谢你告诉我们。')
    return message
  } catch (error) {
    showToast(error.message || '留言发送失败，请稍后重试')
    return null
  } finally {
    submitting.value = false
  }
}

function submitQuickPhrase(phrase) {
  return submitMessage({ type: 'quick', quickPhraseId: phrase.id })
}

function selectPhrase(phrase) {
  if (submitting.value) {
    return
  }
  selectedPhraseId.value = selectedPhraseId.value === phrase.id ? null : phrase.id
}

async function sendSelectedPhrase() {
  const phrase = selectedPhrase.value
  if (!phrase) {
    return
  }

  const message = await submitQuickPhrase(phrase)
  if (message) {
    selectedPhraseId.value = null
  }
}

// 撤销误触发送的留言（已被查看则无法撤销）
async function revokeSent(message) {
  if (revokingId.value) {
    return
  }

  revokingId.value = message.id
  try {
    await revokeMessage(message.id)
    sentMessages.value = sentMessages.value.filter((item) => item.id !== message.id)
    showToast('已撤销发送的留言。')
  } catch (error) {
    showToast(error.message || '撤销失败，请稍后重试')
  } finally {
    revokingId.value = null
  }
}

function formatSentTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (num) => String(num).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function submitCustomMessage(content) {
  return submitMessage({ type: 'custom', content })
}

onMounted(() => {
  loadPhrases()
  loadSentMessages()
})
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
      <p v-if="!phrasesLoading && !phrasesError && phrases.length > 0" class="phrase-hint">
        点一下语句选中（会变绿并显示✓），再点下方「发送留言」
      </p>
      <div v-if="!phrasesLoading && !phrasesError && phrases.length === 0" class="section-message">
        暂无快捷语句，你可以在下方写留言。
      </div>
      <div v-if="!phrasesLoading && !phrasesError && phrases.length > 0" class="phrase-list">
        <button
          v-for="phrase in phrases"
          :key="phrase.id"
          class="phrase-button"
          :class="{ 'is-selected': selectedPhraseId === phrase.id }"
          type="button"
          :disabled="submitting"
          :aria-pressed="selectedPhraseId === phrase.id"
          @click="selectPhrase(phrase)"
        >
          <span class="phrase-marker" aria-hidden="true">
            <AppIcon v-if="selectedPhraseId === phrase.id" name="check" :size="18" />
          </span>
          <span class="phrase-text">{{ phrase.content }}</span>
          <span v-if="selectedPhraseId === phrase.id" class="phrase-badge">已选</span>
        </button>
      </div>
      <div v-if="selectedPhrase" class="phrase-actions">
        <button
          class="btn-primary phrase-send"
          type="button"
          :disabled="submitting"
          @click="sendSelectedPhrase"
        >
          <AppIcon name="send" :size="24" />发送留言
        </button>
      </div>
    </section>

    <section v-if="sentMessages.length" class="section" aria-labelledby="sent-title">
      <h2 id="sent-title" class="section-title">
        <AppIcon name="clock" :size="26" />已发送留言
      </h2>
      <p class="phrase-hint">误触发送的留言，可在被查看前逐条撤销</p>
      <div class="sent-list">
        <div v-for="item in sentMessages" :key="item.id" class="sent-card">
          <div class="sent-text">
            <p class="sent-content">{{ item.content }}</p>
            <p class="sent-tip">{{ formatSentTime(item.createdAt) }} · 待查看</p>
          </div>
          <button
            class="revoke-button"
            type="button"
            :disabled="revokingId === item.id"
            @click="revokeSent(item)"
          >
            <AppIcon name="close" :size="22" />撤销
          </button>
        </div>
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

.phrase-hint {
  margin: 0 var(--gap) 10px;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.phrase-button {
  display: flex;
  align-items: center;
  gap: 12px;
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

.phrase-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  background: #fff;
  color: var(--color-primary);
}

.phrase-text {
  flex: 1;
}

.phrase-button.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}

.phrase-button.is-selected .phrase-marker {
  border-color: #fff;
  background: #fff;
}

.phrase-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff;
  color: var(--color-primary);
  font-size: var(--font-base);
  font-weight: 700;
}

.phrase-button:disabled {
  opacity: 0.6;
}

.phrase-actions {
  display: flex;
  padding: 12px var(--gap) 0;
}

.phrase-send {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sent-list {
  display: grid;
  gap: 12px;
  padding: 0 var(--gap);
}

.sent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px dashed var(--color-warning);
  border-radius: var(--radius);
  background: #fff8ef;
}

.sent-text {
  flex: 1;
  min-width: 0;
}

.sent-content {
  font-size: var(--font-base);
  word-break: break-all;
}

.sent-tip {
  margin-top: 4px;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.revoke-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 48px;
  padding: 0 16px;
  border: 2px solid var(--color-danger);
  border-radius: var(--radius);
  background: var(--color-card);
  color: var(--color-danger);
  font: inherit;
  font-size: var(--font-base);
  font-weight: 600;
}

.revoke-button:active {
  opacity: 0.85;
}

.revoke-button:disabled {
  opacity: 0.5;
}
</style>
