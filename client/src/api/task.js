// 训练项目接口（负责人：B）
import request from './request'

// 启用中的训练项目列表
export function getTasks() {
  return request.get('/tasks')
}

// 单个项目图文详情
export function getTaskDetail(id) {
  return request.get(`/tasks/${id}`)
}
