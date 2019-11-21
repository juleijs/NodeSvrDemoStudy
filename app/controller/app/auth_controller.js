/* eslint-disable require-atomic-updates */
const CommonController = require('./../../common/common_controller')

class AuthController extends CommonController {
  constructor(ctx) {
    super()
    this.logger.info(ctx.uuid, 'AuthController Constructor')
  }

  /**
   * 手机验证码登录
   * @param {*} ctx
   */
  async sign(ctx) {
    this.logger.info(ctx.uuid, 'sign()', 'body', ctx.body, 'query', ctx.query)

    let type = ctx.body.type || 1 // 1:登录 2:注册 3:修改密码
    let accountType = ctx.body.account_type || 1 // 1:邮箱 2:手机
    let mobile = ctx.body.mobile || ''
    let email = ctx.body.email || ''
    let verifyCode = ctx.body.verify_code || ''
    let password = ctx.body.password || ''

    // 短信验证
    if ((type == 2 || type == 3) && process.env.NODE_ENV != 'dev' && accountType == 2) {
      let verifyCodeModel = new this.models.verifycode_model
      let verifyRet = await verifyCodeModel.verify(mobile, verifyCode)
      this.logger.info(ctx.uuid, 'sign()', 'verifyRet', verifyRet)
      if (verifyRet.code != 0) {
        return this._fail(verifyRet.message)
      }
    }

    // 邮箱验证
    if ((type == 2 || type == 3) && process.env.NODE_ENV != 'dev' && accountType == 1) {
      let verifyRet = await this._verifyCodeCheck(ctx, {
        type: 1,
        email,
        verify_code: verifyCode
      })
      this.logger.info(ctx.uuid, 'sign()', 'verifyRet', verifyCode)
      if (verifyRet.code != 0) {
        return this._fail(verifyRet.message)
      }
    }

    // 找用户
    let UserModel = new this.models.user_model
    let userModel = UserModel.model()

    let user = null 
    if (accountType == 1) {
      user = await userModel.findOne({
        where: {
          email
        }
      })
    } else {
      user = await userModel.findOne({
        where: {
          mobile
        }
      })
    }
    this.logger.info(ctx.uuid, 'sign()', 'user', user)

    if (type == 1) {
      // 登录
      if (!user || user.password != this.utils.crypto_utils.hmacMd5(password)) {
        ctx.ret.code = 1
        ctx.ret.message = '账号或密码错误'
        return ctx.ret
      }
    } else if (type == 2) {
      // 注册
      if (user) {
        ctx.ret.code = 1
        ctx.ret.message = '账号已注册，请返回登录'
        return ctx.ret
      }

      // 寻找父级id
      let inviteCode = ctx.body.invite_code || ''
      let  pid = 0
      if (inviteCode) {
        let pUser = await userModel.findOne({
          where: {
            uuid: inviteCode
          }
        })
        if (!pUser) {
          pid = 0
        } else {pid
          pid = pUser.id
        }
      }

      user = await userModel.create({
        mobile,
        email,
        nickname: email.split('@')[0],
        pid,
        password: this.utils.crypto_utils.hmacMd5(password),
        status: 1 // 默认审核通过
      })

    } else if (type == 3) {
      // 修改密码
      if (!user) {
        ctx.ret.code = 1
        ctx.ret.message = '账号信息错误'
        return ctx.ret
      }
      user.password = this.utils.crypto_utils.hmacMd5(password)
      let userSaveRet = await user.save()
      if (!userSaveRet) {
        ctx.code = 1
        ctx.ret.message = '密码修改错误'
        return ctx.ret
      }
    }

    if (type == 1 || type == 2) {
      // 获取token
      let authInfo = ctx.body.auth_info
      authInfo.user_id = user.id
      let userAuth = await userModel.authLogin(authInfo)
      if (!userAuth.token) {
        ctx.ret.code = 1
        ctx.ret.message = '请稍后重试'
      } else {
        ctx.ret.data = {
          token: userAuth.token
        }
      }
    }

    return ctx.ret
  }
}

module.exports = AuthController