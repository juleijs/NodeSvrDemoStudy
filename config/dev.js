module.exports = {
  db: {
    host: '59939c0a9a983.gz.cdb.myqcloud.com',
    port: 5579,
    dbname: '2019_vds',
    username: 'vds_2019',
    password: '2019_vds',
    maxLimit: 1000,
  },

  h5Domain: 'http://h5.idmchain.io',
  imgDomain: 'http://img.idmchain.io',

  web3: {
    host: 'http://web3.cc512.com',
    port: 80,
    contract_address: '0xCA22f8D5Fa358372bc56bF4d7F7DCC07dbb163a7',
    // contract_address: '0xc031ACaac2e4B55c576F3047f160266D34243933',
    mainAccount: {
      address: '0x9ea9549f46464a67f93288d4d46994042ca791b0',
      privateKey: '0x9fcef387c7260e90e205f1ac1bba664e5fc3b83d572a54d119008ce825b5222d'
    },
    // 奖池账户
    rewardAccount: {
      address: '0xebd9915e2a2eb8071ec3baac9eba19b4fa324107',
      privateKey: '0xe9bc0a193e8deaaef91367048b725970db802d6fbeb8c4f859299593e2a5ea14'
    }
  },
  // 广告登刊
  adPublication: {
    domain: 'https://tms.modengbox.com/advertiser/modnim'
  },
  // mail: {
  //   host: 'smtp.office365.com',
  //   user: 'idmchain@outlook.com',
  //   password: 'guanggaoquan777',
  //   from: 'idmchain@outlook.com',
  //   port: 587,
  //   verifyCode: (code) => {
  //     return `【IDM】您收到验证码 ${code} ,十分钟有效!`
  //   }
  // },

}