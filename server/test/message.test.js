const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { after, before, test } = require('node:test')
const { PARAM_ERROR, NOT_FOUND } = require('../src/utils/errorCode')

let dataDir
let messageService

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elder-rehab-message-'))
  process.env.DATA_DIR = dataDir
  messageService = require('../src/services/message.service')
})

after(async () => {
  if (dataDir) {
    await fs.rm(dataDir, { recursive: true, force: true })
  }
  delete process.env.DATA_DIR
})

async function writeData(phrases, messages = []) {
  await Promise.all([
    fs.writeFile(path.join(dataDir, 'quickPhrase.json'), JSON.stringify(phrases), 'utf8'),
    fs.writeFile(path.join(dataDir, 'message.json'), JSON.stringify(messages), 'utf8')
  ])
}

test('message service validates and persists quick and custom messages', async (t) => {
  const activePhrase = {
    id: 'phrase-active',
    content: '请帮我联系家人',
    sortOrder: 1,
    isActive: true
  }
  await writeData([
    { id: 'phrase-later', content: '稍后', sortOrder: 2, isActive: true },
    activePhrase,
    { id: 'phrase-disabled', content: '不显示', sortOrder: 0, isActive: false }
  ])

  await t.test('lists enabled phrases in display order', () => {
    assert.deepEqual(
      messageService.listPhrases().map((phrase) => phrase.id),
      ['phrase-active', 'phrase-later']
    )
  })

  await t.test('saves quick phrase text from the server-side phrase record', async () => {
    const message = messageService.createMessage('user-001', {
      type: 'quick',
      quickPhraseId: activePhrase.id,
      content: '忽略客户端传来的内容'
    })

    assert.equal(message.userId, 'user-001')
    assert.equal(message.quickPhraseId, activePhrase.id)
    assert.equal(message.content, activePhrase.content)
    assert.equal(message.status, 'pending')
    assert.ok(Number.isFinite(Date.parse(message.createdAt)))
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(dataDir, 'message.json'), 'utf8')), [message])
  })

  await t.test('trims custom content and validates its length', async () => {
    await writeData([activePhrase])
    const message = messageService.createMessage('user-001', {
      type: 'custom',
      content: '  我想咨询训练安排  '
    })

    assert.equal(message.content, '我想咨询训练安排')
    assert.equal(message.quickPhraseId, null)
    assert.throws(
      () => messageService.createMessage('user-001', { type: 'custom', content: '   ' }),
      (error) => error.code === PARAM_ERROR
    )
    assert.throws(
      () => messageService.createMessage('user-001', { type: 'custom', content: '字'.repeat(201) }),
      (error) => error.code === PARAM_ERROR
    )
  })

  await t.test('rejects disabled or unknown quick phrases', async () => {
    await writeData([{ ...activePhrase, isActive: false }])
    assert.throws(
      () => messageService.createMessage('user-001', {
        type: 'quick',
        quickPhraseId: activePhrase.id
      }),
      (error) => error.code === NOT_FOUND
    )
  })
})
