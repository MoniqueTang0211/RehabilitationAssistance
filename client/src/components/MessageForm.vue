<script setup>
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

function submit() {
  const content = props.modelValue.trim()
  if (content && !props.submitting) {
    emit('submit', content)
  }
}
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
