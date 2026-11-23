const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { after, before, test } = require('node:test')

let dataDir
let moodService

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elder-rehab-mood-'))
  process.env.DATA_DIR = dataDir
  await fs.writeFile(path.join(dataDir, 'mood.json'), '[]', 'utf8')
  moodService = require('../src/services/mood.service')
})

after(async () => {
  if (dataDir) {
    await fs.rm(dataDir, { recursive: true, force: true })
  }
  delete process.env.DATA_DIR
})

test('saves a mood and returns the saved record', async () => {
  const record = await moodService.saveTodayMood('user-001', { mood: 'good' })
  assert.equal(record.userId, 'user-001')
  assert.equal(record.mood, 'good')
  assert.equal(record.note, '')
})

test('updates the same record when saving twice on the same day', async () => {
  await moodService.saveTodayMood('user-001', { mood: 'good' })
  const updated = await moodService.saveTodayMood('user-001', { note: '今天走路稳一点' })
  const list = await moodService.getRecentMoods('user-001')

  assert.equal(updated.mood, 'good') // 只传 note 时保留原 mood
  assert.equal(updated.note, '今天走路稳一点')
  assert.equal(list.filter((m) => m.date === updated.date).length, 1) // 一人一天一条
})

test('keeps moods of different users separate', async () => {
  await moodService.saveTodayMood('user-001', { mood: 'great' })
  await moodService.saveTodayMood('user-002', { mood: 'tired' })

  assert.equal((await moodService.getTodayMood('user-001')).mood, 'great')
  assert.equal((await moodService.getTodayMood('user-002')).mood, 'tired')
})

test('returns 7-day padded list ordered newest first', async () => {
  const list = await moodService.getRecentMoods('user-001')
  assert.equal(list.length, 7)
  for (let i = 1; i < list.length; i += 1) {
    assert.ok(list[i - 1].date > list[i].date)
  }
})

test('rejects invalid mood value', async () => {
  await assert.rejects(
    () => moodService.saveTodayMood('user-001', { mood: 'angry' }),
    /心情选项不正确/
  )
})

test('rejects note longer than 50 characters', async () => {
  await assert.rejects(
    () => moodService.saveTodayMood('user-001', { note: '啊'.repeat(51) }),
    /不能超过 50 字/
  )
})
