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

const BigNumber = require('bignumber.js')
const lndClient = require('lnrpc-node-client')
const bluebird = require('bluebird')
const bitcoin = require('bitcoinjs-lib')
const utils = require('../utils')
const crypto = require('crypto')
const networks = require('../networks')

let lnd = function(net, lndSocket, macaroonPath, certPath, walletSecret, withRawResult = false) {
  if (net !== networks.MAINNET && net !== networks.TESTNET) throw new Error('Invalid network')
  let globalReturnRawResult = withRawResult
  let lightningRpc = null
  let walletRpc = null

  let name = 'lnd'
  let network = net
  this.getName = () => name
  this.getNetwork = () => network
  this.getPublicUri = () => lndSocket

  this.getUnspentOutputsAsync = async (withRawResult = false) => {
    let rawResult
    try {
      rawResult = await lightningRpc.listUnspentAsync({ min_confs: 1, max_confs: 2147483647 })
    } catch (error) {
      throw new Error(`Invalid response : ${error.message}`)
    }

    let unspentOutputs = rawResult.utxos.map(output => {
      return {
        fromTxId: output.outpoint.txid_str,
        outputIndex: output.outpoint.output_index,
        amount: BigNumber(output.amount_sat)
          .dividedBy(10 ** 8)
          .toNumber()
      }
    })

    let result = { unspentOutputs }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: lndSocket, result: rawResult }
    return result
  }

  this.broadcastTransactionAsync = async transactionHex => {
    let rawResult
    let txBuffer = Buffer.from(transactionHex, 'hex')
    try {
      rawResult = await walletRpc.PublishTransaction({ tx_hex: txBuffer })
      if (rawResult) throw new Error(rawResult)
    } catch (error) {
      throw new Error(`Invalid response : ${error.message}`)
    }

    let hash1x = crypto
      .createHash('sha256')
      .update(txBuffer)
      .digest()
    let hash2xHex = crypto
      .createHash('sha256')
      .update(hash1x)
      .digest('hex')
    let txId = utils.reverseHex(hash2xHex)
    let result = { txId: txId }
    return result
  }

  this.getTransactionDataAsync = async (transactionId, withRawResult = false) => {
    let rawResult
    try {
      let txId = utils.reverseHex(transactionId)
      rawResult = await lightningRpc.getTransactionsAsync({ txid: Buffer.from(txId, 'hex') })
      if (rawResult.transactions.length === 0) throw new Error(`Unknown transaction : ${transactionId}`)
    } catch (error) {
      throw new Error(`Invalid response : ${error.message}`)
    }

    let decodedTx = bitcoin.Transaction.fromHex(rawResult.transactions[0].raw_tx_hex)

    let valueOut = BigNumber(
      decodedTx.outs.reduce((result, item) => {
        result = BigNumber(result)
          .plus(item.value)
          .toNumber()
        return result
      }, 0)
    )
      .dividedBy(10 ** 8)
      .toNumber()

    let opReturnValue = null
    if (rawResult.vout) {
      opReturnValue = rawResult.vout.reduce((result, item) => {
        if (item.script[0] === 0x6a) return item.script[0].toString().slice(4)
      }, null)
    }

    let result = {
      txId: rawResult.transactions[0].tx_hash,
      version: decodedTx.version,
      blockHash: rawResult.transactions[0].block_hash || null,
      confirmations: rawResult.transactions[0].num_confirmations || 0,
      time: parseInt(rawResult.transactions[0].time_stamp),
      valueOut: valueOut,
      opReturnValue: opReturnValue
    }
    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: lndSocket, result: rawResult }
    return result
  }

  this.getBlockDataAsync = async (blockHeightOrHash, withRawResult = false) => {
    let rawResult
    try {
      let blockParam = typeof blockHeightOrHash === 'string' ? 'block_hash' : 'block_height'
      let blockIdObj = {}
      blockIdObj[blockParam] = blockHeightOrHash
      rawResult = await lightningRpc.getBlockAsync(blockIdObj)
    } catch (error) {
      throw new Error(`Invalid response : ${error.message}`)
    }

    let result = {}
    result.hash = rawResult.block_hash
    result.height = rawResult.block_height
    result.version = rawResult.version
    result.merkleRoot = utils.reverseHex(rawResult.merkle_root.toString('hex'))
    result.nTx = rawResult.transactions.length
    result.tx = rawResult.transactions
    result.previousBlockHash = utils.reverseHex(rawResult.prev_block.toString('hex'))
    result.time = rawResult.timestamp
    result.nonce = rawResult.nonce
    result.difficulty = utils.bitsToDifficulty(rawResult.bits)

    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: lndSocket, result: rawResult }
    return result
  }

  this.getEstimatedFeeAsync = async (numBlocks, withRawResult = false) => {
    let rawResult
    try {
      rawResult = await walletRpc.estimateFeeAsync({ conf_target: 2 })
    } catch (error) {
      throw new Error(`Invalid response : ${error.message}`)
    }
    let feeRateBtcPerKb = BigNumber(rawResult.sat_per_kw)
      .dividedBy(10 ** 8)
      .toNumber()

    let result = { feerate: feeRateBtcPerKb }

    if (withRawResult || globalReturnRawResult) result.raw = { provider: name, uri: lndSocket, result: rawResult }
    return result
  }

  this.ensureWalletUnlocked = async () => {
    try {
      await ensureLndNodeClientWalletUnlockedAsync()
      lndClient.setCredentials(lndSocket, macaroonPath, certPath)
      lightningRpc = bluebird.promisifyAll(lndClient.lightning())
      walletRpc = bluebird.promisifyAll(lndClient.wallet())
    } catch (error) {
      throw new Error(`Unlock error : ${error.message}`)
    }
  }

  async function sleepAsync(ms) {
    return new Promise(resolve => {
      setTimeout(() => {
        return resolve()
      }, ms)
    })
  }

  async function ensureLndNodeClientWalletUnlockedAsync() {
    let walletUnlocked = false
    let iterationCount = 0
    while (!walletUnlocked) {
      lndClient.setTls(lndSocket, certPath)
      let unlocker = bluebird.promisifyAll(lndClient.unlocker())
      try {
        await unlocker.unlockWalletAsync({ wallet_password: walletSecret })
      } catch (error) {
        if (error.code === 12) walletUnlocked = true // already unlocked
      }
      if (++iterationCount === 60) throw new Error(`Unable to unlock wallet`)
      if (!walletUnlocked) await sleepAsync(500)
    }
  }
}

module.exports = lnd
module.exports.setLND = l => {
  lnd = l
}
