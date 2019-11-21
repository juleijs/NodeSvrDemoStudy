const Sequelize = require('sequelize')

const commonFieldGet = () => {
  return {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    create_time: {
      type: Sequelize.BIGINT(11),
      defaultValue: parseInt(Date.now() / 1000)
    },
    update_time: {
      type: Sequelize.BIGINT(11),
      defaultValue: parseInt(Date.now() / 1000)
    }
  }
}

let getStatusFields = (val = 0) => {
  return {
    type: Sequelize.INTEGER(2),
    defaultValue: val
  }
}

const FIELDS = {
  bigInt: () => {
    return {
      type: Sequelize.BIGINT,
      defaultValue: 0
    }
  },
  tinyInt: () => {
    return {
      type: Sequelize.TINYINT(2),
      defaultValue: 0
    }
  },
  defaultInt: () => {
    return {
      type: Sequelize.BIGINT(11),
      defaultValue: 0
    }
  },
  stringLen: len => {
    return {
      type: Sequelize.STRING(len),
      defaultValue: ''
    }
  },
  text: () => {
    return {
      type: Sequelize.TEXT,
      defaultValue: ''
    }
  },
  uuid: () => {
    return {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    }
  },
  money: filed => {
    return {
      type: Sequelize.BIGINT,
      defaultValue: 0,
      get() {
        const val = this.getDataValue(filed) / 100
        return val
      },
      set(val) {
        this.setDataValue(filed, val * 100)
      }
    }
  },
  jsonObj: filed => {
    return {
      type: Sequelize.TEXT,
      defaultValue: '',
      get() {
        const val = this.getDataValue(filed)
        return val ? JSON.parse(val) : ''
      },
      set(val) {
        let str = val ? JSON.stringify(val) : ''
        this.setDataValue(filed, str)
      }
    }
  },
  jsonArr: filed => {
    return {
      type: Sequelize.TEXT,
      defaultValue: '',
      get() {
        const val = this.getDataValue(filed)
        return val ? JSON.parse(val) : []
      },
      set(val) {
        let str = val ? JSON.stringify(val) : ''
        this.setDataValue(filed, str)
      }
    }
  }
}

const commonOpts = {
  timestamps: true,
  createAt: 'create_time',
  updateAt: 'update_time',
  freezeTableName: true
}

