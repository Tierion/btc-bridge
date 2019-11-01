/* Copyright 2019 Tierion
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let rp = require('request-promise-native')
const BigNumber = require('bignumber.js')
const networks = require('../networks')

let jsonrpc = function(net, uri, user = null, pass = null, withRawResult = false) {
  if (net !== networks.MAINNET && net !== networks.TESTNET && net !== networks.REGTEST)
    throw new Error('Invalid network')
  let globalReturnRawResult = withRawResult
  let baseOptions = { method: 'POST', url: uri, resolveWithFullResponse: true }
  if (user && pass) baseOptions.auth = { user, pass }

  let name = 'json-rpc'
  let network = net
  let publicUri = uri
  this.getName = () => name
  this.getNetwork = () => network
  this.getPublicUri = () => publicUri

  this.getUnspentOutputsAsync = async (address, withRawResult = false) => {
    // Note: This will only work via RPC if the address has been added to the wallet
    let options = Object.assign(
      { body: JSON.stringify({ method: 'listunspent', params: [0, 9999999, [address]] }) },
      baseOptions
    )

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) {
        if (error.statusCode === 401) throw new Error(`Invalid credentials`)
        throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
      }
      throw new Error(`No response received on getUnspentOutputsAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let unspentOutputs = rawResult.map(output => {
      return {
        fromTxId: output.txid,
        outputIndex: output.vout,
        amount: output.amount
      }
    })

    let result = { unspentOutputs }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: publicUri, result: rawResult }
    return result
  }

  this.broadcastTransactionAsync = async (transactionHex, withRawResult = false) => {
    let options = Object.assign(
      { body: JSON.stringify({ method: 'sendrawtransaction', params: [transactionHex] }) },
      baseOptions
    )

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) {
        if (error.statusCode === 401) throw new Error(`Invalid credentials`)
        throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
      }
      throw new Error(`No response received on broadcastTransactionAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let result = { txId: rawResult }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: publicUri, result: rawResult }
    return result
  }

  this.getTransactionDataAsync = async (transactionId, withRawResult = false) => {
    let options = Object.assign(
      { body: JSON.stringify({ method: 'getrawtransaction', params: [transactionId, 1] }) },
      baseOptions
    )

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) {
        if (error.statusCode === 401) throw new Error(`Invalid credentials`)
        throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
      }
      throw new Error(`No response received on getTransactionDataAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let valueIn = rawResult.vin.reduce((result, item) => {
      result = BigNumber(result)
        .plus(item.value)
        .toNumber()
      return result
    }, 0)
    let valueOut = rawResult.vout.reduce((result, item) => {
      result = BigNumber(result)
        .plus(item.value)
        .toNumber()
      return result
    }, 0)
    let fees = BigNumber(valueIn)
      .minus(valueOut)
      .toNumber()

    let opReturnValue = null
    if (rawResult.vout) {
      opReturnValue = rawResult.vout.reduce((result, item) => {
        if (item.scriptPubKey && item.scriptPubKey.asm && item.scriptPubKey.asm.startsWith('OP_RETURN '))
          result = item.scriptPubKey.asm.replace('OP_RETURN ', '')
        return result
      }, null)
    }

    let result = {
      txId: rawResult.txid,
      version: rawResult.version,
      blockHash: rawResult.blockhash || null,
      confirmations: rawResult.confirmations || 0,
      time: rawResult.time,
      blockTime: rawResult.blocktime,
      size: rawResult.size,
      valueIn: valueIn,
      valueOut: valueOut,
      fees: fees,
      opReturnValue: opReturnValue
    }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: publicUri, result: rawResult }
    return result
  }

  this.getBlockDataAsync = async (blockHeightOrHash, withRawResult = false) => {
    let options, response

    if (typeof blockHeightOrHash == 'number') {
      // a height was received, retrieve the block hash for this height
      options = Object.assign(
        { body: JSON.stringify({ method: 'getblockhash', params: [blockHeightOrHash] }) },
        baseOptions
      )

      try {
        response = await rp(options)
      } catch (error) {
        if (error.statusCode) {
          if (error.statusCode === 401) throw new Error(`Invalid credentials`)
          throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
        }
        throw new Error(`No response received on getBlockDataAsync : ${error.message}`)
      }
      blockHeightOrHash = JSON.parse(response.body).result
    }

    options = Object.assign(
      { body: JSON.stringify({ method: 'getblock', params: [blockHeightOrHash, true] }) },
      baseOptions
    )

    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) {
        if (error.statusCode === 401) throw new Error(`Invalid credentials`)
        throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
      }
      throw new Error(`No response received on getBlockDataAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let result = {}
    result.hash = rawResult.hash
    result.height = rawResult.height
    result.size = rawResult.size
    result.version = rawResult.version
    result.confirmations = rawResult.confirmations
    result.merkleRoot = rawResult.merkleroot
    result.nTx = rawResult.tx.length
    result.tx = rawResult.tx
    result.previousBlockHash = rawResult.previousblockhash
    result.time = rawResult.time
    result.nonce = rawResult.nonce
    result.difficulty = rawResult.difficulty

    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: publicUri, result: rawResult }
    return result
  }

  this.getEstimatedFeeAsync = async (numBlocks, withRawResult = false) => {
    let options = Object.assign(
      { body: JSON.stringify({ method: 'estimatesmartfee', params: [numBlocks] }) },
      baseOptions
    )

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) {
        if (error.statusCode === 401) throw new Error(`Invalid credentials`)
        throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
      }
      throw new Error(`No response received on getEstimatedFeeAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let result = { feerate: rawResult.feerate }

    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: publicUri, result: rawResult }
    return result
  }

  this.getChainInfoAsync = async (withRawResult = false) => {
    let options = Object.assign({ body: JSON.stringify({ method: 'getblockchaininfo' }) }, baseOptions)

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) {
        if (error.statusCode === 401) throw new Error(`Invalid credentials`)
        throw new Error(`Invalid response : ${error.statusCode} : ${JSON.parse(error.error).error.message}`)
      }
      throw new Error(`No response received on getChainInfoAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let result = {
      chain: 'BTC',
      network: rawResult.chain === 'test' ? 'testnet' : 'mainnet',
      topBlockHeight: rawResult.blocks || null,
      topBlockHash: rawResult.bestblockhash || null
    }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: publicUri, result: rawResult }
    return result
  }
}

module.exports = jsonrpc
module.exports.setRP = r => {
  rp = r
}
