// dailyPlan.json 数据访问（负责人：B）只做数据操作，禁止写业务判断
const { readJson, writeJson } = require('../utils/jsonFile')

const FILE = 'dailyPlan.json'

function findAll() {
  return readJson(FILE)
}

// 某用户某天的全部任务记录
function findByUserAndDate(userId, date) {
  return findAll().filter((p) => p.userId === userId && p.date === date)
}

// 联合唯一查询：userId + taskId + date
function findByUserTaskDate(userId, taskId, date) {
  return findAll().find((p) => p.userId === userId && p.taskId === taskId && p.date === date) || null
}

// 某用户全部历史记录，按日期倒序
function findByUser(userId) {
  return findAll()
    .filter((p) => p.userId === userId)
    .sort((a, b) => (a.date === b.date ? (a.checkedAt < b.checkedAt ? 1 : -1) : a.date < b.date ? 1 : -1))
}

function insert(record) {
  const all = findAll()
  all.push(record)
  writeJson(FILE, all)
  return record
}

function update(updated) {
  const all = findAll().map((p) => (p.id === updated.id ? updated : p))
  writeJson(FILE, all)
  return updated
}

module.exports = { findAll, findByUserAndDate, findByUserTaskDate, findByUser, insert, update }
