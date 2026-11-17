// 启动入口（A / 底座负责人维护）
const app = require('./app')
const config = require('./config')

app.listen(config.port, () => {
  console.log(`[INFO] server is running at http://localhost:${config.port}`)
})
