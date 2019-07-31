const Controller = require('./../../lib/controller')
const Log = require('./../../lib/log')('Common')
const Op = require('sequelize').Op

class CommonController extends Controller {
  async _transfer(ctx, data) {
    this.logger.info(ctx.uuid, '_transfer()', 'body', ctx.body, 'query', ctx.query)

    let web3Utils = this.utils.web3_utils
    let balanceBefore = {}
    balanceBefore.from = await web3Utils.getTokenBalance(data.from)
    balanceBefore.to = await web3Utils.getTokenBalance(data.to)

    if (balanceBefore.from < data.num) {
      ctx.ret.code = 1
      ctx.ret.message = '代币余额不足'
      return ctx.ret
    }
    this.logger.info(ctx.uuid, '_transfer()', 'balanceBefore', balanceBefore)

    let ethTransRet = await this._transferEth(ctx, data)
    this.logger.info(ctx.uuid, '_transfer()', 'ethTransRet', ethTransRet)
    if(ethTransRet.code != 0) {
      return ethTransRet
    }

    let tokenTransRet = await this._transferToken(ctx, data)
    this.logger.info(ctx.uuid, '_transfer()', 'tokenTransRet', tokenTransRet)
    if (tokenTransRet.code != 0) {
      return tokenTransRet
    }

    let balanceAfter = {}
    balanceAfter.from = await web3Utils.getTokenBalance(data.from)
    balanceAfter.to = await web3Utils.getTokenBalance(data.to)

    ctx.ret.data = tokenTransRet.data
    ctx.ret.data.eth = ethTransRet.data
    ctx.ret.data.balanceBefore = balanceBefore
    ctx.ret.balanceAfter = balanceAfter
    this.logger.info(ctx.uuid, '_transfer()', 'ret', ctx.ret)
    
    return ctx.ret
  }

  /**
   * 转账eth
   * @param {*} ctx
   */
  async _transferEth(ctx, data) {
    let from = data.from
    let to = data.to
    let num = data.num
    let web3Utils = this.utils.web3_utils
    let gas = await web3Utils.tokenTransferToGas(null, from, to, num)
    let transGasWei = await web3Utils.getPriceGet(gas)
    this.logger.info(ctx.uuid, 'transGasWei ==========', transGasWei)

    //转eth
    let ethTransRet = await web3Utils.transferEth(null, from, transGasWei)
    this.logger.info(ctx.uuid, 'ethTransRet ==========', ethTransRet)
    return ethTransRet
  }

  /**
   * 转账token
   * @param {*} ctx
   */
  async _transferToken(ctx, data) {
    let from = data.from
    let to = data.to
    let num = data.num
    let account = {
      address: from,
      privateKey: data.private_key
    }
    let web3Utils = this.utils.web3_utils
    let transRet = await web3Utils.transferToken(account, to, num)
    return transRet
  }

  /**
   * 获取代币数量
   * @param {*} ctx
   * @param {*} address
   */
  async _getTokenBalance(ctx, address) {
    let web3Utils = this.utils.web3_utils
    this.logger.info(ctx.uuid, 'address ==========', address)
    let balance = await web3Utils.getTokenBalance(address)
    return balance
  }

