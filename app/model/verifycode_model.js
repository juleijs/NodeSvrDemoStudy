const Model = require('./../../lib/model')
const { verifycode } = require('./../../config/models')
const smsUtils = require('./../utils/sms_utils')

class VerifyCodeModel extends Model {
  model() {
    return this.db().define('verify_code_records', verifycode()[0], verifycode()[1])
  }

  // 发送
  async send(mobile) {
    let ret = {}
    try {
      if (mobile) {
        let code = this._generateValidateCode()
        await smsUtils.sendVerifyCodeSms(mobile, code)
        await this.model().build({
          mobile,
          verify_code: code,
          status: 1
        }).save()
        ret.code = 0
        ret.message = '发送验证码成功'
      } else {
        ret.code = 400
        ret.message = '请检查参数'
      }
    } catch(err) {
      ret.code = 500
      ret.message = '短信服务发送错误，请稍后重试'
    }
    return ret
  }

  /**
   * 验证手机验证码
   * @param {*} mobile 
   * @param {*} code 
   */
  async verify (mobile, code) {
    let ret = {}
    try {
      if (!mobile || !code) {
        ret.code = 400
        ret.message = '请检查参数'
        return ret
      }
      let rows = await this.model().findOne({
        where: {
          mobile,
          verify_code: code
        },
        order: [
          ['id', 'DESC']
        ]
      })
      if(!rows) {
        ret.code = 1
        ret.message = '验证码错误'
        return ret
      }
      
      // 时间过期
      let now = parseInt(Date.now() / 1000)
      if (rows.create_time + 10 * 60 < now) {
        ret.message = '验证码已失效'
      }
      if (rows.status != 1) {
        ret.code = 1
        ret.message = '验证码已失效'
      } else {
        rows.status = 0
        await rows.save()
        ret.code = 0
        ret.message = '验证成功'
      }
      return ret
    } catch(err) {
      ret.code = 500
      ret.message = '服务器错误'
      return ret
    }
  }

  _generateValidateCode() {
    return Math.random().toString().substr(2, 4)
  }

  /**
   * 验证邮箱验证码
   * @param {*} email 
   * @param {*} code 
   */
  async verifyEmailCode(email, code) {
    let ret = {
      code: 1,
      message: ''
    }
    let find = await this.model().findOne({
      where: {
        email,
        verify_code: code
      }
    })
    let now = parseInt(Date.now() / 1000)

    if (!find) {
      ret.message = '无效验证码'
      return ret
    } else {
      if (find.status == 1) {
        ret.message = '验证码已失效'
        return ret
      }
      if (find.create_time + 10 * 60 < now) {
        ret.message = '验证码已失效'
        return ret
      }
      find.status = 1
      let updateRet = await find.save()
      if (!updateRet) {
        ret.message = '验证失效'
        return ret
      }
    }
    ret.code = 0
    return ret
  }

  /**
   * 创建邮箱验证码
   * @param {*} email
   */
  async createEmailCode(email, t = null) {
    let opt = {}
    if (t) {
      opt.transaction = t
    }
    let code = this._generateValidateCode()
    let ret = await this.model().create({
      email,
      verify_code: code,
      status: 0
    }, opt)
    return ret
  }
}

module.exports = VerifyCodeModel