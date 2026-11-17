const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { after, before, test } = require('node:test')
const { today } = require('../src/utils/helper')

let dataDir
let getTodayQuote

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elder-rehab-quote-'))
  process.env.DATA_DIR = dataDir
  ;({ getTodayQuote } = require('../src/services/quote.service'))
})

after(async () => {
  if (dataDir) {
    await fs.rm(dataDir, { recursive: true, force: true })
  }
  delete process.env.DATA_DIR
})

async function writeQuotes(quotes) {
  await fs.writeFile(
    path.join(dataDir, 'quote.json'),
    JSON.stringify(quotes),
    'utf8'
  )
}

test('returns the active quote for the current server date', async () => {
  const date = today()
  const expected = {
    id: 'quote-today',
    content: '今天也值得为自己的努力鼓掌。',
    date,
    isActive: true
  }
  await writeQuotes([expected])

  assert.deepEqual(await getTodayQuote(), expected)
})

test('returns null when there is no active quote for today', async () => {
  await writeQuotes([
    {
      id: 'quote-old',
      content: '旧金句',
      date: '1900-01-01',
      isActive: true
    },
    {
      id: 'quote-disabled',
      content: '未启用金句',
      date: today(),
      isActive: false
    }
  ])

  assert.equal(await getTodayQuote(), null)
})
