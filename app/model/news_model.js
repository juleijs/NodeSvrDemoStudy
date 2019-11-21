const Model = require('./../../lib/model')
const {
  news,
  newsLogs
} = require('./../../config/models')

class NewsModel extends Model {
  model() {
    return this.db().define('news', news()[0], news()[1])
  }

  logsModel() {
    return this.db().define('news_logs', newsLogs()[0], newsLogs()[1])
  }

  async newsLog(userId, newsId)  {
    let data = await this.logsModel().findOne({
      where: {
        user_id: userId,
        news_id: newsId
      }
    })
    if (!data) {
      data = await this.logsModel().create({
        user_id: userId,
        news_id: newsId
      })
    }
    return data
  }
} 

module.exports = NewsModel