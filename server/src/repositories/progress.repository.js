// progress.json 数据访问（负责人：B）
// 注意：progress 模块归属 A，此文件仅提供打卡重算所需的最小方法，M4 联调时与 A 的同名文件合并
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
