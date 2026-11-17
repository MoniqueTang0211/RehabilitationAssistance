// 训练项目业务（负责人：B）
const taskRepository = require('../repositories/task.repository')
const { BusinessError } = require('../utils/response')
const { NOT_FOUND } = require('../utils/errorCode')

// 启用中的训练项目列表，按 sortOrder 升序
function listActiveTasks() {
  return taskRepository
    .findAll()
    .filter((t) => t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// 单个项目图文详情，不存在或已下线返回 40401
function getTaskDetail(id) {
  const task = taskRepository.findById(id)
  if (!task || !task.isActive) {
    throw new BusinessError(NOT_FOUND, '训练项目不存在')
  }
  return task
}

module.exports = { listActiveTasks, getTaskDetail }