  /**
   * 处理提币
   * @param {*} ctx
   * @param {*} data
   */
  async _applyDeal(ctx) {
    let applyId = ctx.body.id
    let userModel = new this.models.user_model
    let applyModel = userModel.applyModel()
    let admin = ctx.session.AUTH.admin || {}
    let remark = ctx.body.remark || ''
    let t = await userModel.getTrans()

    try {
      let apply = await applyModel.findByPk(applyId)
      if (!apply || apply.status != 0) {
        throw new Error('无效条目')
      }
      this.logger.info(ctx.uuid, '_applyDeal', 'apply', apply)

      let userId = apply.user_id
      let num = apply.num / this.config.wallet.decimals
      let userWallet = await userModel.getWallet(userId)
      if (!userWallet) {
        throw new Error('无用户钱包地址')
      }

      let balance = await this._getTokenBalance(ctx, userWallet.address)
      this.logger.info(ctx.uuid, '_applyDeal', 'balance', balance)
      let balanceFrozen = await userModel.getFrozenBalance(userId)
      balance = balance - balanceFrozen
      this.logger.info(ctx.uuid, '_appleDeal', 'balance', balance)
      if (balance / this.config.wallet.decimals < num) {
        throw new Error('提交数量超过限制')
      }

      apply.status = 1
      apply.confirm_time = parseInt(Date.now() / 1000)
      apply.confirm_admin_id = admin.id || 0
      apply.confirm_admin_name = admin.name || ''
      apply.confirm_remark = remark || ''
      let applyUpdateRet = await apply.save({
        transaction: t
      })
      if (!applyUpdateRet) {
        throw new Error('申请记录失败')
      }

      // 转给交易所
      let numReal = parseFloat((apply.num = apply.fee) / this.config.wallet.decimals).toFixed(8) * 1
      this.logger.info(ctx.uuid, '_applyDeal', 'numReal', numReal)
      let transferData = {
        from: userWallet.address,
        to: apply.address,
        private_key: userWallet.private_key,
        num: numReal
      }
      this.logger.info(ctx.uuid, '_applyDeal', 'transferData', transferData)
      let transferRet = await this._transfer(ctx, transferData)
      if (transferRet.code != 0) {
        throw new Error(transferRet.message)
      }

      // 记录交易
      let logUserData = transferRet.data
      logUserData.balance = {
        before: transferData.balanceBefore.from,
        after: transferData.balanceAfter.from
      }
      this.logger.info(ctx.uuid, '_applyDeal', 'logUserData', logUserData)
      let logUserRet = await userModel.transactionLog(userId, 2, logUserData, t)
      this.logger.info(ctx.uuid, '_applyDeal', 'logUserRet', logUserRet)
      if (!logUserRet) {
        throw new Error('记录转出账户失败')
      }

      // 转手续费，转给主账户
      let toFeeAccount = this.config.web3.mainAccont
      let fee = parseFloat(apply.fee / this.config.wallet.decimals).toFixed(8) * 1
      this.logger.info(ctx.uuid, '_applyDeal', 'fee', fee)
      let transferDataFee = {
        from: userWallet.address,
        to: toFeeAccount.address,
        private_key: userWallet.private_key,
        num: fee
      }
      this.logger.info(ctx.uuid, '_applyDeal', 'transferDataFee', transferDataFee)
      let transferFeeRet = await this._transfer(ctx, transferDataFee)
      if (transferFeeRet.code != 0) {
        throw new Error(transferFeeRet.message)
      } 

      let logUserDataFee = transferFeeRet.data
      logUserDataFee.balance = {
        before: transferFeeRet.data.balanceBefore.from,
        after: transferFeeRet.data.balanceAfter.from
      }
      this.logger.info(ctx.uuid, '_applyDeal', 'logUserDataFee', logUserDataFee)
      let logUserFeeRet = await userModel.transactionLog(userId, 22, logUserDataFee, t)
      this.logger.info(ctx.uuid, '_applyDeal', 'logUserFeeRet', logUserFeeRet)
      if (!logUserFeeRet) {
        throw new Error('记录转出手续费失败')
      }

      await t.commit()

    } catch(err) {
      this.logger.error(ctx.uuid, '_applyDeal', 'error', err.message)
      ctx.ret.code = 1
      ctx.ret.message = err.message

      await t.rollback()
    }
    return ctx.ret
  }

