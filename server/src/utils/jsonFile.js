// JSON 文件读写基础封装（供各 Repository 复用）
// 文件名只允许来自 Repository 层传入的白名单常量，禁止由请求参数拼接路径
const fs = require('fs')
const path = require('path')
const config = require('../config')
const { BusinessError } = require('./response')
const { DATA_ERROR } = require('./errorCode')

const dataDir = path.resolve(__dirname, '../../', config.dataDir)

function readJson(fileName) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf-8'))
  } catch (err) {
    throw new BusinessError(DATA_ERROR, `数据读取失败：${fileName}`)
  }
}

function writeJson(fileName, data) {
  try {
    fs.writeFileSync(path.join(dataDir, fileName), JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    throw new BusinessError(DATA_ERROR, `数据写入失败：${fileName}`)
  }
}

module.exports = { readJson, writeJson }
