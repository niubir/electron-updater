const fs = require('fs')
const dotenv = require('dotenv')
const { join } = require('path')

dotenv.config(join('./.env'))

if (!process.env.FEED_URL) {
  console.error('Please set FEED_URL to env or .env file')
  process.exit(1)
}

const replaces = [
  {
    kv: {
      '{{FEED_URL}}': process.env.FEED_URL,
    },
    files: [
      join(__dirname, 'package.json'),
      join(__dirname, 'app-update.yml'),
    ],
  }
]

for (let replace of replaces) {
  for (let file of replace.files) {
    let fileBody = null
    try {
      fileBody = fs.readFileSync(file).toString()
    } catch (err) {
      console.error(`Read ${file} failed:`, err)
      continue
    }
    for (let k in replace.kv) {
      fileBody = fileBody.replace(k, replace.kv[k])
    }
    fs.writeFileSync(file, fileBody)
  }
}