/* eslint-disable require-atomic-updates */
const Controller = require('./../../../lib/controller')
// const Op = require('sequelize').Op

class NewsController extends Controller {
  async list(ctx) {
    this.logger.info(ctx.uuid, 'list()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let page = ctx.body.page || 1
    let limit = ctx.body.limit || 10
    let category = ctx.body.category || 'notice'
    let where = {}
    where.category = category
    where.status = 1
    this.logger.info(ctx.uuid, 'list()', 'where', where)

    let newsModel = new this.models.news_model
    let queryRet = await newsModel.model().findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit,
      order: [
        ['sort', 'asc'],
        ['create_time', 'desc']
      ],
      attributes: {
        exclude: ['update_time', 'content']
      }
    })

    if (ctx.query.token) {
      let userModel = new this.models.user_model
      await userModel.checkAuth(ctx)
    }

    let list = []
    for (let i = 0; i < queryRet.rows.length; i++) {
      let item = queryRet.rows[i]
      if (category == 'notice') {
        if (ctx.body.user_id) {
          let count = await newsModel.logsModel().count({
            where: {
              user_id: ctx.body.user_id,
              news_id: item.id
            }
          })
          item.dataValues.active = count ? 0 : 1
        } else {
          item.dataValues.active = 0
        }
      } else {
        item.dataValues.active = 0
      }
      list.push(item)
    }

    ctx.ret.data = {
      rows: list,
      count: queryRet.count,
      page,
      limit
    }

    return ctx.ret
  }

  async info(ctx) {
    this.logger.info(ctx.uuid, 'info()', 'body', ctx.body, 'query', ctx.query, 'session', ctx.session)
    let newsModel = new this.models.news_model
    let id = ctx.body.id
    let info = await newsModel.model().findByPk(id)
    info.content = info.content.replace(/&amp;/g, '&')
    const regex = new RegExp('<img', 'gi')
    info.content = info.content.replace(regex, `<img style="max-width:100%;"`)

    if (ctx.query.token) {
      let userModel = new this.models.user_model
      let checkRet = await userModel.checkAuth(ctx)
      if (checkRet.code == 0) {
        if (ctx.body.user_id && info.category == 'notice') {
          newsModel.newsLog(ctx.body.user_id, id)
        }
      }
    }

    ctx.ret.data = {
      info
    }
    this.logger.info(ctx.uuid, 'info()', 'ret', ctx.ret)
    return ctx.ret
  }
}

module.exports = NewsController