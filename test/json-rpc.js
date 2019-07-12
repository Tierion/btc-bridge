/* global describe, it, before */

process.env.NODE_ENV = 'test'

// test related packages
const expect = require('chai').expect

const btcBridge = require('../src/index')

describe('JSON-RPC Provider', () => {
  let uri = 'http://10.1.1.1:123'
  describe('getUnspentOutputsAsync with bad auth', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 401 }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getUnspentOutputsAsync('badaddress')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid credentials')
    })
  })

  describe('getUnspentOutputsAsync with badaddress', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'badaddress!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getUnspentOutputsAsync('badaddress')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 400 : badaddress!')
    })
  })

  describe('getUnspentOutputsAsync with timeout', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getUnspentOutputsAsync('badaddress')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No response received on getUnspentOutputsAsync : timeout!')
    })
  })

  describe('getUnspentOutputsAsync with valid parameters', () => {
    let address = 'myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2'
    let response = {
      result: [
        {
          txid: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
          vout: 0,
          address: address,
          scriptPubKey: '76a914fb105362e7419bd437d3648fc926ebcd939ca4d888ac',
          amount: 0.10871747,
          confirmations: 140,
          spendable: true,
          solvable: true
        }
      ]
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getUnspentOutputsAsync(address)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('unspentOutputs')
        .and.to.be.a('array')
      expect(result.unspentOutputs.length).to.equal(1)
      expect(result.unspentOutputs[0]).to.be.a('object')
      expect(result.unspentOutputs[0])
        .to.have.property('fromTxId')
        .and.to.equal('dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f')
      expect(result.unspentOutputs[0])
        .to.have.property('outputIndex')
        .and.to.equal(0)
      expect(result.unspentOutputs[0])
        .to.have.property('amount')
        .and.to.equal(0.10871747)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getUnspentOutputsAsync with valid parameters and raw result', () => {
    let address = 'myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2'
    let response = {
      result: [
        {
          txid: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
          vout: 0,
          address: address,
          scriptPubKey: '76a914fb105362e7419bd437d3648fc926ebcd939ca4d888ac',
          amount: 0.10871747,
          confirmations: 140,
          spendable: true,
          solvable: true
        }
      ]
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getUnspentOutputsAsync(address, true)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('unspentOutputs')
        .and.to.be.a('array')
      expect(result.unspentOutputs.length).to.equal(1)
      expect(result.unspentOutputs[0]).to.be.a('object')
      expect(result.unspentOutputs[0])
        .to.have.property('fromTxId')
        .and.to.equal('dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f')
      expect(result.unspentOutputs[0])
        .to.have.property('outputIndex')
        .and.to.equal(0)
      expect(result.unspentOutputs[0])
        .to.have.property('amount')
        .and.to.equal(0.10871747)
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('json-rpc')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response.result)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal(uri)
    })
  })

  describe('broadcastTransactionAsync with bad auth', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 401 }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.broadcastTransactionAsync('nothex')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid credentials')
    })
  })

  describe('broadcastTransactionAsync with bad hex', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'error!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.broadcastTransactionAsync('nothex')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 400 : error!')
    })
  })

  describe('broadcastTransactionAsync with timeout', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.broadcastTransactionAsync('deadbeef')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No response received on broadcastTransactionAsync : timeout!')
    })
  })

  describe('broadcastTransactionAsync with valid parameters', () => {
    let tx =
      '01000000011935b41d12936df99d322ac8972b74ecff7b79408bbccaf1b2eb8015228beac8000000006b483045022100921fc36b911094280f07d8504a80fbab9b823a25f102e2bc69b14bcd369dfc7902200d07067d47f040e724b556e5bc3061af132d5a47bd96e901429d53c41e0f8cca012102152e2bb5b273561ece7bbe8b1df51a4c44f5ab0bc940c105045e2cc77e618044ffffffff0240420f00000000001976a9145fb1af31edd2aa5a2bbaa24f6043d6ec31f7e63288ac20da3c00000000001976a914efec6de6c253e657a9d5506a78ee48d89762fb3188ac00000000'
    let response = {
      result: '4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50'
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.broadcastTransactionAsync(tx)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('txId')
        .and.to.equal('4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50')
      expect(result).to.not.have.property('raw')
    })
  })

  describe('broadcastTransactionAsync with valid parameters and raw result', () => {
    let tx =
      '01000000011935b41d12936df99d322ac8972b74ecff7b79408bbccaf1b2eb8015228beac8000000006b483045022100921fc36b911094280f07d8504a80fbab9b823a25f102e2bc69b14bcd369dfc7902200d07067d47f040e724b556e5bc3061af132d5a47bd96e901429d53c41e0f8cca012102152e2bb5b273561ece7bbe8b1df51a4c44f5ab0bc940c105045e2cc77e618044ffffffff0240420f00000000001976a9145fb1af31edd2aa5a2bbaa24f6043d6ec31f7e63288ac20da3c00000000001976a914efec6de6c253e657a9d5506a78ee48d89762fb3188ac00000000'
    let response = {
      result: '4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50'
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.broadcastTransactionAsync(tx, 1)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('txId')
        .and.to.equal('4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50')
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('json-rpc')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response.result)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal(uri)
    })
  })

  describe('getTransactionDataAsync with bad auth', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 401 }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getTransactionDataAsync('badid')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid credentials')
    })
  })

  describe('getTransactionDataAsync with badid', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'badid!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getTransactionDataAsync('badid')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 400 : badid!')
    })
  })

  describe('getTransactionDataAsync with timeout', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getTransactionDataAsync('badid')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No response received on getTransactionDataAsync : timeout!')
    })
  })

  describe('getTransactionDataAsync with valid parameters no anchor', () => {
    let txId = 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f'
    let response = {
      result: {
        hex:
          '0100000001312a085389d844e15a02a3fddcffb61b99b23881c3bf6351c090e8275efe2edd000000006b48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729ffffffff02c3e3a500000000001976a914c1c6183f890d0e0c9bccfb823f640573f1d0498688acc44e0100000000001976a9148728db57a62afd6054c90d85c3f610c1a81b949488ac00000000',
        txid: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
        size: 226,
        version: 1,
        locktime: 0,
        vin: [
          {
            txid: 'dd2efe5e27e890c05163bfc38138b2991bb6ffdcfda3025ae144d88953082a31',
            vout: 0,
            scriptSig: {
              asm:
                '304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd[ALL] 03422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729',
              hex:
                '48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729'
            },
            value: 0.11071465,
            valueSat: 11071465,
            address: 'mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP',
            sequence: 4294967295
          }
        ],
        vout: [
          {
            value: 0.10871747,
            valueSat: 10871747,
            n: 0,
            scriptPubKey: {
              asm: 'OP_DUP OP_HASH160 c1c6183f890d0e0c9bccfb823f640573f1d04986 OP_EQUALVERIFY OP_CHECKSIG',
              hex: '76a914c1c6183f890d0e0c9bccfb823f640573f1d0498688ac',
              reqSigs: 1,
              type: 'pubkeyhash'
            }
          },
          {
            value: 0.000857,
            valueSat: 85700,
            n: 1,
            scriptPubKey: {
              asm: 'OP_DUP OP_HASH160 8728db57a62afd6054c90d85c3f610c1a81b9494 OP_EQUALVERIFY OP_CHECKSIG',
              hex: '76a9148728db57a62afd6054c90d85c3f610c1a81b949488ac',
              reqSigs: 1,
              type: 'pubkeyhash'
            }
          }
        ],
        blockhash: '000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711',
        height: 1568589,
        confirmations: 143,
        time: 1562872879,
        blocktime: 1562872879
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getTransactionDataAsync(txId)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('txId')
        .and.to.equal(txId)
      expect(result)
        .to.have.property('version')
        .and.to.equal(1)
      expect(result)
        .to.have.property('blockHash')
        .and.to.equal('000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711')
      expect(result)
        .to.have.property('confirmations')
        .and.to.equal(143)
      expect(result)
        .to.have.property('time')
        .and.to.equal(1562872879)
      expect(result)
        .to.have.property('blockTime')
        .and.to.equal(1562872879)
      expect(result)
        .to.have.property('size')
        .and.to.equal(226)
      expect(result)
        .to.have.property('valueIn')
        .and.to.equal(0.11071465)
      expect(result)
        .to.have.property('valueOut')
        .and.to.equal(0.10957447)
      expect(result)
        .to.have.property('fees')
        .and.to.equal(0.00114018)
      expect(result)
        .to.have.property('anchorValue')
        .and.to.equal(null)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getTransactionDataAsync with valid parameters with anchor', () => {
    let txId = 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f'
    let response = {
      result: {
        hex:
          '0100000001312a085389d844e15a02a3fddcffb61b99b23881c3bf6351c090e8275efe2edd000000006b48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729ffffffff02c3e3a500000000001976a914c1c6183f890d0e0c9bccfb823f640573f1d0498688acc44e0100000000001976a9148728db57a62afd6054c90d85c3f610c1a81b949488ac00000000',
        txid: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
        size: 226,
        version: 1,
        locktime: 0,
        vin: [
          {
            txid: 'dd2efe5e27e890c05163bfc38138b2991bb6ffdcfda3025ae144d88953082a31',
            vout: 0,
            scriptSig: {
              asm:
                '304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd[ALL] 03422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729',
              hex:
                '48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729'
            },
            value: 0.11071465,
            valueSat: 11071465,
            address: 'mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP',
            sequence: 4294967295
          }
        ],
        vout: [
          {
            value: 0.10871747,
            valueSat: 10871747,
            n: 0,
            scriptPubKey: {
              asm: 'OP_DUP OP_HASH160 c1c6183f890d0e0c9bccfb823f640573f1d04986 OP_EQUALVERIFY OP_CHECKSIG',
              hex: '76a914c1c6183f890d0e0c9bccfb823f640573f1d0498688ac',
              reqSigs: 1,
              type: 'pubkeyhash'
            }
          },
          {
            value: 0.000857,
            valueSat: 85700,
            n: 1,
            scriptPubKey: {
              asm: 'OP_RETURN aaaa811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
              hex: '76a9148728db57a62afd6054c90d85c3f610c1a81b949488ac',
              reqSigs: 1,
              type: 'pubkeyhash'
            }
          }
        ],
        blockhash: '000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711',
        height: 1568589,
        confirmations: 143,
        time: 1562872879,
        blocktime: 1562872879
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getTransactionDataAsync(txId)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('txId')
        .and.to.equal(txId)
      expect(result)
        .to.have.property('version')
        .and.to.equal(1)
      expect(result)
        .to.have.property('blockHash')
        .and.to.equal('000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711')
      expect(result)
        .to.have.property('confirmations')
        .and.to.equal(143)
      expect(result)
        .to.have.property('time')
        .and.to.equal(1562872879)
      expect(result)
        .to.have.property('blockTime')
        .and.to.equal(1562872879)
      expect(result)
        .to.have.property('size')
        .and.to.equal(226)
      expect(result)
        .to.have.property('valueIn')
        .and.to.equal(0.11071465)
      expect(result)
        .to.have.property('valueOut')
        .and.to.equal(0.10957447)
      expect(result)
        .to.have.property('fees')
        .and.to.equal(0.00114018)
      expect(result)
        .to.have.property('anchorValue')
        .and.to.equal('aaaa811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f')
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getTransactionDataAsync with valid parameters and raw result', () => {
    let txId = 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f'
    let response = {
      result: {
        hex:
          '0100000001312a085389d844e15a02a3fddcffb61b99b23881c3bf6351c090e8275efe2edd000000006b48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729ffffffff02c3e3a500000000001976a914c1c6183f890d0e0c9bccfb823f640573f1d0498688acc44e0100000000001976a9148728db57a62afd6054c90d85c3f610c1a81b949488ac00000000',
        txid: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
        size: 226,
        version: 1,
        locktime: 0,
        vin: [
          {
            txid: 'dd2efe5e27e890c05163bfc38138b2991bb6ffdcfda3025ae144d88953082a31',
            vout: 0,
            scriptSig: {
              asm:
                '304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd[ALL] 03422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729',
              hex:
                '48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729'
            },
            value: 0.11071465,
            valueSat: 11071465,
            address: 'mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP',
            sequence: 4294967295
          }
        ],
        vout: [
          {
            value: 0.10871747,
            valueSat: 10871747,
            n: 0,
            scriptPubKey: {
              asm: 'OP_DUP OP_HASH160 c1c6183f890d0e0c9bccfb823f640573f1d04986 OP_EQUALVERIFY OP_CHECKSIG',
              hex: '76a914c1c6183f890d0e0c9bccfb823f640573f1d0498688ac',
              reqSigs: 1,
              type: 'pubkeyhash'
            }
          },
          {
            value: 0.000857,
            valueSat: 85700,
            n: 1,
            scriptPubKey: {
              asm: 'OP_DUP OP_HASH160 8728db57a62afd6054c90d85c3f610c1a81b9494 OP_EQUALVERIFY OP_CHECKSIG',
              hex: '76a9148728db57a62afd6054c90d85c3f610c1a81b949488ac',
              reqSigs: 1,
              type: 'pubkeyhash'
            }
          }
        ],
        blockhash: '000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711',
        height: 1568589,
        confirmations: 143,
        time: 1562872879,
        blocktime: 1562872879
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getTransactionDataAsync(txId, true)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('txId')
        .and.to.equal(txId)
      expect(result)
        .to.have.property('version')
        .and.to.equal(1)
      expect(result)
        .to.have.property('blockHash')
        .and.to.equal('000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711')
      expect(result)
        .to.have.property('confirmations')
        .and.to.equal(143)
      expect(result)
        .to.have.property('time')
        .and.to.equal(1562872879)
      expect(result)
        .to.have.property('blockTime')
        .and.to.equal(1562872879)
      expect(result)
        .to.have.property('size')
        .and.to.equal(226)
      expect(result)
        .to.have.property('valueIn')
        .and.to.equal(0.11071465)
      expect(result)
        .to.have.property('valueOut')
        .and.to.equal(0.10957447)
      expect(result)
        .to.have.property('fees')
        .and.to.equal(0.00114018)
      expect(result)
        .to.have.property('anchorValue')
        .and.to.equal(null)
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('json-rpc')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response.result)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal(uri)
    })
  })

  describe('getBlockDataAsync with bad auth', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 401 }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getBlockDataAsync('badhash')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid credentials')
    })
  })

  describe('getBlockDataAsync with badhash', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async opts => {
        let method = JSON.parse(opts.body).method
        if (method === 'getblock') throw { statusCode: 400, error: JSON.stringify({ error: 'badheight!' }) }
        return ''
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getBlockDataAsync('badhash')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 400 : badheight!')
    })
  })

  describe('getBlockDataAsync with timeout', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async opts => {
        let method = JSON.parse(opts.body).method
        if (method === 'getblock') throw new Error('timeout!')
        return ''
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getBlockDataAsync('badhash')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No response received on getBlockDataAsync : timeout!')
    })
  })

  describe('getBlockDataAsync with bad height', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async opts => {
        let method = JSON.parse(opts.body).method
        if (method === 'getblockhash') throw { statusCode: 400, error: JSON.stringify({ error: 'badheight!' }) }
        return ''
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getBlockDataAsync(-34535)
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 400 : badheight!')
    })
  })

  describe('getBlockDataAsync with valid parameters', () => {
    let height = 1568576
    let response = {
      result: {
        hash: '000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b',
        confirmations: 177,
        size: 5280,
        height: 1568576,
        version: 536870912,
        merkleroot: '2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f',
        tx: [
          '021e628346e515b5a1165f1b93a288baa1c42475706f2a7fa82cc8769538bbe9',
          '3198ad70ea6b5e600884e3e679db104cf0e273dc619fef833d05a730b07f95e7',
          '24cdb01e2548ded723eb00f2b899d292035533ed332e738d6b1a712d4772bf4c',
          '0d6a404897b6fb5b1fab0f50dba67fa638fd7b34fcbab13515c3f7242c43e6a1',
          'bdb4026dd84d9f3bfabc15af099cab00a557389c8da6a4f001c3268937a6356c',
          '4a98cdd9e7f36c545a3a961ec92e55e1d4e3bd996451096643355e114547ca4e',
          '710c77a2cae3179063ec42ab4217ffd58b4c13e336459e0580bea67ecbd4e0b3',
          '05950aff8b70f91d3b83afc6b4409ac97209bf2e676ae441f264f7fdd4ea3322',
          '329d8e62d78fa92cbe92972010cd7391c27ebab5172718756162b9c1586b70c0',
          '8cb81f88d8c0a32a83f48bcca5be2595898ae9c05f4d1021067800a61853cd43',
          '048e55a56ab0a95adbd7b1e567bce3ebc50878c5e8d3c328e96a347c4bcb1c67',
          'dbff5287137ab802e6285f41ec88ba63bd7b0063ec9ddb13f20982bbea7a1fae',
          'c9e1d03f2405321d78c524e8fdecee284c54a65069e1234474300dce86856d3a',
          '01c5d536cc38534e0aa34f1612dab7e595f0d260146c6539469f57de8b79006f',
          '934c7c93ba7849f208620715b1cd97cfb4b91464e3e85263e07a9c0a67149de3',
          'b3ec73c403f8af48fe00b11f43b4f5ef4d8b90d8e16cbaad730b78e2ee59066c',
          'fa89a1cfb3dfe2b9c02dfdb22c75bc9e398108f2208ee24c019bab4f3ef9651e'
        ],
        time: 1562868333,
        mediantime: 1562866368,
        nonce: 2653842311,
        bits: '1a038c14',
        difficulty: 4729661.074040298,
        chainwork: '00000000000000000000000000000000000000000000011e94693e445796447e',
        previousblockhash: '00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b',
        nextblockhash: '000000000000021be5cd4b2153f7016b8086d92c38ad96bf73eac21ae3c5f270'
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async opts => {
        let method = JSON.parse(opts.body).method
        if (method === 'getblockhash')
          return {
            body: JSON.stringify({ result: '000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b' })
          }
        if (method === 'getblock') return { body: JSON.stringify(response) }
        return ''
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getBlockDataAsync(height)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('hash')
        .and.to.equal('000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b')
      expect(result)
        .to.have.property('height')
        .and.to.equal(height)
      expect(result)
        .to.have.property('size')
        .and.to.equal(5280)
      expect(result)
        .to.have.property('version')
        .and.to.equal(536870912)
      expect(result)
        .to.have.property('confirmations')
        .and.to.equal(177)
      expect(result)
        .to.have.property('merkleRoot')
        .and.to.equal('2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f')
      expect(result)
        .to.have.property('nTx')
        .and.to.equal(17)
      expect(result)
        .to.have.property('tx')
        .and.to.be.a('array')
        .and.to.deep.equal(response.result.tx)
      expect(result)
        .to.have.property('previousBlockHash')
        .and.to.equal('00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b')
      expect(result)
        .to.have.property('time')
        .and.to.equal(1562868333)
      expect(result)
        .to.have.property('nonce')
        .and.to.equal(2653842311)
      expect(result)
        .to.have.property('difficulty')
        .and.to.equal(4729661.074040298)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getBlockDataAsync with valid parameters and raw result', () => {
    let height = 1568576
    let response = {
      result: {
        hash: '000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b',
        confirmations: 177,
        size: 5280,
        height: 1568576,
        version: 536870912,
        merkleroot: '2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f',
        tx: [
          '021e628346e515b5a1165f1b93a288baa1c42475706f2a7fa82cc8769538bbe9',
          '3198ad70ea6b5e600884e3e679db104cf0e273dc619fef833d05a730b07f95e7',
          '24cdb01e2548ded723eb00f2b899d292035533ed332e738d6b1a712d4772bf4c',
          '0d6a404897b6fb5b1fab0f50dba67fa638fd7b34fcbab13515c3f7242c43e6a1',
          'bdb4026dd84d9f3bfabc15af099cab00a557389c8da6a4f001c3268937a6356c',
          '4a98cdd9e7f36c545a3a961ec92e55e1d4e3bd996451096643355e114547ca4e',
          '710c77a2cae3179063ec42ab4217ffd58b4c13e336459e0580bea67ecbd4e0b3',
          '05950aff8b70f91d3b83afc6b4409ac97209bf2e676ae441f264f7fdd4ea3322',
          '329d8e62d78fa92cbe92972010cd7391c27ebab5172718756162b9c1586b70c0',
          '8cb81f88d8c0a32a83f48bcca5be2595898ae9c05f4d1021067800a61853cd43',
          '048e55a56ab0a95adbd7b1e567bce3ebc50878c5e8d3c328e96a347c4bcb1c67',
          'dbff5287137ab802e6285f41ec88ba63bd7b0063ec9ddb13f20982bbea7a1fae',
          'c9e1d03f2405321d78c524e8fdecee284c54a65069e1234474300dce86856d3a',
          '01c5d536cc38534e0aa34f1612dab7e595f0d260146c6539469f57de8b79006f',
          '934c7c93ba7849f208620715b1cd97cfb4b91464e3e85263e07a9c0a67149de3',
          'b3ec73c403f8af48fe00b11f43b4f5ef4d8b90d8e16cbaad730b78e2ee59066c',
          'fa89a1cfb3dfe2b9c02dfdb22c75bc9e398108f2208ee24c019bab4f3ef9651e'
        ],
        time: 1562868333,
        mediantime: 1562866368,
        nonce: 2653842311,
        bits: '1a038c14',
        difficulty: 4729661.074040298,
        chainwork: '00000000000000000000000000000000000000000000011e94693e445796447e',
        previousblockhash: '00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b',
        nextblockhash: '000000000000021be5cd4b2153f7016b8086d92c38ad96bf73eac21ae3c5f270'
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async opts => {
        let method = JSON.parse(opts.body).method
        if (method === 'getblockhash')
          return {
            body: JSON.stringify({ result: '000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b' })
          }
        if (method === 'getblock') return { body: JSON.stringify(response) }
        return ''
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getBlockDataAsync(height, true)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('hash')
        .and.to.equal('000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b')
      expect(result)
        .to.have.property('height')
        .and.to.equal(height)
      expect(result)
        .to.have.property('size')
        .and.to.equal(5280)
      expect(result)
        .to.have.property('version')
        .and.to.equal(536870912)
      expect(result)
        .to.have.property('confirmations')
        .and.to.equal(177)
      expect(result)
        .to.have.property('merkleRoot')
        .and.to.equal('2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f')
      expect(result)
        .to.have.property('nTx')
        .and.to.equal(17)
      expect(result)
        .to.have.property('tx')
        .and.to.be.a('array')
        .and.to.deep.equal(response.result.tx)
      expect(result)
        .to.have.property('previousBlockHash')
        .and.to.equal('00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b')
      expect(result)
        .to.have.property('time')
        .and.to.equal(1562868333)
      expect(result)
        .to.have.property('nonce')
        .and.to.equal(2653842311)
      expect(result)
        .to.have.property('difficulty')
        .and.to.equal(4729661.074040298)
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('json-rpc')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response.result)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal(uri)
    })
  })

  describe('getEstimatedFeeAsync with bad auth', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 401 }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getEstimatedFeeAsync(1)
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid credentials')
    })
  })

  describe('getEstimatedFeeAsync with server error', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw { statusCode: 500, error: JSON.stringify({ error: 'error!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getEstimatedFeeAsync(1)
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 500 : error!')
    })
  })

  describe('getEstimatedFeeAsync with timeout', () => {
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let err = null
      try {
        await bc.getEstimatedFeeAsync(1)
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No response received on getEstimatedFeeAsync : timeout!')
    })
  })

  describe('getEstimatedFeeAsync for 1 block', () => {
    let feerate = 0.0002515
    let response = {
      result: {
        feerate: feerate
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getEstimatedFeeAsync(1)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('feerate')
        .and.to.equal(feerate)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getEstimatedFeeAsync for 25 blocks with raw', () => {
    let feerate = 0.0001115
    let response = {
      result: {
        feerate: feerate
      }
    }
    before(() => {
      btcBridge.providers.JsonRpcProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.JsonRpcProvider(uri)
      let result = await bc.getEstimatedFeeAsync(1, true)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('feerate')
        .and.to.equal(feerate)
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('json-rpc')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response.result)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal(uri)
    })
  })
})
