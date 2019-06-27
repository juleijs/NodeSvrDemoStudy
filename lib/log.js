const log4js = require('log4js')

class Logger {
  constructor(filename = '', category = 'default') {
    this.filename = filename
    this.category = category
  }

  _init() {
    let logFileName = this.filename || this.constructor.name.replace('Logger', '')
    if (!logFileName) logFileName = 'default'

    log4js.configure({
      appenders: {
        dateFile: {
          type: 'dateFile',
          filename: 'logs/',
          pattern: 'yyyy-MM/dd/' + logFileName + '.log',
          maxLogSize: 10 * 1024 * 1024, // 10Mb
          numBackups: 5,
          compress: false,
          encoding: 'utf-8',
          alwaysIncludePattern: true
        },
        out: {
          type: 'stdout'
        }
      },
      categories: {
        default: {
          appenders: ['dateFile', 'out'],
          level: 'trace'
        }
      }
    })

    this.logger = log4js.getLogger(this.category)
  }

  _log(level = 'info', ...args) {
    this._init()
    let infos = []
    for(let key in args) {
      if (args.hasOwnProperty(key)) {
        if (typeof args[key] == 'object') {
          infos.push(JSON.stringify(args[key]))
        } else if (typeof args[key] == 'undefined') {
          infos.push('undefined')
        } else if (typeof args[key] == 'function') {
          infos.push('function')
        } else {
          infos.push(args[key])
        }
      }
      let logStr = infos.join('|')
      this.logger[level](logStr)
    }
  }

  info(...args) {
    this._log('info', ...args)
  }

  trace(...args) {
    this._log('trace', ...args)
  }

  warn(...args) {
    this._log('warn', ...args)
  }

  error(...args) {
    this._log('error', ...args)
  }

  debug(...args) {
    this._log('debug', ...args)
  }

  fatal(...args) {
    this._log('fatal', ...args)
  }
}

module.exports = prx => {
  return new Logger(prx)
}