const Model = require('./../../lib/model')
const {
  exchange,
  exchangeAdplan,
  exchangeLogs
} = require('./../../config/models')

class ExchangeModel extends Model {
  model() {
    return this.db().define('exchange', exchange()[0], exchange()[1])
  }

  logsModel() {
    return this.db().define('exchange_logs', exchangeLogs()[0], exchangeLogs()[1])
  }

  adplanModel() {
    return this.db().define('exchange_adplan', exchangeAdplan()[0], exchangeAdplan()[1])
  }
}

module.exports = ExchangeModel