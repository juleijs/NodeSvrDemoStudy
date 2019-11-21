/* eslint-disable require-atomic-updates */
const CommonController = require('./../../common/common_controller')

class PubController extends CommonController {
  async configs(ctx) {
    this.logger.info(ctx.uuid, 'configs()', 'body', ctx.body, 'query', ctx.query)
    let config = {}
    config.version = '1.0.0'
    let configModel = new this.models.config_model
    let configs = await configModel.model().findAll({
      where: {
        status: 1
      }
    })
    configs.forEach(item => {
      config[item.name] = item.content
    })
    ctx.ret.data = config
    return ctx.ret
  }

  async configByName(ctx) {
    let name = ctx.body.name
    let configModel = new this.models.config_model
    let config = await configModel.model().findOne({
      where: {
        status: 1,
        name
      }
    })
    ctx.ret.data = {
      name: config.title,
      value: config.content
    }
    return ctx.ret
  }

  async sendSmsCode(ctx) {
    let mobile = ctx.body.mobile
    let verifyModel = new this.models.verifycode_model
    let retMsg = await verifyModel.send(mobile)
    if (retMsg.code != 0) {
      this._fail(ctx, retMsg.message)
    }
    return ctx.ret
  }

  /**
   * 发送验证码
   * @param {*} ctx
   */
  async sendVerifyCode(ctx) {
    this.logger.info(ctx.uuid, 'sendVerifyCode()', 'body', ctx.body, 'query', ctx.query)
    let accountType = ctx.body.account_type || 1
    if (accountType == 2) {
      return await this.sendSmsCode(ctx)
    } else {
      let email = ctx.body.email || ''
      let verifyModel = new this.models.verifycode_model
      let t = await verifyModel.getTrans()
      try {
        let verifyCreateRet = await verifyModel.createEmailCode(email, t)
        this.logger.info(ctx.uuid, 'sendVerifyCode()', 'verifyCreateRet', verifyCreateRet)
        if (!verifyCreateRet) {
          ctx.ret.code = 1
          ctx.ret.message = '发送邮件验证码记录失败'
        }

        // 发送邮件
        let code = verifyCreateRet.verify_code
        let mailUtils = this.utils.mail_utils
        let sendRet = await mailUtils.sendCode(email, code)
        this.logger.info(ctx.uuid, 'sendVerifyCode()', 'sendRet', sendRet)
        if (sendRet.code != 0) {
          throw new Error(sendRet.message)
        }

        await t.commit()
      } catch(err) {
        this.logger.info(ctx.uuid, 'sendVerifyCode()', 'err', err.message)
        ctx.ret.code = 1
        ctx.ret.message = err.message

        await t.rollback()
      }

      return ctx.ret
    }
  }

  /**
   * 验证
   * @param {*} ctx
   */
  async checkVerifyCode(ctx) {
    let verifyRet = await this._verifyCodeCheck(ctx, {
      type: ctx.body.type || 1,
      email: ctx.body.email || '',
      mobile: ctx.body.mobile || '',
      verify_code: ctx.body.verify_code
    })
    ctx.ret = verifyRet
    return ctx.ret
  }

  /**
   * 获取行业
   * @param {*} ctx
   */
  async industrys(ctx) {
    let industrys = this.config.industrys
    let list = []
    Object.keys(industrys).forEach(key => {
      list.push({
        name: key,
        value: industrys[key]
      })
    })
    ctx.ret.data = list
  }
}

module.exports = PubController