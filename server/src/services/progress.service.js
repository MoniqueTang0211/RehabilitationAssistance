// 康复进度业务（负责人：A）：进度由打卡写入（plan 模块），这里只做读取
const progressRepository = require('../repositories/progress.repository')

function getProgress(userId) {
  const record = progressRepository.findByUserId(userId)
  // 无记录时返回默认值，不报错（新用户尚未打卡）
  return record || { userId, stage: 'early', totalPercent: 0, updatedAt: null }
}

module.exports = { getProgress }
