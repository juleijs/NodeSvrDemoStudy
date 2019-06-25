const updateData = {
  ios: {
    version: '1.0.0',
    notes: [],
    url: ''
  },
  android: {
    version: '1.0.0',
    notes: [],
    url: 'https://www.pgyer.com/Apoq'
  }
}

module.exports = (req, res) => {
  let ret = {
    status: 0
  }
  let query = req.query
  let version = query.version || ''
  let platform = query.platform || ''
  let data = updateData[platform]
  console.log('version ====================', data.version)
  if (data && version && version != data.version) {
    ret.status = 1
    ret.note = data.notes[0]
    ret.url = data.url
  }
  console.log('update ====================', ret)
  return res.json(ret)
}