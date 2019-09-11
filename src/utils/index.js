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

function bitsToDifficulty(bits) {
  let hexBits = bits.toString(16)
  let bitCount = parseInt(hexBits.slice(0, 2), 16)
  let bitTarget = hexBits.slice(2)
  let bitsNeeded = bitCount - bitTarget.length / 2

  let bitTargetInt = parseInt(bitTarget + '00'.repeat(bitsNeeded), 16)
  let genTargetInt = parseInt('00ffff0000000000000000000000000000000000000000000000000000', 16)
  let difficulty = BigNumber(genTargetInt)
    .dividedBy(bitTargetInt)
    .toNumber()

  return difficulty
}

function reverseHex(hexString) {
  return hexString
    .match(/.{2}/g)
    .reverse()
    .join('')
}

function utxoSortDesc(a, b) {
  if (a.amount < b.amount) return 1
  if (b.amount < a.amount) return -1
  return 0
}

module.exports = {
  bitsToDifficulty: bitsToDifficulty,
  reverseHex: reverseHex,
  utxoSortDesc: utxoSortDesc
}
