<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import QuoteCard from '../components/QuoteCard.vue'
import AppIcon from '../components/AppIcon.vue'
import { getTodayQuote } from '../api/quote'
import { showToast } from '../utils/toast'

// ===== 今日金句 =====
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

// ===== 今日心情打卡（本地保存，按日期区分）=====
const moods = [
  {
    id: 'great',
    label: '很好',
    // 大笑脸 + 弯弯的笑眼
    face: '<circle cx="12" cy="12" r="9"/><path d="M7.6 13.1c1 2.8 2.7 4.2 4.4 4.2s3.4-1.4 4.4-4.2"/><path d="M8.1 9.3c.5-.8 1.2-1.2 1.9-1.2s1.4.4 1.9 1.2"/><path d="M12.1 9.3c.5-.8 1.2-1.2 1.9-1.2s1.4.4 1.9 1.2"/>'
  },
  {
    id: 'good',
    label: '还不错',
    // 浅笑 + 圆点眼
    face: '<circle cx="12" cy="12" r="9"/><path d="M8.5 13.6c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2"/><path d="M9 9.5v.01"/><path d="M15 9.5v.01"/>'
  },
  {
    id: 'normal',
    label: '一般',
    // 一条横线的嘴 + 圆点眼
    face: '<circle cx="12" cy="12" r="9"/><path d="M8.5 15h7"/><path d="M9 9.5v.01"/><path d="M15 9.5v.01"/>'
  },
  {
    id: 'tired',
    label: '有点累',
    // 闭上的眼睛 + 波浪嘴
    face: '<circle cx="12" cy="12" r="9"/><path d="M8.3 9.6h2.4"/><path d="M13.3 9.6h2.4"/><path d="M8.5 15.4c1-.9 2.2-.9 3.5 0 1.3.9 2.5.9 3.5 0"/>'
  },
  {
    id: 'unwell',
    label: '不舒服',
    // 打叉的眼睛 + 下撇的嘴
    face: '<circle cx="12" cy="12" r="9"/><path d="M8.1 8.9l2.1 2.1"/><path d="M10.2 8.9l-2.1 2.1"/><path d="M13.8 8.9l2.1 2.1"/><path d="M15.9 8.9l-2.1 2.1"/><path d="M8.5 16.3c1-1.8 2.2-2.7 3.5-2.7s2.5.9 3.5 2.7"/>'
  }
]

function dateKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const moodStorageKey = `rehab-mood-${dateKey()}`
const selectedMood = ref(localStorage.getItem(moodStorageKey) || '')

const selectedMoodText = computed(() => {
  const mood = moods.find((item) => item.id === selectedMood.value)
  return mood ? mood.label : ''
})

function pickMood(mood) {
  selectedMood.value = mood.id
  localStorage.setItem(moodStorageKey, mood.id)
  showToast(`已记录：今天心情${mood.label}`)
}

// 自定义心情：用自己的话记录，同样按日期保存在本地
const noteStorageKey = `rehab-mood-note-${dateKey()}`
const savedNote = ref(localStorage.getItem(noteStorageKey) || '')
const moodNote = ref(savedNote.value)

function saveNote() {
  const text = moodNote.value.trim()
  if (!text) {
    showToast('请先写下现在的心情')
    return
  }
  localStorage.setItem(noteStorageKey, text)
  savedNote.value = text
  showToast('心情已记下，愿你今天顺心。')
}

// ===== 1 分钟放松呼吸：吸气 4 秒 → 屏住 2 秒 → 呼气 6 秒，共 5 轮 =====
const phases = [
  { label: '慢慢吸气', seconds: 4 },
  { label: '轻轻屏住', seconds: 2 },
  { label: '缓缓呼气', seconds: 6 }
]
const CYCLE_SECONDS = 12
const TOTAL_SECONDS = 60

const breathing = ref(false)
const phaseIndex = ref(0)
const breathLeft = ref(TOTAL_SECONDS)
let breathTimer = null

function updatePhase(remaining) {
  const pos = (TOTAL_SECONDS - remaining) % CYCLE_SECONDS
  phaseIndex.value = pos < 4 ? 0 : pos < 6 ? 1 : 2
}

function toggleBreathing() {
  if (breathing.value) {
    stopBreathing()
    return
  }
  breathing.value = true
  breathLeft.value = TOTAL_SECONDS
  phaseIndex.value = 0
  breathTimer = setInterval(() => {
    breathLeft.value -= 1
    updatePhase(breathLeft.value)
    if (breathLeft.value <= 0) {
      stopBreathing()
      showToast('练习完成，今天也要好好照顾自己。')
    }
  }, 1000)
}

function stopBreathing() {
  clearInterval(breathTimer)
  breathTimer = null
  breathing.value = false
  phaseIndex.value = 0
  breathLeft.value = TOTAL_SECONDS
}

// ===== 每日关怀小贴士 =====
const tips = [
  { icon: 'sun', title: '晒晒太阳', text: '天气好的时候到窗边坐一会儿，晒 15 分钟太阳，心情也会跟着明朗起来。' },
  { icon: 'heart', title: '慢慢来，不用急', text: '康复是每天进步一点点，累了就休息一会儿，不和自己较劲。' },
  { icon: 'phone', title: '和家人聊聊天', text: '给家人打个电话，说说今天的小进步，被听见也是一种力量。' }
]

onMounted(loadTodayQuote)
onBeforeUnmount(stopBreathing)
</script>