module.exports = {
  user: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        email: FIELDS.stringLen(255),
        mobile: FIELDS.stringLen(16),
        password: FIELDS.stringLen(32),
        pid: FIELDS.bigInt(),
        nickname: FIELDS.stringLen(64),
        password_trade: FIELDS.stringLen(32),
        idcard_no: FIELDS.stringLen(32),
        idcard_img_1: FIELDS.stringLen(255),
        idcard_img_2: FIELDS.stringLen(255),
        balance: FIELDS.money('balance'),
        score: FIELDS.bigInt(),
        score_frozen: FIELDS.bigInt(),
        vip: FIELDS.tinyInt(),
        uuid: FIELDS.uuid(),
        last_signin_time: FIELDS.defaultInt(),
        last_signin_ip: FIELDS.stringLen(32)
      },
      {
        ...commonOpts,
        tableName: 't_user'
      }
    ]
  },
  userAuth: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(1),
        user_id: FIELDS.bigInt(),
        platform: FIELDS.stringLen(16),
        device: FIELDS.stringLen(64),
        token: FIELDS.stringLen(64),
        type: FIELDS.stringLen(12)
      },
      {
        ...commonOpts,
        tableName: 't_user_auth'
      }
    ]
  },
  userApply: () => {
    return [
      { 
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        type: FIELDS.tinyInt(),
        num: FIELDS.bigInt(),
        confirm_time: FIELDS.defaultInt(11),
        confirm_admin_id: FIELDS.bigInt(20),
        confirm_admin_name: FIELDS.stringLen(64),
        confirm_remark: FIELDS.stringLen(255),
        finish_time: FIELDS.defaultInt(),
        finish_admin_id: FIELDS.bigInt(20),
        finish_admin_name: FIELDS.stringLen(64),
        finish_remark: FIELDS.stringLen(255),
        cancel_time: FIELDS.defaultInt(),
        cancel_admin_id: FIELDS.bigInt(),
        cancel_admin_name: FIELDS.stringLen(64),
        cancel_remark: FIELDS.stringLen(255),
        address: FIELDS.stringLen(255),
        fee: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_apply'
      }
    ]
  },
  userTrade: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        category: FIELDS.tinyInt(),
        type: FIELDS.stringLen(24),
        num: FIELDS.bigInt(),
        order_id: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_trade'
      }
    ]
  },
  userWallet: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        address: FIELDS.stringLen(64),
        private_key: FIELDS.stringLen(255),
        actived_time: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_wallet'
      }
    ]
  },
  userTransaction: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        type: FIELDS.tinyInt(),
        address_from: FIELDS.stringLen(64),
        address_to: FIELDS.stringLen(64),
        num: FIELDS.bigInt(),
        hash: FIELDS.stringLen(255),
        block_num: FIELDS.defaultInt(),
        index_num: FIELDS.defaultInt(),
        gas_used: FIELDS.defaultInt(),
        gas_price: FIELDS.bigInt(),
        eth_data: FIELDS.jsonObj('eth_data'),
        balance_from: FIELDS.bigInt(),
        balance_after: FIELDS.bigInt(),
        remark: FIELDS.text()
      },
      {
        ...commonOpts,
        tableName: 't_user_transaction'
      }
    ]
  },
  userReward: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        pid: FIELDS.bigInt(),
        ppid: FIELDS.bigInt(),
        num: FIELDS.bigInt(),
        active_status: FIELDS.tinyInt()
      },
      {
        ...commonOpts,
        tableName: 't_user_reward'
      }
    ]
  },
  rewardStage: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        date_start: FIELDS.stringLen(16),
        date_end: FIELDS.stringLen(16),
        num_1: FIELDS.defaultInt(),
        num_2: FIELDS.defaultInt(),
        num_3: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_reward_stage'
      }
    ]
  },
  exchange: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        out_trade_no: FIELDS.stringLen(64),
        num: FIELDS.bigInt(),
        use_status: FIELDS.tinyInt(),
        use_time: FIELDS.defaultInt(),
        type: FIELDS.tinyInt(),
        uid_from: FIELDS.bigInt(),
        uid_original: FIELDS.bigInt(),
        create_remark: FIELDS.stringLen(255)
      },
      {
        ...commonOpts,
        tableName: 't_exchange'
      }
    ]
  },
  exchangeLogs: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        from: FIELDS.bigInt(),
        to: FIELDS.bigInt(),
        num: FIELDS.bigInt(),
        remark: FIELDS.stringLen(255)
      },
      {
        ...commonOpts,
        tableName: 't_exchange_logs'
      }
    ]
  },
  news: () => {
    return [
      {
        ...commonFieldGet(),
        status:getStatusFields(0),
        category: FIELDS.tinyInt(),
        title: FIELDS.stringLen(255),
        description: FIELDS.stringLen(1000),
        post_time: FIELDS.defaultInt(),
        content: FIELDS.text(),
        cover: FIELDS.stringLen(255),
        sort: FIELDS.defaultInt(),
        admin_id: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_news'
      }
    ]
  },
  newsLogs: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        user_id: FIELDS.bigInt(),
        news_id: FIELDS.bigInt(),
      },
      {
        ...commonOpts,
        tableName: 't_news_logs'
      }
    ]
  },
  admin: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        email: FIELDS.stringLen(128),
        password: FIELDS.stringLen(32),
        pid: FIELDS.tinyInt(),
        type: FIELDS.tinyInt(),
        group_id: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_admin'
      }
    ]
  },
  adminGroup: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(64),
        admin_id: FIELDS.bigInt(),
        rules: FIELDS.stringLen(1000)
      },
      {
        ...commonOpts,
        tableName: 't_admin_group'
      }
    ]
  },
  adminRules: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(64),
        pid: FIELDS.bigInt(),
        router: FIELDS.stringLen(1000),
        icon: FIELDS.stringLen(24),
        sort: FIELDS.defaultInt()
      },
      {
        ...commonOpts,
        tableName: 't_admin_rules'
      }
    ]
  },
  schedule: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(1),
        name: FIELDS.stringLen(32),
        title: FIELDS.stringLen(64),
        rules: FIELDS.stringLen(32)
      },
      {
        ...commonOpts,
        tableName: 't_schedule'
      }
    ]
  },
  notice: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        title: FIELDS.stringLen(64),
        info: FIELDS.stringLen(1000),
        content: FIELDS.text(),
        push: FIELDS.tinyInt(),
        cover: FIELDS.stringLen(255)
      },
      {
        ...commonOpts,
        tableName: 't_notice'
      }
    ]
  },
  config: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        name: FIELDS.stringLen(24),
        title: FIELDS.stringLen(64),
        type: FIELDS.stringLen(12),
        content: FIELDS.stringLen(1000)
      },
      {
        ...commonOpts,
        tableName: 't_config'
      }
    ]
  },
  configExchange: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        num: FIELDS.stringLen(24),
        stock: FIELDS.stringLen(64),
        price: FIELDS.money('price')
      },
      {
        ...commonOpts,
        tableName: 't_config_exchange'
      }
    ]
  },
  album: () => {
    return [
      {
        ...commonFieldGet(),
        status: getStatusFields(0),
        description: FIELDS.stringLen(1000),
        type: FIELDS.stringLen(12),
        title: FIELDS.stringLen(64),
        url: FIELDS.stringLen(255),
        img: FIELDS.stringLen(255),
        thumb: FIELDS.stringLen(255),
        sort: FIELDS.defaultInt(),
        type_id: FIELDS.bigInt()
      },
      {
        ...commonOpts,
        tableName: 't_album'
      }
    ]
  },
  verifycode: () => {
    return [
      {
        ...commonFieldGet(),
        email: FIELDS.stringLen(64),
        mobile: FIELDS.stringLen(16),
        verify_code: FIELDS.defaultInt(),
        status: FIELDS.tinyInt()
      },
      {
        ...commonOpts,
        tableName: 't_verify_code'
      }
    ]
  },
  token: () => {
    return [
      {
        ...commonFieldGet(),
        status: FIELDS.tinyInt(),
        type: FIELDS.tinyInt(),
        env: FIELDS.stringLen(16),
        info: FIELDS.stringLen(255),
        content: FIELDS.text()
      },
      {
        ...commonOpts,
        tableName: 't_token'
      }
    ]
  },
  exchangeAdplan: () => {
    return [
      {
        ...commonFieldGet(),
        start_time: FIELDS.defaultInt(),
        end_time: FIELDS.defaultInt(),
        industry: FIELDS.stringLen(255),
        source_file: FIELDS.stringLen(255),
        adplan_no: FIELDS.stringLen(100),
        exchange_id: FIELDS.bigInt(20)
      },
      {
        ...commonOpts,
        tableName: 't_exchange_adplan'
      }
    ]
  }
}