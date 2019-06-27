const OSS = require('ali-oss')
const path = require('path')
const Log = require('./../../lib/log')('ali-utils')
const dateUtils = require('./date_utils')
const ossConfig = require('./../../config').oss

class AliOssUtils {
  constructor() {
    // 配置信息
    this.config = {
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      allowedExtname: ['jpg', 'jpeg', 'gif', 'bmp', 'csv']
    }
    this.client = new OSS(this.config)
  }

  async upload (file) {
    try {
      let uploadPath = ''
    } catch (err) {
      console.log(err)
      Log.error('upload error:', err)
      return err
    }
  }
}

module.exports = new AliOssUtils()