// 请求日志中间件（A / 底座负责人维护）
// 规则（设计文档 5.2）：方法、路径、耗时、状态码；单行输出；不含密码与 token
module.exports = function logMiddleware(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const line = `[INFO] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
    console.log(line)
  })
  next()
}
