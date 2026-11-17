// tasks.json 数据访问（负责人：B）只做数据操作，禁止写业务判断
const { readJson } = require('../utils/jsonFile')

const FILE = 'tasks.json'

function findAll() {
  return readJson(FILE)
}

function findById(id) {
  return findAll().find((t) => t.id === id) || null
}

module.exports = { findAll, findById }
