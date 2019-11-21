const request = require('superagent')
const smsConfig = require('./../../config').sms
const apiKey = smsConfig.apiKey
const signText = smsConfig.signText

class SmsUtils {
  /**
   * 发送单条短信
   * @param {*} mobile
   * @param {*} code
   */
  async sendVerifyCodeSms(mobile, code) {
    let post_data = {
      'apiKey': apiKey,
      'mobile': mobile,
      'text': `${signText}您的验证码是:${code}`
    }
    return await this._post('https://sms.yunpian.com/v2/sms/single_send.json', post_data)
  }

  async getBalance() {
    let post_data = {
      'apiKey': apiKey
    }
    return await this._post('https://sms.yunpian.com/v2/user/get.json', post_data)
  }

  async _post(url, content) {
    let result = await request.post(url)
      .set('Accept', 'application/json;charset=utf-8;')
      .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8;')
      .send(content)
    return result.response || result.body
  }
}

module.exports = new SmsUtils()