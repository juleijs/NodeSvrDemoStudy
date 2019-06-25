const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser') // 处理请求中body内容
const methodOverride = require('method-override')
const config = require('./config')

// parser requrest bodies (req.body)
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(bodyParser.raw({
  type: 'application/xml'
}))
app.use(bodyParser.text({
  type: 'text/xml'
}))

// allow overriding methods in query (?_method=put)
app.use(methodOverride('_method'))

// 处理请求
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origion', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Cache-Control,XMLHttpRequest')
  res.header('Access-Control-Allow-Credentials', true)
  next()
})

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/update', require('./update'))
app.use('/upload'), require('./lib/upload')