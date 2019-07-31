const Web3 = require('web3')
const web3Config = require('./../../config/web3')
const configEnv = require('./../../config').web3
web3Config.host = configEnv.host
web3Config.port = configEnv.port || web3Config.port
web3Config.mainAccount = configEnv.mainAccount
web3Config.contract_address = configEnv.contract_address

class web3Utils {
  constructor() {
    if (typeof this.web3 !== 'undefined') {
      this.web3 = new Web3(this.web3.currentProvider)
    } else {
      this.web3 = new Web3(new Web3.providers.HttpProvider(web3Config.host + ':' + web3Config.port))
    }
    this.chainId = web3Config.chainId
    this.contractAddress = web3Config.contract_address
    this.abi = web3Config.abi
  }

  async getBlockNumber() {
    let blockNumber = await this.web3.eth.getBlockNumber()
    return blockNumber
  }

  /**
   * 获取以太数量
   * @param {*} address
   */
  async getBalance(address) {
    let value = await this.web3.eth.getBalance(address)
    return this.web3.utils.fromWei(value)
  }

  /**
   * 发送交易，在私链上
   * @param {*} from
   * @param {*} to
   * @param {*} value
   */
  async transfer(from, to, value) {
    value = this.web3.utils.toWei(value.toString())
    let result = this.web3.eth.sendTransaction({
      from,
      to,
      value
    })
    return result
  }

  /**
   * 获取代币合同
   */
  getTokenContract() {
    let contract = new this.web3.eth.Contract(this.abi, this.contractAddress)
    return contract
  }

  /**
   * 获取代币余额
   * @param {*} address
   */
  async getTokenBalance(address) {
    let contract = this.getTokenContract()
    let result = await contract.methods.balanceOf(address).call()
    return result.toString()
  }

  async tokenTransferToGas(contract, from, to, num) {
    contract = contract || this.getTokenContract()
    let decimal = await contract.methods.decimals().call()
    let value = parseInt(num * 10 ** decimal)
    let gas = await contract.methods.transfer(to, value).estimateGas({
      from
    })
    return gas
  }

  /**
   * 代币交易
   * @param {*} from
   * @param {*} to
   * @param {*} value
   */
  async transferToken(account, to, num) {
    let ret = {
      code: 0,
      message: '',
      data: {}
    }
    try {
      let contract = this.getTokenContract()
      let decimal = await contract.methods.decimal().call()
      let value = parseInt(num * 10 ** decimal)
      let from = account.address
      let transfer = contract.methods.transfer(to, value)
      let contractAddress = contract.options.address
      let gas = await this.tokenTransferToGas(contract, from, to, num)
      let nonce = await this.web3.eth.getTransactionCount(from)
      nonce.toString(16)
      let tx = {
        gas,
        from,
        to: contractAddress,
        data: transfer.encodeABI(),
        chainId: this.chainId,
        nonce
      }
      let signed = await this.web3.eth.accounts.signTransaction(tx, account.privateKey)
      let transaction = await this.web3.eth.sendSignedTransaction(signed.rawTransaction)
      let transactionRet = await this.returnTransaction(transaction)
      let gasPrice = await this.web3.eth.getGasPrice()
      ret.data = {
        from,
        to,
        num,
        gas,
        gasPrice,
        index: transactionRet.transactionIndex,
        hash: transactionRet.transactionHash,
        block: transactionRet.blockNumber
      }
      return ret
    } catch(err) {
      ret.code = 1
      ret.message = err.message || err
      return ret
    }
  }

  async transaferEth(account, to, num) {
    account = account || web3Config.mainAccount
    let ret = {
      code: 0,
      message: '',
      data: {}
    }
    try {
      let gas = await this.estimateGas(account.address, to, num)
      console.log('gas=======', gas)
      let nonce = await this.web3.eth.getTransactionCount(account.address)
      console.log('nonce=======', nonce.toString(16))
      // nonce++
      console.log('nonce=======', nonce)

      let tx = {
        gas: gas,
        from: account.address,
        to: to,
        value: num,
        chainId: this.chainId,
        nonce: nonce
      }
      // console.log(tx)

      let signed = await this.web3.eth.accounts.signTransaction(tx, account.privateKey)
      // console.log(signed)
      let transaction = this.web3.eth.sendSignedTransaction(signed.rawTransaction)

      let transactionRet = await this.returnTransaction(transaction)

      console.log('transaferEth transactionRet', transactionRet)
      let gasPrice = await this.web3.eth.getGasPrice()
      ret.data = {
        from: account.address,
        to: to,
        num: num,
        gas: gas,
        gasPrice: gasPrice,
        index: transactionRet.transactionIndex,
        hash: transactionRet.transactionHash,
        block: transactionRet.blockNumber
      }
      console.log('transaferEth ret', ret)
      return ret
    } catch (err) {
      console.error('tokenTransferTo')
      console.error(err.message || err)
      ret.code = 1
      ret.message = err.message || err
      return ret
    }
  }

