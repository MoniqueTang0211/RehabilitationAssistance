// Express 实例与中间件装配（A / 底座负责人维护）
const express = require('express')
const cors = require('cors')
const config = require('./config')
const logMiddleware = require('./middlewares/log.middleware')
const errorMiddleware = require('./middlewares/error.middleware')
const authMiddleware = require('./middlewares/auth.middleware')

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())
app.use(logMiddleware)

// 健康检查（无需登录）
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'up' } })
})

// 登录接口（无需登录）
app.use('/api/auth', require('./routes/auth.route'))

// ===== 以下接口全部需要登录 =====
app.use(authMiddleware)

// 业务路由：/api/{resource}，各模块负责人在对应 route 文件内实现
app.use('/api/user', require('./routes/user.route'))
app.use('/api/progress', require('./routes/progress.route'))
app.use('/api/tasks', require('./routes/task.route'))
app.use('/api/plans', require('./routes/plan.route'))
app.use('/api', require('./routes/message.route')) // /phrases 与 /messages
app.use('/api/quotes', require('./routes/quote.route'))

// 统一异常处理必须放在路由之后
app.use(errorMiddleware)

module.exports = app
