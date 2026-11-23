const moodRepository = require('../repositories/mood.repository')
const { MOOD } = require('../models/enums')
const { BusinessError } = require('../utils/response')
const { PARAM_ERROR } = require('../utils/errorCode')
const { genId, now, today } = require('../utils/helper')
const dayjs = require('dayjs')

const MAX_NOTE_LENGTH = 50
const RECENT_DAYS = 7

async function getTodayMood(userId) {
  return moodRepository.findByUserAndDate(userId, today())
}

// 近 7 天心情记录：不足的日期用空记录补齐，按日期倒序（今天在最前）
async function getRecentMoods(userId) {
  const records = moodRepository.findByUserSince(
    userId,
    dayjs().subtract(RECENT_DAYS - 1, 'day').format('YYYY-MM-DD')
  )

  const byDate = new Map(records.map((m) => [m.date, m]))
  const list = []
  for (let i = 0; i < RECENT_DAYS; i += 1) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    const record = byDate.get(date)
    list.push({
      date,
      mood: record ? record.mood : null,
      note: record ? record.note : ''
    })
  }
  return list
}

// 保存今日心情：一人一天一条，mood 与 note 可只传其一，未传字段保留原值
async function saveTodayMood(userId, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BusinessError(PARAM_ERROR, '心情参数格式不正确')
  }

  const { mood, note } = input
  let moodValue = null
  let noteValue = null

  if (mood !== undefined) {
    if (!MOOD.includes(mood)) {
      throw new BusinessError(PARAM_ERROR, '心情选项不正确')
    }
    moodValue = mood
  }

  if (note !== undefined) {
    if (typeof note !== 'string') {
      throw new BusinessError(PARAM_ERROR, '心情内容格式不正确')
    }
    const text = note.trim()
    if (text.length > MAX_NOTE_LENGTH) {
      throw new BusinessError(PARAM_ERROR, `心情内容不能超过 ${MAX_NOTE_LENGTH} 字`)
    }
    noteValue = text
  }

  if (moodValue === null && noteValue === null) {
    throw new BusinessError(PARAM_ERROR, '请选择心情或写下心情文字')
  }

  const date = today()
  const existing = moodRepository.findByUserAndDate(userId, date)

  // 当天已有记录：合并保存；没有：新建
  if (existing) {
    return moodRepository.update({
      ...existing,
      mood: moodValue !== null ? moodValue : existing.mood,
      note: noteValue !== null ? noteValue : existing.note,
      updatedAt: now()
    })
  }

  return moodRepository.insert({
    id: genId(),
    userId,
    date,
    mood: moodValue,
    note: noteValue || '',
    updatedAt: now()
  })
}

module.exports = { getTodayMood, getRecentMoods, saveTodayMood }