  estimateGas(from, to, value) {
    let gas = this.web3.eth.estimateGas({
      from: from,
      to: to,
      value: value
    })

    return gas
  }

  /**
   * 添加账户
   */
  async accountCreate() {
    let account = await this.web3.eth.accounts.create()
    return account
  }

  async accountUnlock(address, password) {
    let ret = await this.web3.eth.personal.unlockAccount(address, password, 600)
    return ret
  }

  async accountInfoByPrivateKey(privateKey) {
    console.log(privateKey)
    let account = this.web3.eth.accounts.privateKeyToAccount(privateKey)
    return account
  }

  /**
   * 合约部署
   * @param {*} account 
   */
  async contractDeploy(account) {
    console.log('contractDeploy account', account)

    let contract = new this.web3.eth.Contract(this.abi)


    let deploy = contract.deploy({
      data: web3Config.abiBtyeCode,
      // arguments: [web3Config.token.name, web3Config.token.code, web3Config.token.num]
    })

    let gasPrice = await this.web3.eth.getGasPrice()
    console.log('contractDeploy gasPrice', gasPrice)
    let nonce = await this.web3.eth.getTransactionCount(account.address)
    console.log('nonce=======', nonce.toString(16))

    // console.log(this.fromWei((4084800 * gasPrice).toString()))
    // return

    let tx = {
      from: account.address,
      gas: 4084800,
      // gas: 2000000,
      gasPrice: gasPrice,
      data: deploy.encodeABI(),
      chainId: this.chainId,
      nonce: nonce,
      // value: this.web3.utils.toWei('0.01')
    }

    let signed = await this.web3.eth.accounts.signTransaction(tx, account.privateKey)
    // console.log(signed.rawTransaction)
    // console.log('contractDeploy signed' , signed.rawTransaction)
    let transaction = this.web3.eth.sendSignedTransaction(signed.rawTransaction)

    try {
      let data = await this.returnTransaction(transaction)
      console.log(data)
      return {
        code: 0,
        message: '',
        data: data
      }
    } catch (err) {
      return {
        code: 1,
        message: err.message || 'null'
      }
    }
  }

  async getContractTransaction(block = {
    start: 0,
    end: 1
  }, filter = {}, event = 'Transfer') {
    let contract = this.getTokenContract()

    let rets = await contract.getPastEvents(event, {
      fromBlock: block.start,
      toBlock: block.end
    })
    // console.log(rets)
    return rets
  }


  /**
   * 获取区块交易数据
   * @param {*} block 
   */
  async getBlockTransactionCount(block) {
    let ret = await this.web3.eth.getBlockTransactionCount(block)
    return ret
  }

  /**
   * 获取区块交易数据
   * @param {*} block 
   */
  async getTransactionFromBlock(block, index) {
    let ret = await this.web3.eth.getTransactionFromBlock(block, index)
    return ret
  }

  async getTransactionReceipt(hash) {
    let ret = await this.web3.eth.getTransactionReceipt(hash)
    return ret
  }


  /**
   * 返回交易数据
   * @param {*} transaction 
   */
  async returnTransaction(transaction) {
    return new Promise((r, j) => {
      transaction.on('confirmation', (confirmationNumber, receipt) => {
        console.log('confirmation: ' + confirmationNumber)
        console.log('confirmation:receipt ')
        console.log(receipt)
        r(receipt)
      })

      transaction.on('transactionHash', hash => {
        console.log('hash')
        console.log(hash)
      })

      transaction.on('receipt', receipt => {
        console.log('reciept')
        console.log(receipt)
        // r(receipt)
      })

      transaction.on('error', err => {
        console.error('error')
        console.error(err)
        j(err)
      })

    })
  }

  toWei(num, unit = 'ether') {
    let value = this.web3.utils.toWei(num, unit)
    return value
  }

  fromWei(num, unit = 'ether') {
    let value = this.web3.utils.fromWei(num, unit)
    return value
  }

  toBN(str) {
    return this.web3.utils.toBN(str)
  }

  async gasPriceGet(gas) {
    let gasPrice = await this.web3.eth.getGasPrice()
    console.log('gasPrice', gasPrice)
    return gasPrice * gas
  }
}

module.exports = new web3Utils()