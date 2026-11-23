// mood.json 数据访问（每日心情，一人一天一条）只做数据操作，禁止写业务判断
const { readJson, writeJson } = require('../utils/jsonFile')

const FILE = 'mood.json'

function findAll() {
  const all = readJson(FILE)
  return Array.isArray(all) ? all : []
}

// 联合唯一查询：userId + date
function findByUserAndDate(userId, date) {
  return findAll().find((m) => m.userId === userId && m.date === date) || null
}

// 某用户某天以来的全部记录，按日期倒序
function findByUserSince(userId, startDate) {
  return findAll()
    .filter((m) => m.userId === userId && m.date >= startDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

function insert(record) {
  const all = findAll()
  all.push(record)
  writeJson(FILE, all)
  return record
}

function update(updated) {
  const all = findAll().map((m) => (m.id === updated.id ? updated : m))
  writeJson(FILE, all)
  return updated
}

module.exports = { findByUserAndDate, findByUserSince, insert, update }
