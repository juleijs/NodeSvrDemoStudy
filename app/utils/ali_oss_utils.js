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
      let uploadPath = 'uploads/images/' + dateUtils.dateFormat(null, 'YYYYMMDD/')
      let localFilename = path.basename(file)
      let uploadFilename = localFilename
      Log.info('upload uploadFilename:', uploadFilename)
      let result = await this.client.put(uploadPath + uploadFilename, file)
      Log.info('upload result:', uploadFilename)
      return result
    } catch (err) {
      Log.error('upload error:', err)
      return err
    }
  }

  async uploadFile(file) {
    try {
      let uploadPath = '/backup/csv/'
      let localFilename = path.basename(file)
      Log.info('uploadFile file:', file)
      let result = await this.client.put(uploadPath + localFilename, file)
      Log.info('uploadFile result:', result)
      return result
    } catch(err) {
      Log.error('uploadFile error:', err)
      return err
    }
  }

  async listBuckets() {
    try {
      return await this.client.listBuckets()
    } catch(err) {
      return err.message
    }
  }
}

module.exports = new AliOssUtils()