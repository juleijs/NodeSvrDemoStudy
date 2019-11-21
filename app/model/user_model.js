/* eslint-disable require-atomic-updates */
const Model = require('./../../lib/model')
const {
  user,
  userAuth,
  userTrade,
  userApply,
  userWallet,
  userTransaction,
  userReward
} = require('./../../config/models')
const uuid = require('uuid')
const Op = require('sequelize').Op

class UserModel extends Model {
  model() {
    return this.db().define('user', user()[0], user()[1])
  }

  authModel() {
    return this.db().define('user_auth', userAuth()[0], userAuth()[1])
  }

  applyModel() {
    return this.db().define('user_apply', userApply()[0], userApply()[1])
  }

  tradeModel() {
    return this.db().define('user_trade', userTrade()[0], userTrade()[1])
  }

  walletModel() {
    return this.db().define('user_wallet', userWallet()[0], userWallet()[1])
  }

  transactionModel() {
    return this.db().define('user_transaction', userTransaction()[0], userTransaction()[1])
  }

  rewardModel() {
    return this.db().define('user_reward', userReward()[0], userReward()[1])
  }

  async checkAuth(ctx) {
    let token = ctx.query.token || ctx.body.token || ''
    console.log(ctx.uuid, 'UserController._init_token', token)
    if (!token) {
      ctx.ret.code = -101
      ctx.ret.message = 'token err'
      return ctx.ret
    }
    let userAuth = await this.authModel().findOne({
      where: {
        token
      }
    })
    if (!userAuth) {
      ctx.ret.code = -100
      ctx.ret.message = 'token check fail'
      return ctx.ret
    } else {
      console.log(ctx.uuid, 'UserController._init_user', userAuth.token || null)
    }
    ctx.body.user_id = userAuth.user_id
    this.model().findByPk(userAuth.user_id).then(user => {
      user.last_signin_time = parseInt(Date.now() / 1000)
      user.last_signin_ip = ctx.ip
      user.save()
    }).catch(err => {
      console.log(ctx.uuid, err.message || 'log sign err')
    })
    return ctx.ret
  }

  /**
   * 授权登录
   * @param {*} auth
   */
  async authLogin(auth) {
    auth.token = uuid.v4()
    let userAuth = await this.authModel().findOne({
      where: {
        user_id: auth.user_id,
        platform: auth.platform,
        type: auth.type
      }
    })
    if (userAuth) {
      let saveRet = await userAuth.update(auth)
      console.log(JSON.stringify(saveRet))
      return saveRet
    } else {
      userAuth = await this.authModel().create(auth)
      console.log(JSON.stringify(userAuth))
      return userAuth
    }
  }

  /**
   * 获取邀请人
   * @param {*} userId
   */
  async getInviteUser(userId) {
    let user = await this.model().findOne({
      where: {
        id: userId
      }
    })
    return user || null
  }

  async getChilds(userId) {
    let users = await this.model().findAll({
      where: {
        pid: userId
      }
    })
    return users || []
  }

  async getWallet(userId) {
    let data = await this.walletModel().findOne({
      where: {
        user_id: userId
      }
    })
    return data
  }

  async getWalletByAddress(address) {
    let data = await this.walletModel().findOne({
      where: {
        address
      }
    })
    return data
  }

  async transactionLog(userId, type = 1, data, t = null) {
    const tokenDecimal = 100000000
    let logData = {
      user_id: userId,
      type: type,
      address_from: data.from,
      address_to: data.to,
      num: data.num * tokenDecimal,
      block_num: data.block,
      index_num: data.index,
      gas_used: data.gas,
      gas_price: data.gasPrice,
      hash: data.hash,
      eth_data: data.eth || {},
      balance_before: data.balance.before,
      balance_after: data.balance.after,
      remark: data.remark || ''
    }
    let ops = {}
    if (t) {
      ops.transaction = t
    }
    let transRet = await this.transactionModel().create(logData, ops)
    return transRet
  }

  /**
   * 获取冻结的数量
   * @param {*} userId
   */
  async getFrozenBalance(userId) {
    let sum = await this.applyModel().sum('num', {
      where: {
        user_id: userId,
        status: 0
      }
    })
    return sum || 0
  }

  /**
   * 获取当前奖池累计数量
   * @param {*} startTime
   */
  async getRewardStageSum(startTime) {
    let endTime = startTime + 5 * 24 * 3600 -1
    let sum = await this.rewardModel().sum('num', {
      where: {
        crete_time: {
          [Op.and]: {
            [Op.gte]: startTime,
            [Op.lt]: endTime
          }
        }
      }
    })
    return sum || 0
  }

  async getRewardUserCount(startTime) {
    let endTime = startTime + 5 * 24 * 3600 - 1
    let params = {}
    params.start_time = startTime
    params.end_time = endTime
    let sql = 'select pid, count(*) count from t_user_reward where create_time > :start_time and create_time < :end_time and pid > 0 group by pid'
    let list = await this.query(sql, params)
    let count = 0
    list.forEach(item => {
      if (item.count >= 5) {
        count++
      }
    })
    return count
  }
}

module.exports = UserModel