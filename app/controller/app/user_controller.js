/* eslint-disable require-atomic-updates */
const CommonController = require('./../../common/common_controller')
const Op = require('sequelize').Op
const NODE_ENV = process.env.NODE_ENV

class UserController extends CommonController {
  constructor(ctx) {
    super()
    this.logger.info(ctx.uuid, 'UserController Constructor')
  }

  async _init_(ctx) {
    this.logger.info(ctx.uuid, 'UserController._init_async')
    let userModel = new this.models.user_model
    let checkRet = await userModel.checkAuth(ctx)
    if (checkRet.code !== 0) {
      return this._fail(ctx, checkRet.message)
    }
  }

  async check(ctx) {
    this.logger.info(ctx.uuid, 'check()', 'body', ctx.body, 'query', ctx.query)
    return ctx.ret
  }

  /**
   * 退出登录
   * @parma {*} ctx
   */
  async logout(ctx) {
    this.logger.info(ctx.uuid, 'logout()', 'body', ctx.body, 'query', ctx.query)

    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let userAuth = await userModel.authModel().findOne({
      where: {
        user_id: userId
      }
    })
    userAuth.token = ''
    await userAuth.save()
    return ctx.ret
  }

  async notice(ctx) {
    this.logger.info(ctx.uuid, 'notice()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let newsModel = this.models.news_model
    let newsCount = await newsModel.model().count({
      where: {
        status: 1,
        category: 'notice'
      }
    })
    let userCount = await newsModel.logsModel().count({
      where: {
        user_id: userId
      }
    })
    let count = newsCount - userCount
    let item = await newsModel.model().findOne({
      where: {
        status: 1,
        category: 'notice',
      },
      order: [
        ['create_time', 'desc']
      ]
    })
    ctx.ret.data = {
      count,
      item
    }
    return ctx.ret
  }

  /**
   * 用户信息
   */
  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)
    ctx.ret.data = {
      info: user
    }
    return ctx.ret
  }

  async infoUpdate(ctx) {
    this.logger.info(ctx.uuid, 'infoUpdate()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let body = ctx.body
    let updateKeys = ['nickname', 'idcard_no', 'idcard_img_1', 'idcard_img_2']
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)
    Object.keys(body).forEach(key => {
      if (updateKeys.indexOf(key) > -1) {
        user[key] = body[key]
      }
    })
    let updateRet = await user.save()
    this.logger.info(ctx.uuid, 'infoUpdate()', 'updateRet', updateRet)
    if (!updateRet) {
      return this._fail(ctx, '跟新用户信息失败')
    }
    return ctx.ret
  }

  async passwordSet(ctx) {
    this.logger.info(ctx.uuid, 'passwordSet()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let password = ctx.body.password
    let passwordOld = ctx.body.password_old
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)
    if (user.password != this.utils.crypto_utils.hmacMd5(passwordOld)) {
      return this._fail(ctx, '旧密码错误')
    }
    password = this.utils.crypto_utils.hmacMd5(password)
    user.password = password
    let updateRet = await user.save()
    if (!updateRet) {
      return this._fail(ctx, '')
    }
    return ctx.ret
  }

  /**
   * 修改交易密码
   * @param {*} ctx
   */
  async passwordTradeSet(ctx) {
    this.logger.info(ctx.uuid, 'passwordTradeSet()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let password = ctx.body.password
    let verifyCode = ctx.body.verify_code
    let userModel = new this.models.user_model
    let user = await userModel.model().findByPk(userId)

    // 短信验证
    if (NODE_ENV != 'dev') {
      let verifyRet = await this._verifyCodeCheck(ctx, {
        type: 1,
        email: user.email,
        verify_code: verifyCode
      })
      this.logger.info(ctx.uuid, 'passwordTradeSet()', 'verifyRet', verifyRet)
      if (verifyRet.code != 0) {
        return this._fail(ctx, '短信验证失败，' + verifyRet.message)
      }
      password = this.utils.crypto_utils.hmacMd5(password)
      user.password_trade = password
      let updateRet = user.save()
      if (!updateRet) {
        return this._fail(ctx, '')
      }
      return ctx.ret
    }
  }

  async inviteInfo(ctx) {
    this.logger.info(ctx.uuid, 'inviteInfo()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let url = this.config.h5Domain
    let userModel = new this.models.news_model
    let user = await userModel.model().findByPk(userId)
    url += '/pages/auth/auth?type=2&inviteCode' + user.uuid
    ctx.ret.data = {
      user: {
        nickname: user.nickname,
        uuid: user.uuid
      },
      url: url
    }

    return ctx.ret

  }

  /**
   * 获取用户邀请
   * @param {ctx}
   */
  async inviteList(ctx) {
    this.logger.info(ctx.uuid, 'inviteList()', 'body', ctx.body, 'query', ctx.query)
    let userId = ctx.body.user_id
    let userModel = new this.model.user_model
    let childs = await userModel.model().findAll({
      where: {
        pid: userId
      }
    })
    let list = []
    let childIds = []
    childs.forEach(item => {
      let data = item.dataValues
      list.push(data)
      childIds.push(data.id)
    })
    ctx.ret.data = {
      list: list
    }
    return ctx.ret
  }
}

module.exports = UserController