  /**
   * 用户邀请奖励
   * @param {*} ctx
   */
  async _scheduleInviteReward(ctx) {
    let userModel = new this.models.user_model
    let list = await userModel.rewardModel().findAll({
      where: {
        active_status: 0
      }
    })
    this.logger.info(ctx.uuid, '_scheduleInviteReward', '当前结算条数', list.length)

    let errList = []
    for(let i = 0; i < list.length; i ++) {
      ctx.ret.code = 0
      ctx.ret.message = ''
      let t = await userModel.getTrans()
      let item = list[i]

      try {
        item.active_status = 1
        let rewardUpdateRet = await item.save({
          transaction: t
        })
        if (!rewardUpdateRet) {
          throw new Error('记录邀请奖励错误')
        }

        let total = item.num / this.config.wallet.decimals
        let userId = item.user_id
        let pid = item.pid
        let ppid = item.ppid

        if (pid) {
          let pUserWallet = await userModel.walletModel().findOne({
            where: {
              user_id: pid
            }
          })
          if (pUserWallet) {
            // 转给上级30%
            let num = total * 30 / 100
            this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${pid}结算${num}`)
            let inviteRewardRet = await this._rewardTransfer(ctx, {
              user_id: pid,
              num,
              userModel,
              remark: {
                child_user_id: userId,
                level: 1
              },
              transferType: 15
            }, t)
            if (inviteRewardRet.code != 0) {
              throw new Error(inviteRewardRet.message + 'userid:' + pid)
            }
            this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${pid}结算成功`)
          } else {
            this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${pid}未开通钱包`)
          }
        } else {
          this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${userId}无父ID`)
        }

        if (ppid) {
          let pUserWallet = await userModel.walletModel().findOne({
            where: {
              user_id: ppid
            }
          })
          if (pUserWallet) {
            let num = total * 15 / 100
            this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${ppid}结算${num}`)
            let inviteRewardRet = await this._rewardTransfer(ctx, {
              user_id: ppid,
              num,
              userModel,
              remark: {
                child_user_id: userId,
                level: 2
              },
              transferType: 15
            }, t)
            if (inviteRewardRet.code != 0) {
              throw new Error(inviteRewardRet.message + 'userid:' + ppid)
            }
            this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${pid}结算成功`)
          } else {
            this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${ppid}未开通钱包`)
          }
        } else {
          this.logger.info(ctx.uuid, '_scheduleInviteReward', `给用户ID: ${userId}无父ID`)
        }
        await t.commit()
      } catch(err) {
        this.logger.error(ctx.uuid, '_scheduleInviteReward', err.message)
        ctx.ret.code = 1
        ctx.ret.message = err.message
        errList.push(item.id)

        await t.rollback()
      }
    }
    this.logger.info(ctx.uuid, '_scheduleInviteReward', 'errList', errList)
    return ctx.ret
  }

  async _rewardTransfer(ctx, data, t) {
    let userModel = data.userModel || new this.models.user_model
    let web3Config = this.config.web3
    let fromAccount = web3Config.rewardAccount
    let userId = data.user_id
    let transferType = data.transferType || 15

    try {
      let pUserWallet = await userModel.walletModel().findOne({
        where: {
          user_id: userId
        }
      })
      if (!pUserWallet) {
        throw new Error('邀请人钱包未创建')
      }
      let transferData = {
        from: fromAccount.address,
        to: pUserWallet.address,
        private_key: fromAccount.privateKey,
        num: data.num
      }
      this.logger.info(ctx.uuid, '_rewardTransfer', 'transferData', transferData)
      let transferRet = await this._transfer(ctx, transferData)
      if (transferRet.code != 0) {
        throw new Error(transferRet.message)
      }

      // 记录交易
      let logUserData = transferRet.data
      logUserData.balance = {
        before: transferRet.data.balanceBefore.from,
        after: transferRet.data.balanceAfter.from
      }
      this.logger.info(ctx.uuid, '_rewardTransfer', 'logUserData', logUserData)
      let logUserRet = await userModel.transactionLog(0, transferType, logUserData, t)
      this.logger.info(ctx.uuid, '_rewardTransfer', 'logUserRet', logUserRet)
      logUserData.balance = {
        before: transferRet.data.balanceBefore.to,
        after: transferRet.data.balanceAfter.to
      }
      logUserData.remark = JSON.stringify(data.remark || {})
      this.logger.info(ctx.uuid, '_rewardTransfer', 'logUserData', logUserData)
      let logUserRet1 = await userModel.transactionLog(userId, transferType + 1, logUserData, t)
      this.logger.info(ctx.uuid, '_rewardTransfer', 'logUserRet1', logUserRet1)
      if (!logUserRet1) {
        throw new Error('记录转出账户失败')
      }

      ctx.ret.code = 0
      ctx.ret.message = 'success'
    } catch (err) {
      ctx.ret.code = 1
      ctx.ret.message = err.message
    }

    return ctx.ret
  }

  /**
   * 分期奖励
   * @param {*} ctx
   */
  async _scheduleRewardStage(ctx) {

    // 先找到邀请人不同人数的
    let userModel = new this.models.user_model
    let rewardModel = new this.models.reward_model
    let now = parseInt(Date.now() / 1000)
    let lastReward = await rewardModel.model().findOne({
      order: [
        ['date_end', 'desc']
      ]
    })
    let lastRewardEndDate = lastReward ? lastReward.date_end : null
    let startDate = this.config.wallet.rewardStartDate
    let startTime = this.utils.date_utils.getTimeStamp(startDate)
    let endTime = startTime + 5 * 24 * 3600 - 1
    let endDate = this.utils.date_utils.dateFormat(endTime, 'YYYY-MM-DD')
    if (lastRewardEndDate) {
      let lastEndTime = this.utils.date_utils.getTimeStamp(lastRewardEndDate)
      startTime = lastEndTime + 24 * 3600
      endTime = startTime + 5 * 24 * 3600 - 1
      startDate = this.utils.date_utils.dateFormat(startTime, 'YYYY-MM-DD')
      endDate = this.utils.date_utils.dateFormat(endTime, 'YYYY-MM-DD')
    }

    this.logger.info(ctx.uuid, '_scheduleRewardStage', 'startDate', startDate)
    this.logger.info(ctx.uuid, '_scheduleRewardStage', 'endDate', endDate)
    this.logger.info(ctx.uuid, '_scheduleRewardStage', 'startTime', startTime)
    this.logger.info(ctx.uuid, '_scheduleRewardStage', 'endTime', endTime)

    if (now < endTime) {
      this.logger.info(ctx.uuid, '_scheduleRewardStage', '还未到时间不结算')
      return 
    }

    let params = {}
    params.start_time = startTime
    params.end_time = endTime
    let sql = 'select pid, count(*) count from t_user_reward where create_time > :start_time and create_time < :end_time and pid > 0 group by pid'
    let list = await userModel.query(sql, params)
    this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate} - ${endDate}人数数量${list.length}`)

    let sum = await userModel.rewardModel().sum('num', {
      where: {
        create_time: {
          [Op.and]: {
            [Op.gte]: startTime,
            [Op.lt]: endTime
          }
        }
      }
    })
    this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate} - ${endDate}结算数量${sum}`)
    let rewardLevelRate = this.config.wallet.rewardLeveRate
    let rewardAmount = [
      sum * rewardLevelRate[0] / 100,
      sum * rewardLevelRate[1] / 100,
      sum * rewardLevelRate[2] / 100
    ]

    let rewardLevelNum = this.config.wallet.rewardLevelNum
    let num1 = 0
    let num2 = 0
    let num3 = 0
    let users = [
      [], 
      [],
      []
    ]
    for (let i = 0; i < list.length; i++) {
      let item = list[i]
      if (item.count >= rewardLevelNum[2]) {
        num3++
        let userId = item.pid
        users[2].push(userId)
      } else if (item.count >= rewardLevelNum[1] && item.count < rewardLevelNum[2]) {
        num2++
        let userId = item.pid
        users[1].push(userId)
      } else if (item.count >= rewardLevelNum[0] && item.count < rewardLevelNum[1]) {
        num1++
        let userId = item.pid
        users[0].push(userId)
      }
    }

    let rewardLevelUserCount = [users[0].length, users[1].length, users[2].length]
    this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}奖励层级数量`, rewardLevelNum)
    this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}用户层级数量`, rewardLevelUserCount)

    for(let i = 0; i < users.length; i++) {
      let items = users[i]
      if (rewardLevelUserCount[i]) {
        // 人数 > 0
        let num = rewardAmount[i] / rewardLevelUserCount[i]
        num = parseFloat(num / this.config.wallet.decimals).toFixed(8) * 1
        this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}结算,数量${num}`)

        for(let j = 0; j < items.length; j++) {
          let userId = items[j]
          this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}结算用户ID:${userId},数量:${num}`)

          // 判断钱包
          let userWallet = await userModel.walletModel().findOne({
            where: {
              user_id: userId
            }
          })

          if (userWallet) {
            // 判断是否结算
            let isDone = await userModel.transactionModel().findOne({
              where: {
                user_id: userId,
                type: 18,
                remark: JSON.stringify({
                  date: startDate,
                  index: i
                })
              }
            })
            this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}结算用户ID:${userId},是否结算:`, isDone?'是':'否')

            // 结算
            if (!isDone) {
              let t = await userModel.getTrans()
              try {
                let rewardRet = await this._rewardTransfer(ctx, {
                  user_id: userId,
                  num,
                  userModel,
                  remark: {
                    date: startDate,
                    index: i
                  },
                  transferType: 17
                }, t)
                if (rewardRet.code != 0) {
                  throw new Error(rewardRet.message + ':userId:' +userId)
                }
                await t.commit()
              } catch(err) {
                this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}结算用户ID:${userId},err:`, err.message)
                await t.rollback()
              }
            }
          } else {
            this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}结算用户ID:${userId}无钱包地址`)
          }
        }
      } else {
        this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}结算${i}级无用户`)
      }
    }

    let saveRet = await rewardModel.model().create({
      num: sum,
      num_1: num1,
      num_2: num2,
      num_3: num3,
      date_start: startDate,
      date_end: endDate
    })
    this.logger.info(ctx.uuid, '_scheduleRewardStage', `${startDate}-${endDate}`, 'end,saveRet', saveRet)
    return
  }

  async _chargeJobs(ctx) {
    let web3Utils = this.utils.web3_utils
    let userModel = new this.models.user_model
    let lastTrans = await userModel.transactionModel().findOne({
      where: {
        type: 1
      },
      order: [
        ['create_time', 'desc']
      ]
    })
    let blockStart = 0
    if (lastTrans) {
      blockStart = lastTrans.block_num + 1
    }
    this.logger.info(ctx.uuid, '_chargeJobs', 'blockStart', blockStart)

    let currentBlock = await web3Utils.getBlockNumber()
    this.logger.info(ctx.uuid, '_chargeJobs', 'currentBlock', currentBlock)
    if (currentBlock > blockStart) {
      for(let i = blockStart; i < currentBlock; i++) {
        await this._chargeJobOneBlock(ctx, i)
      }
    }
    return
  }

  /**
   * 提现任务
   * @param {*} ctx
   */
  async _chargeJobOneBlock(ctx, blockStart) {
    let web3Utils = this.utils.web3_utils
    let userModel = new this.models.user_model
    let block = {
      start: blockStart,
      end: blockStart + 1
    }
    let trans = await web3Utils.getContractTransaction(block)
    this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:交易数量${trans.length}`)
    for (let i = 0; i < trans.length; i++) {
      let item = trans[i]
      let hash = item.transactionHash
      let transIndex = item.transactionIndex
      this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:hash:${hash}`)
      let num = parseFloat(parseInt(item.returnValues.value.toString()) / this.config.wallet.decimals).toFixed(8) * 1
      this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:num:${num}`)

      let isDone = await userModel.transactionModel().findOne({
        where: {
          hash: hash
        }
      })

      if (isDone) {
        this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:hash:${hash}已结算过`)
      } else {
        let addressTo = item.returnValues.to
        let addressFrom = item.returnValues.from
        this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:addressTo:${addressTo}`)
        this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:addressFrom:${addressFrom}`)

        let userWalletTo = await userModel.walletModel().findOne({
          where: {
            address: addressTo
          }
        })
        let userWalletFrom = await userModel.walletModel().findOne({
          where: {
            address: addressFrom
          }
        })

        this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:userWalletTo`, userWalletTo ? userWalletTo.user_id : 0)
        this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:userWalletFrom`, userWalletFrom ? userWalletFrom.user_id : 0)

        let toUserId = 0
        if (userWalletTo && !userWalletFrom) {
          toUserId = userWalletTo.user_id
        }
        this.logger.info(ctx.uuid, '_chargeJobOneBlock',`${block.start}-${block.end}:${transIndex}:toUserId:${toUserId}`)

        if (toUserId) {
          let ret = await userModel.transactionLog(toUserId, 1, {
            from: item.returnValues.from,
            to: item.returnValues.to,
            num,
            block: item.blockNumber,
            index: item.transactionIndex,
            gas: 0,
            gasPrice: 0,
            hash: item.blockHash,
            balance: {
              before: 0,
              to: 0
            }
          })

          if (ret) {
            this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:toUserId${toUserId}记录交易成功`)
          } else {
            this.logger.info(ctx.uuid, '_chargeJobOneBlock', `${block.start}-${block.end}:${transIndex}:toUserId${toUserId}记录交易失败`)
          }
        }
      }
    }
  }

  /**
   * 验证码验证
   * @param {} ctx
   * @param {*} data
   */
  async _verifyCodeCheck(ctx, data) {
    let accountType = data.type || 1
    let mobile = data.mobile || ''
    let email = data.email || ''
    let verifyCode = data.verifyCode
    let verifyCodeModel = new this.models.verifycode_model
    
    if (accountType == 1) {
      let verifyRet = await verifyCodeModel.verifyEmailCode(email,verifyCode)
      ctx.ret.code = verifyRet.code
      ctx.ret.message = verifyRet.message
    } else if (accountType == 2) {
      let verifyRet = await verifyCodeModel.verify(mobile, verifyCode)
      ctx.ret.code = verifyRet.code
      ctx.ret.message = verifyRet.message
    }
    
    return ctx.ret
  }
}


module.exports = CommonController