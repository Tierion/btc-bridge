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

const bitcoin = require('bitcoinjs-lib')
const networks = require('../networks')
const BigNumber = require('bignumber.js')
const crypto = require('crypto')

let wallet = function(privateKeyWIF, provider) {
  let pk = privateKeyWIF
  let pv = provider

  this.generateOpReturnTxAsync = async (hexDataString, fee = false, broadcast = false) => {
    const network = pv.getNetwork() === networks.TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    const keyPair = bitcoin.ECPair.fromWIF(pk, network)
    const address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: network }).address

    // if fee = 'false', then use the estimate fee function to calculate the ideal fee
    if (fee === false) {
      const txSizeKb = 0.234375
      let feeResult = await pv.getEstimatedFeeAsync(2)
      let feeRateBtcPerKb = feeResult.feerate
      let calculatedFeeBtc = BigNumber(feeRateBtcPerKb)
        .times(txSizeKb)
        .toNumber()
      fee = calculatedFeeBtc
    }

    let result = await pv.getUnspentOutputsAsync(address)
    let spendableOutput = result.unspentOutputs.sort(utxoSortDesc)[0]

    if (!spendableOutput) throw new Error('No unspent outputs available, balance likely 0')
    if (spendableOutput.amount < fee) throw new Error('No outputs with sufficient funds available')

    let tx = new bitcoin.TransactionBuilder(network)

    let embedData = Buffer.from(hexDataString, 'hex')
    let embed = bitcoin.payments.embed({ data: [embedData] })
    tx.addInput(spendableOutput.fromTxId, spendableOutput.outputIndex)
    tx.addOutput(embed.output, 0)

    let spendableAmountBtc = spendableOutput.amount
    let returnAmountBtc = BigNumber(spendableAmountBtc)
      .minus(fee)
      .toNumber()
    let returnAmountSatoshi = Math.floor(
      BigNumber(returnAmountBtc)
        .times(10 ** 8)
        .toNumber()
    )
    console.log(returnAmountSatoshi)
    tx.addOutput(address, returnAmountSatoshi)

    tx.sign(0, keyPair)

    let txHex = tx.build().toHex()
    let txData = Buffer.from(txHex, 'hex')
    let txId = reverseHex(
      crypto
        .createHash('sha256')
        .update(
          crypto
            .createHash('sha256')
            .update(txData)
            .digest()
        )
        .digest('hex')
    )

    if (broadcast) await pv.broadcastTransactionAsync(txHex)

    return { txId, txHex }
  }
}

// private support functions

function utxoSortDesc(a, b) {
  if (a.amount < b.amount) return 1
  if (b.amount < a.amount) return -1
  return 0
}

function reverseHex(hexString) {
  return hexString
    .match(/.{2}/g)
    .reverse()
    .join('')
}

module.exports = wallet
