const moment = require('moment')

class DateUtils {
  getTimestamp(timeStr) {
    let date = new Date(timeStr)
    return parseInt(date.getTime() / 1000)
  }

  dateFormat(timestamp, format) {
    format = format || 'YYYY-MM-DD HH:mm'
    let date = null
    if (!timestamp) {
      date = new Date()
    } else {
      date = new Date(timestamp * 1000)
    }
    return moment(date).format(format)
  }

  dateDisplay(timestamp) {
    let now = parseInt(new Date() / 1000)
    let long = now - timestamp
    if (long < 60) {
      return long + '秒前'
    } else if (long >= 60 && long < 3600) {
      return parseInt(long / 60).toString() + '分钟前'
    } else if (long >= 3600 && long < 3600 * 24) {
      return parseInt(long / 3600).toString() + '小时前'
    } else if (long >= 3600 * 24 && long < 3600 * 24 * 30) {
      return parseInt(long / 3600 / 24).toString() + '天前' 
    } else {
      let format = 'YYYY-MM-DD HH:mm'
      let date = new Date(timestamp * 1000)
      return moment(date).format(format)
    }
  }
}

module.exports = new DateUtils()