const env = process.env.NODE_ENV
const path = require('path')
const fs = require('fs')

let config = {
  h5Domain: 'http://h5.vds.cc512.com',
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
  signKey: '123456',
  sms: {
    apiKey: '',
    signText: ''
  },
  industrys: require('./industry.json')
}

module.exports = config