<template>
  <main class="page-with-tab">
    <h1 class="page-title"><AppIcon name="sun" :size="32" />心理关怀</h1>

    <div v-if="loading" class="page-message" role="status">正在为你准备今日金句…</div>
    <div v-else-if="errorMessage" class="page-message error-message" role="alert">
      <p>{{ errorMessage }}</p>
      <button class="btn-primary retry-button" type="button" @click="loadTodayQuote">
        重试
      </button>
    </div>
    <QuoteCard v-else :quote="quote" />

    <section class="section" aria-labelledby="mood-title">
      <h2 id="mood-title" class="section-title">
        <AppIcon name="heart" :size="26" />今日心情
      </h2>
      <div class="card">
        <p class="mood-question">今天感觉怎么样？</p>
        <div class="mood-list" role="group" aria-label="选择今天的心情">
          <button
            v-for="mood in moods"
            :key="mood.id"
            class="mood-button"
            :class="{ active: selectedMood === mood.id }"
            type="button"
            :aria-pressed="selectedMood === mood.id"
            @click="pickMood(mood)"
          >
            <svg
              class="mood-face"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              v-html="mood.face"
            />
            <span class="mood-label">{{ mood.label }}</span>
          </button>
        </div>
        <p v-if="selectedMoodText" class="mood-result" role="status">
          今天的心情：{{ selectedMoodText }}，谢谢你告诉我们。
        </p>

        <div class="custom-mood">
          <label class="custom-mood-label" for="mood-note">自定义心情</label>
          <textarea
            id="mood-note"
            v-model="moodNote"
            class="custom-mood-input"
            rows="2"
            maxlength="50"
            placeholder="用自己的话写写现在的心情，比如：今天走路比昨天稳一点"
          />
          <button class="btn-save-note" type="button" @click="saveNote">
            保存心情
          </button>
          <p v-if="savedNote" class="saved-note" role="status">
            今天写下的心情：{{ savedNote }}
          </p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="breath-title">
      <h2 id="breath-title" class="section-title">
        <AppIcon name="activity" :size="26" />放松呼吸
      </h2>
      <div class="card breath-card">
        <div class="breath-circle" :class="breathing ? `phase-${phaseIndex}` : 'idle'">
          <span>{{ breathing ? phases[phaseIndex].label : '准备好了吗' }}</span>
        </div>
        <p class="breath-hint" aria-live="polite">
          {{
            breathing
              ? `跟着圆圈慢慢呼吸，剩余 ${breathLeft} 秒`
              : '吸气 4 秒、屏住 2 秒、呼气 6 秒，做 1 分钟，身心都会松下来。'
          }}
        </p>
        <button class="btn-primary" type="button" @click="toggleBreathing">
          {{ breathing ? '停止练习' : '开始放松（1 分钟）' }}
        </button>
      </div>
    </section>

    <section class="section" aria-labelledby="tips-title">
      <h2 id="tips-title" class="section-title">
        <AppIcon name="sun" :size="26" />每日关怀
      </h2>
      <ul class="tip-list">
        <li v-for="tip in tips" :key="tip.title" class="card tip-card">
          <div class="tip-icon"><AppIcon :name="tip.icon" :size="28" /></div>
          <div>
            <h3 class="tip-title">{{ tip.title }}</h3>
            <p class="tip-text">{{ tip.text }}</p>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.section {
  margin-top: var(--gap);
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

.mood-question {
  margin-bottom: 16px;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.mood-list {
  display: flex;
  gap: 8px;
}

.mood-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  border: 2px solid #eee;
  border-radius: var(--radius);
  background-color: #fff;
  color: var(--color-text-secondary);
  font-size: var(--font-base);
}

.mood-button.active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.mood-face {
  width: 44px;
  height: 44px;
}

.mood-label {
  white-space: nowrap;
}

.mood-result {
  margin-top: 16px;
  font-size: var(--font-base);
  color: var(--color-primary);
  text-align: center;
}

.custom-mood {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.custom-mood-label {
  display: block;
  margin-bottom: 10px;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.custom-mood-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: var(--font-base);
  line-height: 1.6;
  resize: vertical;
}

.custom-mood-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-save-note {
  display: block;
  width: 100%;
  height: var(--btn-height);
  margin-top: 12px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius);
  background-color: #fff;
  color: var(--color-primary);
  font-size: var(--font-base);
  font-weight: 600;
}

.btn-save-note:active {
  background-color: var(--color-primary-light);
}

.saved-note {
  margin-top: 12px;
  font-size: var(--font-base);
  color: var(--color-primary);
  text-align: center;
  word-break: break-all;
}

.breath-card {
  text-align: center;
}

.breath-circle {
  width: 168px;
  height: 168px;
  margin: 8px auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-lg);
  font-weight: 600;
  transform: scale(0.85);
}

.breath-circle.idle {
  transform: scale(0.85);
  transition: none;
}

.breath-circle.phase-0 {
  transform: scale(1.12);
  transition: transform 4s ease-in-out;
}

.breath-circle.phase-1 {
  transform: scale(1.12);
  transition: transform 0.8s ease-in-out;
}

.breath-circle.phase-2 {
  transform: scale(0.8);
  transition: transform 6s ease-in-out;
}

.breath-hint {
  margin-bottom: 20px;
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.tip-list {
  display: grid;
  gap: var(--gap);
  margin: 0 var(--gap);
  list-style: none;
}

.tip-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 0;
}

.tip-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.tip-title {
  margin-bottom: 6px;
  font-size: var(--font-base);
  font-weight: 600;
}

.tip-text {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
