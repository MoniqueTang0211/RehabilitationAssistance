<script setup>
import { onBeforeUnmount, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { transcribeSpeech } from '../api/speech'

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

const MAX_RECORD_SECONDS = 60
const TARGET_SAMPLE_RATE = 16000

// idle | recording | transcribing
const voiceState = ref('idle')
const voiceError = ref('')
let mediaStream = null
let mediaRecorder = null
let audioChunks = []
let recordTimer = null

const voiceInputSupported = typeof window !== 'undefined'
  && Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  && Boolean(window.MediaRecorder)
  && Boolean(window.AudioContext || window.webkitAudioContext)

function submit() {
  const content = props.modelValue.trim()
  if (content && !props.submitting) {
    emit('submit', content)
  }
}

function appendTranscript(transcript) {
  if (!transcript) {
    return
  }

  const currentText = props.modelValue
  const separator = currentText.trim() && !/[，。！？；、]$/.test(currentText.trim())
    ? '，'
    : ''
  emit('update:modelValue', `${currentText}${separator}${transcript}`.slice(0, 200))
}

function clearRecordTimer() {
  if (recordTimer) {
    clearTimeout(recordTimer)
    recordTimer = null
  }
}

function releaseStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

function downmixToMono(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels
  if (channelCount === 1) {
    return audioBuffer.getChannelData(0)
  }

  const length = audioBuffer.length
  const mixed = new Float32Array(length)
  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = audioBuffer.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      mixed[i] += data[i]
    }
  }
  for (let i = 0; i < length; i += 1) {
    mixed[i] /= channelCount
  }
  return mixed
}

function resampleLinear(input, fromRate, toRate) {
  if (fromRate === toRate) {
    return input
  }

  const outLength = Math.max(1, Math.floor((input.length * toRate) / fromRate))
  const output = new Float32Array(outLength)
  const ratio = fromRate / toRate
  for (let i = 0; i < outLength; i += 1) {
    const position = i * ratio
    const index = Math.floor(position)
    const fraction = position - index
    const a = input[index] || 0
    const b = index + 1 < input.length ? input[index + 1] : a
    output[i] = a + (b - a) * fraction
  }
  return output
}

function writeString(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i))
  }
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// 录音解码 -> 单声道 -> 重采样 16k -> PCM16 WAV -> base64（百度短语音识别要求）
async function encodeWav16kMono(arrayBuffer) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const audioContext = new AudioContextClass()
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer)
    const mono = downmixToMono(decoded)
    const resampled = resampleLinear(mono, decoded.sampleRate, TARGET_SAMPLE_RATE)

    const sampleCount = resampled.length
    const buffer = new ArrayBuffer(44 + sampleCount * 2)
    const view = new DataView(buffer)
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + sampleCount * 2, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // PCM
    view.setUint16(22, 1, true) // 单声道
    view.setUint32(24, TARGET_SAMPLE_RATE, true)
    view.setUint32(28, TARGET_SAMPLE_RATE * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, 'data')
    view.setUint32(40, sampleCount * 2, true)

    let offset = 44
    for (let i = 0; i < sampleCount; i += 1) {
      const clamped = Math.max(-1, Math.min(1, resampled[i]))
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
      offset += 2
    }
    return bufferToBase64(buffer)
  } finally {
    audioContext.close()
  }
}

async function handleRecordingStopped() {
  releaseStream()
  const recorder = mediaRecorder
  mediaRecorder = null
  const blob = new Blob(audioChunks, { type: (recorder && recorder.mimeType) || 'audio/webm' })
  audioChunks = []

  if (!blob.size) {
    voiceState.value = 'idle'
    voiceError.value = '没有录到声音，请重新录音。'
    return
  }

  voiceState.value = 'transcribing'
  try {
    const wavBase64 = await encodeWav16kMono(await blob.arrayBuffer())
    const data = await transcribeSpeech(wavBase64)
    appendTranscript(data && typeof data.text === 'string' ? data.text.trim() : '')
  } catch (error) {
    voiceError.value = (error && error.message) || '语音识别失败，请改用文字输入。'
  } finally {
    voiceState.value = 'idle'
  }
}

function startVoiceInput() {
  if (!voiceInputSupported || props.submitting || voiceState.value !== 'idle') {
    return
  }

  voiceError.value = ''
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      mediaStream = stream
      audioChunks = []
      try {
        mediaRecorder = new MediaRecorder(stream)
      } catch {
        releaseStream()
        voiceError.value = '当前浏览器不支持录音，请改用文字输入。'
        return
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      mediaRecorder.onerror = () => {
        voiceError.value = '录音失败，请重试或改用文字输入。'
        stopVoiceInput()
      }
      mediaRecorder.onstop = () => {
        handleRecordingStopped()
      }

      try {
        mediaRecorder.start()
      } catch {
        releaseStream()
        mediaRecorder = null
        voiceError.value = '暂时无法启动录音，请稍后重试或改用文字输入。'
        return
      }

      voiceState.value = 'recording'
      // 百度短语音识别限制单次 60 秒，超时自动停止
      recordTimer = setTimeout(stopVoiceInput, MAX_RECORD_SECONDS * 1000)
    })
    .catch((error) => {
      const name = error && error.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        voiceError.value = '麦克风权限未开启，请在浏览器设置中允许使用麦克风。'
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        voiceError.value = '未检测到麦克风，请检查设备后重试。'
      } else {
        voiceError.value = '无法打开麦克风，请检查权限后重试。'
      }
    })
}

function stopVoiceInput() {
  clearRecordTimer()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop()
    } catch {
      releaseStream()
      mediaRecorder = null
      voiceState.value = 'idle'
    }
  } else {
    releaseStream()
    if (voiceState.value === 'recording') {
      voiceState.value = 'idle'
    }
  }
}

onBeforeUnmount(() => {
  clearRecordTimer()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = null
    try {
      mediaRecorder.stop()
    } catch {
      // 忽略卸载时的停止异常
    }
  }
  releaseStream()
})
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
        :disabled="!voiceInputSupported || submitting || voiceState === 'transcribing'"
        :aria-pressed="voiceState === 'recording'"
        @click="voiceState === 'recording' ? stopVoiceInput() : startVoiceInput()"
      >
        {{ voiceState === 'recording' ? '停止语音输入' : (voiceState === 'transcribing' ? '正在识别…' : '开始语音输入') }}
      </button>
      <p v-if="!voiceInputSupported" class="voice-hint" role="status">
        当前浏览器不支持语音输入，请使用文字留言。
      </p>
      <p v-else class="voice-hint">
        点击"开始语音输入"后说话，再次点击停止，单次录音不超过 60 秒；识别结果会填入上方留言框，请确认后再发送。
      </p>
      <p v-if="voiceState === 'recording'" class="voice-status" role="status">
        正在录音，请开始说话…
      </p>
      <p v-else-if="voiceState === 'transcribing'" class="voice-status" role="status">
        正在识别语音，请稍候…
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
        <AppIcon name="send" :size="24" />
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}
</style>
