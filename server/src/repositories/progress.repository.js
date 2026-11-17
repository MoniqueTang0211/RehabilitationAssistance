// progress.json 数据访问（负责人：A）
// 打卡重算与进度读取共用此文件
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
