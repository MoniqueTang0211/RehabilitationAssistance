// 每日任务与打卡业务（负责人：B）
const planRepository = require('../repositories/plan.repository')
const progressRepository = require('../repositories/progress.repository')
const taskService = require('./task.service')
const { BusinessError } = require('../utils/response')
const { NOT_FOUND, DUPLICATE } = require('../utils/errorCode')
const { genId, now, today } = require('../utils/helper')

// 今日任务：当天无记录时按当前康复阶段自动生成
function getTodayPlan(userId) {
  const date = today()
  let records = planRepository.findByUserAndDate(userId, date)
  if (records.length === 0) {
    records = generateTodayPlan(userId, date)
  }
  // 关联训练项目信息，前端拿到即可直接渲染
  return records.map((r) => {
    const task = taskService.getTaskDetail(r.taskId)
    return {
      id: r.id,
      taskId: r.taskId,
      title: task.title,
      description: task.description,
      imageUrl: task.imageUrl,
      duration: task.duration,
      status: r.status,
      checkedAt: r.checkedAt
    }
  })
}

// 按用户当前康复阶段生成当日任务（全部 pending）
function generateTodayPlan(userId, date) {
  const progress = progressRepository.findByUserId(userId)
  const stage = progress ? progress.stage : 'early'
  const tasks = taskService.listActiveTasks().filter((t) => t.stage === stage)
  const records = tasks.map((t) => ({
    id: genId(),
    userId,
    taskId: t.id,
    date,
    status: 'pending',
    checkedAt: null
  }))
  records.forEach((r) => planRepository.insert(r))
  return records
}

// 打卡：标记完成、防重复，并重算总进度
function checkin(userId, taskId) {
  taskService.getTaskDetail(taskId) // 任务不存在时抛 40401
  const date = today()
  const record = planRepository.findByUserTaskDate(userId, taskId, date)
  if (!record) {
    throw new BusinessError(NOT_FOUND, '今日任务中不存在该项目')
  }
  if (record.status === 'done') {
    throw new BusinessError(DUPLICATE, '今日已打卡')
  }
  record.status = 'done'
  record.checkedAt = now()
  planRepository.update(record)
  const progress = recalcProgress(userId, date)
  return {
    record: { taskId: record.taskId, status: record.status, checkedAt: record.checkedAt },
    progress
  }
}

// 进度重算规则：当日已完成数 ÷ 当日任务总数 × 100，四舍五入
function recalcProgress(userId, date) {
  const records = planRepository.findByUserAndDate(userId, date)
  const total = records.length
  const done = records.filter((r) => r.status === 'done').length
  const existing = progressRepository.findByUserId(userId)
  const progress = {
    id: existing ? existing.id : genId(),
    userId,
    stage: existing ? existing.stage : 'early',
    totalPercent: total === 0 ? 0 : Math.round((done / total) * 100),
    updatedAt: now()
  }
  return progressRepository.upsert(progress)
}

// 历史打卡记录（含项目名称，按日期倒序）
function getRecords(userId) {
  return planRepository.findByUser(userId).map((r) => {
    const task = taskService.getTaskDetail(r.taskId)
    return {
      id: r.id,
      taskId: r.taskId,
      title: task.title,
      date: r.date,
      status: r.status,
      checkedAt: r.checkedAt
    }
  })
}

module.exports = { getTodayPlan, checkin, getRecords }
