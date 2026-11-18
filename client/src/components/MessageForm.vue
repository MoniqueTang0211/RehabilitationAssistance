<script setup>
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const isListening = ref(false)
const voiceError = ref('')
let recognition = null

const speechRecognitionSupported = typeof window !== 'undefined'
  && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

function submit() {
  const content = props.modelValue.trim()
  if (content && !props.submitting) {
    emit('submit', content)
  }
}

function stopVoiceInput() {
  if (recognition && isListening.value) {
    try {
      recognition.stop()
    } catch {
      isListening.value = false
      voiceError.value = '暂时无法停止语音输入，请稍后重试。'
    }
  }
}

function startVoiceInput() {
  if (!speechRecognitionSupported || props.submitting) {
    return
  }

  voiceError.value = ''
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  try {
    recognition = new SpeechRecognition()
  } catch {
    voiceError.value = '暂时无法启动语音输入，请稍后重试或改用文字输入。'
    return
  }

  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim()
    if (!transcript) {
      return
    }

    const currentText = props.modelValue
    const separator = currentText.trim() && !/[，。！？；、]$/.test(currentText.trim())
      ? '，'
      : ''
    const updatedText = `${currentText}${separator}${transcript}`.slice(0, 200)
    emit('update:modelValue', updatedText)
  }
  recognition.onerror = (event) => {
    if (event.error === 'aborted') {
      return
    }

    const messages = {
      'not-allowed': '麦克风权限未开启，请在浏览器设置中允许使用麦克风。',
      'service-not-allowed': '浏览器语音识别服务不可用，请改用文字输入。',
      'audio-capture': '未检测到麦克风，请检查设备后重试。',
      network: '语音识别网络连接失败，请改用文字输入或稍后重试。',
      'no-speech': '没有听到语音，请靠近麦克风后重试。'
    }
    voiceError.value = messages[event.error] || '语音识别失败，请改用文字输入。'
  }
  recognition.onend = () => {
    isListening.value = false
  }

  try {
    isListening.value = true
    recognition.start()
  } catch {
    isListening.value = false
    voiceError.value = '暂时无法启动语音输入，请稍后重试或改用文字输入。'
  }
}

onBeforeUnmount(stopVoiceInput)
</script>

<template>
  <form class="card message-form" @submit.prevent="submit">
    <label for="custom-message" class="form-label">写下你想告诉康复师的话</label>
    <textarea
      id="custom-message"
      class="message-input"
      :value="modelValue"
      maxlength="200"
      rows="4"
      :disabled="submitting"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <div class="voice-input">
      <button
        class="voice-button"
        type="button"
        :disabled="!speechRecognitionSupported || submitting"
        :aria-pressed="isListening"
        @click="isListening ? stopVoiceInput() : startVoiceInput()"
      >
        {{ isListening ? '停止语音输入' : '开始语音输入' }}
      </button>
      <p v-if="!speechRecognitionSupported" class="voice-hint" role="status">
        当前浏览器不支持语音输入，请使用文字留言。
      </p>
      <p v-else class="voice-hint">
        语音识别由浏览器提供，需要允许麦克风，并在安全网页（HTTPS 或 localhost）中使用；识别结果会填入上方留言框，请确认后再发送。
      </p>
      <p v-if="isListening" class="voice-status" role="status">
        正在听，请开始说话…
      </p>
      <p v-if="voiceError" class="voice-error" role="alert">
        {{ voiceError }}
      </p>
    </div>
    <div class="form-footer">
      <span class="character-count">{{ modelValue.length }} / 200</span>
      <button
        class="btn-primary submit-button"
        type="submit"
        :disabled="submitting || !modelValue.trim()"
      >
        {{ submitting ? '正在发送…' : '发送留言' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.message-form {
  display: grid;
  gap: 12px;
}

.form-label {
  font-size: var(--font-base);
  font-weight: 600;
}

.message-input {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #9e9e9e;
  border-radius: var(--radius);
  font: inherit;
  line-height: 1.5;
  resize: vertical;
}

.voice-input {
  display: grid;
  gap: 6px;
}

.voice-button {
  min-height: var(--btn-height);
  padding: 8px 12px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius);
  background: var(--color-primary-light);
  color: var(--color-text);
  font: inherit;
}

.voice-button:disabled {
  opacity: 0.6;
}

.voice-hint,
.voice-status,
.voice-error {
  margin: 0;
  font-size: var(--font-base);
}

.voice-hint {
  color: var(--color-text-secondary);
}

.voice-status {
  color: var(--color-primary);
}

.voice-error {
  color: var(--color-danger);
}

.message-input:focus {
  outline: 3px solid var(--color-primary-light);
  border-color: var(--color-primary);
}

.form-footer {
  display: grid;
  gap: 8px;
}

.character-count {
  color: var(--color-text-secondary);
  font-size: var(--font-base);
  text-align: right;
}

.submit-button {
  width: 100%;
}
</style>
