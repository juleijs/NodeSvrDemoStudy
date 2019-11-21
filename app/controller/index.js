const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const cryptoUtils = require('../utils/crypto_utils')
const { signKey } = require('../../config/index')

let groups = ['admin', 'app']
let getGroupControllers = group => {
  let controllerPath = path.join(__dirname + './' + group)
  let files = fs.readdirSync(controllerPath)
  let controllers = {}
  files.forEach(file => {
    if (file.indexOf('_controller.js') > 0) {
      controllers[file.replace('_controller.js', '')] = require(path.join(controllerPath, file))
    }
  })
  return controllers
}

let groupControllers = {}
groups.forEach(group => {
  groupControllers[group] = getGroupControllers(group)
})

let reqNotFound = (res, message = '404 not found', code = -1, status = 404) => {
  return res.status(status).json({
    code,
    message
  })
}

router.post('/:group/:module/:action', async (req, res) => {
  let {
    uuid, 
    content,
    sign
  } = req.body

  // 验证签名
  let signContent = cryptoUtils.hmacMd5Obj(content, signKey)
  if (sign != signContent) return reqNotFound(res, 'unsign err')

  // 主装上下文
  let ctx = {
    uuid: uuid || req.uuid || 'uuid',
    ip: req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace('/::ffff:', ''),
    query: content.query || {},
    body: content.body || {},
    session: content.session || {},
    token: content.query.token || content.body.token || '',
    ret: {
      code: 0,
      message: ''
    }
  }

  let groupName = req.params.group   // 组别
  let moduleName = req.params.module // 模块
  let actionName = req.params.action // 方法

  ctx.route = {
    group: groupName,
    module: moduleName,
    action: actionName
  }

  // groupName Not Found
  if (!~groups.indexOf(groupName)) return reqNotFound(res, `404 not found (group: ${groupName})`)
  let controllers = groupControllers[groupName]

  // moduleName Not Found
  // eslint-disable-next-line no-prototype-builtins
  if (!controllers.hasOwnProperty(moduleName)) return reqNotFound(res, `404 not found (module: ${moduleName})`)
  let controller = controllers[moduleName]
  let moduleController = new controller(ctx)

  // actionName Not Found
  if (typeof moduleController[actionName] != 'function') return reqNotFound(res, `404 not found (action: ${actionName})`)

  // controller init
  if (moduleController._init_) await moduleController._init_(ctx)
  if (actionName[0] == '_') return reqNotFound(res, `404 not found (action: ${actionName})`)
  if (ctx.ret.code == 0) await moduleController[actionName](ctx)
  return res.json(ctx.ret)
})

module.exports = router