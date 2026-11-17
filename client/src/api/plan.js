// 每日任务与打卡接口（负责人：B）
import request from './request'

// 今日任务及状态（后端无记录时自动生成）
export function getTodayPlan() {
  return request.get('/plans/today')
}

// 提交打卡，返回 { record, progress }
export function checkin(taskId) {
  return request.post('/plans/checkin', { taskId })
}

// 历史打卡记录
export function getRecords() {
  return request.get('/plans/records')
}
