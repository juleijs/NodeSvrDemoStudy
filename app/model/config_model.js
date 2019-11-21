const Model = require('./../../lib/model')
const {
  config,
  configExchange
} = require('./../../config/models')

class ConfigModel extends Model {
  config() {
    return this.db().defined('config', config()[0], config()[1])
  }

  exchangeModel() {
    return this.db().defined('config_exchange', configExchange()[0], configExchange()[1])
  }

  /**
   * 通过标识获取配置
   * @param {*} name
   */
  async getByName(name) {
    let ret = await this.model().findOne({
      where: {
        name,
        status: 1
      }
    })
    return ret ? (ret.content || null) : null
  }

  /**
   * 更新配置库存，获取当前价格
   * @param {*} num
   * @param {*} t
   */
  async configExchangeUse(num, t) {
    let ret = {
      code : 1,
      message: ''
    }
    let item = await this.exchangeModel().findOne({
      where: {
        status: 1
      },
      order: [
        ['create_time', 'desc'],
        ['id', 'desc']
      ]
    })
    if (!item) {
      ret.message = '未找到配置'
      return ret
    }
    if (item.stock != -1 && item.stock >= num) {
      item.stock = item.stock - num
      let opt = {}
      if (t) {
        opt.transaction = t
      }
      let saveRet = await item.save(opt)
      if (!saveRet) {
        ret.message = '更新广告券库存失败'
        return ret
      }
    } else {
      ret.message = '库存不足'
      return ret
    }
    ret.code = 0
    ret.data = {
      price: item.price
    }
    return ret
  }
}

module.exports = ConfigModel