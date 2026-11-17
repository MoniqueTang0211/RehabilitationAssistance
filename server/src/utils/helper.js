// id 生成与时间格式化（A / 底座负责人维护）
const crypto = require('crypto')
const dayjs = require('dayjs')

// uuid v4
function genId() {
  return crypto.randomUUID()
}

// ISO8601 当前时间
function now() {
  return dayjs().toISOString()
}

// 今日日期 YYYY-MM-DD
function today() {
  return dayjs().format('YYYY-MM-DD')
}

module.exports = { genId, now, today }
