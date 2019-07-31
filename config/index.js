const env = process.env.NODE_ENV
const path = require('path')
const fs = require('fs')

let config = {
  port: 5400,
  oss: {
    region: 'oss-cn-shenzhen',
    accessKeyId: 'LTAIrRZ0BeRJpB0l',
    accessKeySecret: 'kaLkYLuDm5zc6PCzGtxKILqJgqGf3s',
    bucket: 'img-juren'
  },
  db: {
    host: '',
    port: 5579,
    dbname: '',
    username: '',
    password: '',
    maxLimit: 1000,
  },
}

module.exports = config