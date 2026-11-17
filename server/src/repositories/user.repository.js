// user.json 数据访问（负责人：A）只做数据操作，禁止写业务判断
const { readJson, writeJson } = require('../utils/jsonFile')

const FILE = 'user.json'

function findAll() {
  return readJson(FILE)
}

function findById(id) {
  return findAll().find((u) => u.id === id) || null
}

function findByName(username) {
  return findAll().find((u) => u.username === username) || null
}

function update(updated) {
  const all = findAll().map((u) => (u.id === updated.id ? updated : u))
  writeJson(FILE, all)
  return updated
}

module.exports = { findAll, findById, findByName, update }
