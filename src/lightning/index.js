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
const utils = require('../utils')
const BigNumber = require('bignumber.js')

let lightning = function(btcAddress, lndProvider) {
  let pv = lndProvider
  let address = btcAddress

  this.generateOpReturnTxAsync = async (hexDataString, feeEstimateNumBlocks = 2, broadcast = false) => {
    if (feeEstimateNumBlocks < 1 || feeEstimateNumBlocks > 1008)
      throw new Error('Invalid fee estimation block count, must be >= 1 and <= 1008')
    const txSizeKb = 0.234375
    let feeResult = await pv.getEstimatedFeeAsync(feeEstimateNumBlocks)
    let feeRateBtcPerKb = feeResult.feerate
    let calculatedFeeBtc = BigNumber(feeRateBtcPerKb)
      .times(txSizeKb)
      .toNumber()
    return await this.generateOpReturnTxWithFeeAsync(hexDataString, calculatedFeeBtc, broadcast)
  }

  this.generateOpReturnTxWithFeeAsync = async (hexDataString, fee, broadcast = false) => {
    let network
    switch (pv.getNetwork()) {
      case networks.MAINNET:
        network = bitcoin.networks.bitcoin
        break
      case networks.TESTNET:
        network = bitcoin.networks.testnet
        break
    }
    let result = await pv.getUnspentOutputsAsync(address)
    let spendableOutput = result.unspentOutputs.sort(utils.utxoSortDesc)[0]

    if (!spendableOutput)
      throw new Error('No unspent outputs available, balance likely 0 or previous UTXO spend not yet confirmed')
    if (spendableOutput.amount < fee) throw new Error('No outputs with sufficient funds available')

    const psbt = new bitcoin.Psbt({ network: network })
    psbt.addInput({
      hash: spendableOutput.fromTxId,
      index: spendableOutput.outputIndex,
      witnessUtxo: {
        script: Buffer.from(spendableOutput.script, 'hex'),
        value: BigNumber(spendableOutput.amount)
          .times(10 ** 8)
          .toNumber()
      }
    })

    let embedData = Buffer.from(hexDataString, 'hex')
    let embed = bitcoin.payments.embed({ data: [embedData] })
    psbt.addOutput({ script: embed.output, value: 0 })

    let spendableAmountBtc = spendableOutput.amount
    let returnAmountBtc = BigNumber(spendableAmountBtc)
      .minus(fee)
      .toNumber()
    let returnAmountSatoshi = Math.floor(
      BigNumber(returnAmountBtc)
        .times(10 ** 8)
        .toNumber()
    )
    psbt.addOutput({ address: address, value: returnAmountSatoshi })

    let publicKey = await pv.getPublicKeyForAddressAsync(address)
    let signatures = await pv.signOutputRawAsync(psbt.data.getTransaction(), Buffer.from(publicKey.publicKey, 'hex'), [
      spendableOutput
    ])

    let signatureBytes = Buffer.concat([signatures.signatures[0], Buffer.from('01', 'hex')])
    psbt.updateInput(0, {
      partialSig: [
        {
          pubkey: Buffer.from(publicKey.publicKey, 'hex'),
          signature: signatureBytes
        }
      ]
    })
    if (!psbt.validateSignaturesOfInput(0)) throw new Error('Signature is not valid')
    psbt.finalizeAllInputs()

    let finalTx = psbt.extractTransaction()
    let txId = finalTx.getId()
    let txHex = finalTx.toHex()

    if (broadcast) await pv.broadcastTransactionAsync(txHex)

    return { txId, txHex }
  }
}

module.exports = lightning
