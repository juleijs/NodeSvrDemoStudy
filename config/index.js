const env = process.env.NODE_ENV
const path = require('path')
const fs = require('fs')

let config = {
  oss: {
    region: 'oss-cn-shenzhen',
    accessKeyId: 'LTAIrRZ0BeRJpB0l',
    accessKeySecret: 'kaLkYLuDm5zc6PCzGtxKILqJgqGf3s',
    bucket: 'img-juren'
  }
}

module.exports = config