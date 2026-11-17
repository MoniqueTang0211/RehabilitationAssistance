// progress.json 数据访问（读写共用：进度读取归 A，打卡重算写入归 B）
const { readJson, writeJson } = require('../utils/jsonFile')

const FILE = 'progress.json'

function findByUserId(userId) {
  return readJson(FILE).find((p) => p.userId === userId) || null
}

function upsert(record) {
  const all = readJson(FILE)
  const idx = all.findIndex((p) => p.userId === record.userId)
  if (idx >= 0) {
    all[idx] = record
  } else {
    all.push(record)
  }
  writeJson(FILE, all)
  return record
}

module.exports = { findByUserId, upsert }
