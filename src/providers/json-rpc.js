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

const rp = require('request-promise-native')
const BigNumber = require('bignumber.js')

let jsonrpc = function(url, withRawResult = false) {
  let globalReturnRawResult = withRawResult

  this.getUnspentOutputsAsync = async (address, withRawResult = false) => {
    // Note: This will only work via RPC is the address is added to teh wallet
    let options = {
      method: 'POST',
      url: url,
      body: JSON.stringify({ method: 'listunspent', params: [0, 9999999, [address]] }),
      resolveWithFullResponse: true
    }

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) throw new Error(`Invalid response : ${error.statusCode} : ${error.message}`)
      throw new Error(`No response received on getUnspentOutputsAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    console.log(response.body)

    let unspentOutputs = rawResult.map(output => {
      return {
        fromTxId: output.txid,
        outputIndex: output.vout,
        amount: output.amount
      }
    })

    let result = { unspentOutputs }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: 'json-rpc', uri: url, result: rawResult }
    return result
  }

  this.broadcastTransactionAsync = async (transactionHex, withRawResult = false) => {
    let options = {
      method: 'POST',
      url: url,
      body: {
        method: 'sendrawtransaction',
        params: [transactionHex]
      },
      resolveWithFullResponse: true
    }

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) throw new Error(`Invalid response : ${error.statusCode} : ${error.message}`)
      throw new Error(`No response received on broadcastTransactionAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let result = { txId: rawResult }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: 'json-rpc', uri: url, result: rawResult }
    return result
  }

  this.getTransactionDataAsync = async (transactionId, withRawResult = false) => {
    let options = {
      method: 'POST',
      url: url,
      body: JSON.stringify({ method: 'getrawtransaction', params: [transactionId, 1] }),
      resolveWithFullResponse: true
    }

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) throw new Error(`Invalid response : ${error.statusCode} : ${error.message}`)
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

    let anchorValue = null
    if (rawResult.vout) {
      anchorValue = rawResult.vout.reduce((result, item) => {
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
      anchorValue: anchorValue
    }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: 'json-rpc', uri: url, result: rawResult }
    return result
  }

  this.getBlockDataAsync = async (blockHeightOrHash, withRawResult = false) => {
    let options
    let response
    if (typeof blockHeightOrHash == 'number') {
      // a height was received, retrieve the block hash for this height
      options = {
        method: 'POST',
        url: url,
        body: JSON.stringify({ method: 'getblockhash', params: [blockHeightOrHash] }),
        resolveWithFullResponse: true
      }

      try {
        response = await rp(options)
      } catch (error) {
        if (error.statusCode) throw new Error(`Invalid response : ${error.statusCode} : ${error.message}`)
        throw new Error(`No response received on getBlockDataAsync : ${error.message}`)
      }

      blockHeightOrHash = JSON.parse(response.body).result
    }
    options = {
      method: 'POST',
      url: url,
      body: JSON.stringify({ method: 'getblock', params: [blockHeightOrHash, true] }),
      resolveWithFullResponse: true
    }

    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) throw new Error(`Invalid response : ${error.statusCode} : ${error.message}`)
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

    if (withRawResult || globalReturnRawResult) result.raw = { provider: 'json-rpc', uri: url, result: rawResult }
    return result
  }

  this.getEstimatedFeeAsync = async (numBlocks, withRawResult = false) => {
    let options = {
      method: 'POST',
      url: url,
      body: JSON.stringify({ method: 'estimatesmartfee', params: [numBlocks] }),
      resolveWithFullResponse: true
    }

    let response
    try {
      response = await rp(options)
    } catch (error) {
      if (error.statusCode) throw new Error(`Invalid response : ${error.statusCode} : ${error.message}`)
      throw new Error(`No response received on getEstimatedFeeAsync : ${error.message}`)
    }

    let rawResult = JSON.parse(response.body).result

    let result = { feerate: rawResult.feerate }

    if (withRawResult || globalReturnRawResult) result.raw = { provider: 'json-rpc', uri: url, result: rawResult }
    return result
  }
}

module.exports = jsonrpc
module.exports.getInstance = (url, withRawResult) => {
  return new jsonrpc(url, withRawResult)
}
