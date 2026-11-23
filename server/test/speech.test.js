const assert = require('node:assert/strict')
const { test } = require('node:test')
const { PARAM_ERROR, SERVER_ERROR } = require('../src/utils/errorCode')

function freshService(env) {
  const saved = {}
  for (const key of ['BAIDU_API_KEY', 'BAIDU_SECRET_KEY', 'BAIDU_ASR_DEV_PID']) {
    saved[key] = process.env[key]
    if (env[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = env[key]
    }
  }
  delete require.cache[require.resolve('../src/config')]
  delete require.cache[require.resolve('../src/services/speech.service')]
  const service = require('../src/services/speech.service')
  for (const key of Object.keys(saved)) {
    if (saved[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = saved[key]
    }
  }
  return service
}

// 构造 16k / 单声道 / 16bit 的 PCM WAV
function buildWav(sampleRate, channels, bitsPerSample, pcmBytes) {
  const buffer = Buffer.alloc(44 + pcmBytes.length)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + pcmBytes.length, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28)
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(pcmBytes.length, 40)
  pcmBytes.copy(buffer, 44)
  return buffer
}

const validWav = buildWav(16000, 1, 16, Buffer.alloc(16000 * 2)) // 1 秒静音

test('speech service rejects requests without configured keys with a friendly error', async () => {
  const service = freshService({ BAIDU_API_KEY: '', BAIDU_SECRET_KEY: '' })
  await assert.rejects(
    service.transcribe({ audio: validWav.toString('base64') }),
    (error) => error.code === SERVER_ERROR && /尚未开通/.test(error.message)
  )
})

test('speech service validates the audio payload before any network call', async () => {
  const service = freshService({ BAIDU_API_KEY: 'test-key', BAIDU_SECRET_KEY: 'test-secret' })

  for (const input of [undefined, null, 'x', [], { }, { audio: '' }, { audio: 42 }]) {
    await assert.rejects(
      service.transcribe(input),
      (error) => error.code === PARAM_ERROR,
      `should reject ${JSON.stringify(input)}`
    )
  }

  // 非 WAV 数据
  await assert.rejects(
    service.transcribe({ audio: Buffer.from('not a wav file at all......').toString('base64') }),
    (error) => error.code === PARAM_ERROR
  )

  // 采样率不符合 16k
  await assert.rejects(
    service.transcribe({ audio: buildWav(44100, 1, 16, Buffer.alloc(44100 * 2)).toString('base64') }),
    (error) => error.code === PARAM_ERROR
  )

  // 双声道
  await assert.rejects(
    service.transcribe({ audio: buildWav(16000, 2, 16, Buffer.alloc(16000 * 4)).toString('base64') }),
    (error) => error.code === PARAM_ERROR
  )

  // 空录音
  await assert.rejects(
    service.transcribe({ audio: buildWav(16000, 1, 16, Buffer.alloc(0)).toString('base64') }),
    (error) => error.code === PARAM_ERROR
  )

  // 超过 60 秒
  await assert.rejects(
    service.transcribe({ audio: buildWav(16000, 1, 16, Buffer.alloc(16000 * 2 * 61)).toString('base64') }),
    (error) => error.code === PARAM_ERROR && /60 秒/.test(error.message)
  )
})
