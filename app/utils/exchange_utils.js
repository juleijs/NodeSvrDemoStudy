const env = process.env.NODE_ENV || 'dev'
const path = require('path')
const request = require('superagent')
const config = require('./../../config')
const models = require('./../model/index')
const querystring = require('querystring')

class ExchangeUtils {

  constructor() {
    this.config = config.adPublication || {}
    this.domain = this.config.domain || ''
    this.tokenFilePath = path.resolve(__dirname + './../../data/exchangeToken')
  }

  /**
   * 校验token是否过期，并返回
   */
  async _verifyToken () {
    let currentTime = Date.now()
    let model = (new models.token_model).model()
    let tokenResult = await model.findOne({
      where: {
        type: 1,
        env
      }
    })
    let tokenObj = {}
    if (tokenResult.content) tokenObj = JSON.parse(tokenResult.content)
    if (Object.keys(tokenResult).length < 1) return false
    let { accessToken, expire, invokeTime } = tokenObj
    expire = parseInt(expire) * 1000
    let expireTime = invokeTime + expire
    if (!accessToken || currentTime > expireTime) return false
    return accessToken
  }

  /**
   * 刷新token并保存文件
   */
  async _refreshToken () {
    let res = await request.get(`${this.domain}/token`)
    let resBody = res.body
    if (resBody.code != 'moden.base.success') return false
    let data = resBody.data
    let model = (new models.token_model).model()
    let token = await model.findOne({where: {type: 1, env}})
    token.status = 0
    token.env = env
    token.info = JSON.stringify(data)
    token.content = JSON.stringify(data)
    token.save()
    return data.accessToken
  }

  async getToken () {
    let token = await this._verifyToken()
    if (token) return token
    return await this._refreshToken()
  }

  async addAdPlan (params) {
    let token = await this.getToken()
    if (!token) return false
    let res = await request.post(`${this.domain}/adplan/create`).timeout({
      deadline: 60000
    }).send({
      sourceFile: params.sourceFile,
      startTime: params.startTime,
      endTime: params.endTime,
      industry: params.industry,
      token: token
    })
    let resBody = res.body
    return resBody
  }

  /**
   * 广告计划单号获取每日投放数据
   * @param {int} adplanNo
   */
  async getAdPlanReport (adplanNo) {
    let queryParams = querystring.stringify({adplanNo})
    let res = await request.get(`${this.domain}/adplan/report?` + queryParams)
    let resBody = res.body
    if (resBody.code != 'moden.base.success') return false
    return resBody.data
  }
}

module.exports = new ExchangeUtils()
