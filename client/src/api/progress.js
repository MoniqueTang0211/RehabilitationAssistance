// 康复进度接口（负责人：A）
import request from './request'

// 本人康复阶段与总进度
export function getProgress() {
  return request.get('/progress')
}
