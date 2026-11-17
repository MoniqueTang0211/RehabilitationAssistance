// 全局错误码定义（A / 底座负责人维护，与设计文档 5.1 一致）
module.exports = {
  PARAM_ERROR: 40001,      // 参数错误
  UNAUTHORIZED: 40101,     // 未登录 / token 失效
  FORBIDDEN: 40301,        // 权限不足
  NOT_FOUND: 40401,        // 资源不存在
  DUPLICATE: 40901,        // 重复操作（如重复打卡）
  SERVER_ERROR: 50001,     // 服务器内部错误
  DATA_ERROR: 50002        // 数据读写失败
}
