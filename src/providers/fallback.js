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

const Blockcypher = require('./blockcypher')
const JsonRpc = require('./json-rpc')

let fallback = function(...providerArray) {
  if (!Array.isArray(providerArray) || providerArray.length === 0)
    throw new Error('No providers specified for fallback provider')
  for (let [index, provider] of providerArray.entries()) {
    if (!(provider instanceof Blockcypher) && !(provider instanceof JsonRpc))
      throw new Error(`Invalid provider specified at index ${index} for fallback provider`)
  }

  let providers = providerArray

  this.getUnspentOutputsAsync = async (address, withRawResult = false) => {
    let errors = []
    for (let provider of providers) {
      try {
        let result = await provider.getUnspentOutputsAsync(address, withRawResult)
        return result
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

  this.broadcastTransactionAsync = async (transactionHex, withRawResult = false) => {
    let errors = []
    for (let provider of providers) {
      try {
        let result = await provider.broadcastTransactionAsync(transactionHex, withRawResult)
        return result
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

  this.getTransactionDataAsync = async (transactionId, withRawResult = false) => {
    let errors = []
    for (let provider of providers) {
      try {
        let result = await provider.getTransactionDataAsync(transactionId, withRawResult)
        return result
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

  this.getBlockDataAsync = async (blockHeightOrHash, withRawResult = false) => {
    let errors = []
    for (let provider of providers) {
      try {
        let result = await provider.getBlockDataAsync(blockHeightOrHash, withRawResult)
        return result
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

  this.getEstimatedFeeAsync = async (numBlocks, withRawResult = false) => {
    let errors = []
    for (let provider of providers) {
      try {
        let result = await provider.getEstimatedFeeAsync(numBlocks, withRawResult)
        return result
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
}

module.exports = fallback
