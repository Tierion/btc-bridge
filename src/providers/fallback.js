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

let Blockcypher = require('./blockcypher')
let JsonRpc = require('./json-rpc')

let fallback = function(providers, randomize = false) {
  if (!Array.isArray(providers) || providers.length === 0)
    throw new Error('No providers array specified for fallback provider')
  for (let [index, provider] of providers.entries()) {
    if (!(provider instanceof Blockcypher) && !(provider instanceof JsonRpc))
      throw new Error(`Invalid provider specified at index ${index} for fallback provider`)
  }

  this.getUnspentOutputsAsync = async (address, withRawResult = false) => {
    return await callProviderFunctionAsync('getUnspentOutputsAsync', [address, withRawResult])
  }

  this.broadcastTransactionAsync = async (transactionHex, withRawResult = false) => {
    return await callProviderFunctionAsync('broadcastTransactionAsync', [transactionHex, withRawResult])
  }

  this.getTransactionDataAsync = async (transactionId, withRawResult = false) => {
    return await callProviderFunctionAsync('getTransactionDataAsync', [transactionId, withRawResult])
  }

  this.getBlockDataAsync = async (blockHeightOrHash, withRawResult = false) => {
    return await callProviderFunctionAsync('getBlockDataAsync', [blockHeightOrHash, withRawResult])
  }

  this.getEstimatedFeeAsync = async (numBlocks, withRawResult = false) => {
    return await callProviderFunctionAsync('getEstimatedFeeAsync', [numBlocks, withRawResult])
  }

  // private support functions

  async function callProviderFunctionAsync(name, params) {
    let errors = []
    if (randomize) providers = shuffleArray(providers)
    for (let provider of providers) {
      try {
        switch (name) {
          case 'getUnspentOutputsAsync':
            return await provider.getUnspentOutputsAsync(...params)
          case 'broadcastTransactionAsync':
            return await provider.broadcastTransactionAsync(...params)
          case 'getTransactionDataAsync':
            return await provider.getTransactionDataAsync(...params)
          case 'getBlockDataAsync':
            return await provider.getBlockDataAsync(...params)
          case 'getEstimatedFeeAsync':
            return await provider.getEstimatedFeeAsync(...params)
          default:
            throw new Error(`Unknown function name : ${name}`)
        }
      } catch (error) {
        errors.push({
          provider: provider.name,
          uri: provider.publicUri,
          error: error.message
        })
      }
    }
    throw new Error(JSON.stringify(errors))
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  }
}

module.exports = fallback
// additional functions for testing purposes
module.exports.setBC = p => (Blockcypher = p)
module.exports.setRPC = p => (JsonRpc = p)
