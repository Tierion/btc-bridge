/* global describe, it, before */

process.env.NODE_ENV = 'test'

// test related packages
const expect = require('chai').expect

const btcBridge = require('../src/index')
const networks = require('../src/networks')

describe('Blockcypher Provider', () => {
  describe('Provider with bad network', () => {
    it('should return the proper error', async () => {
      let err = ''
      try {
        new btcBridge.providers.BlockcypherProvider('badnetwork')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid network')
    })
  })

  describe('getUnspentOutputsAsync with badaddress', () => {
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'badaddress!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      address: address,
      total_received: 10871747,
      total_sent: 0,
      balance: 10871747,
      unconfirmed_balance: 0,
      final_balance: 10871747,
      n_tx: 1,
      unconfirmed_n_tx: 0,
      final_n_tx: 1,
      txrefs: [
        {
          tx_hash: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
          block_height: 1568589,
          tx_input_n: -1,
          tx_output_n: 0,
          value: 10871747,
          ref_balance: 10871747,
          spent: false,
          confirmations: 140,
          confirmed: '2019-07-11T19:21:19Z',
          double_spend: false
        }
      ],
      tx_url: 'https://api.blockcypher.com/v1/btc/test3/txs/'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      address: address,
      total_received: 10871747,
      total_sent: 0,
      balance: 10871747,
      unconfirmed_balance: 0,
      final_balance: 10871747,
      n_tx: 1,
      unconfirmed_n_tx: 0,
      final_n_tx: 1,
      txrefs: [
        {
          tx_hash: 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f',
          block_height: 1568589,
          tx_input_n: -1,
          tx_output_n: 0,
          value: 10871747,
          ref_balance: 10871747,
          spent: false,
          confirmations: 140,
          confirmed: '2019-07-11T19:21:19Z',
          double_spend: false
        }
      ],
      tx_url: 'https://api.blockcypher.com/v1/btc/test3/txs/'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
        .and.to.equal('blockcypher')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal('https://api.blockcypher.com/v1')
    })
  })

  describe('broadcastTransactionAsync with bad hex', () => {
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'error!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      tx: {
        block_height: -1,
        hash: '4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50',
        addresses: ['CEztKBAYNoUEEaPYbkyFeXC5v8Jz9RoZH9', 'C1rGdt7QEPGiwPMFhNKNhHmyoWpa5X92pn'],
        total: 4988000,
        fees: 12000,
        size: 226,
        preference: 'high',
        relayed_by: '73.162.198.68',
        received: '2015-05-22T05:10:00.305308666Z',
        ver: 1,
        lock_time: 0,
        double_spend: false,
        vin_sz: 1,
        vout_sz: 2,
        confirmations: 0,
        inputs: [
          {
            prev_hash: 'c8ea8b221580ebb2f1cabc8b40797bffec742b97c82a329df96d93121db43519',
            output_index: 0,
            script:
              '483045022100921fc36b911094280f07d8504a80fbab9b823a25f102e2bc69b14bcd369dfc7902200d07067d47f040e724b556e5bc3061af132d5a47bd96e901429d53c41e0f8cca012102152e2bb5b273561ece7bbe8b1df51a4c44f5ab0bc940c105045e2cc77e618044',
            output_value: 5000000,
            sequence: 4294967295,
            addresses: ['CEztKBAYNoUEEaPYbkyFeXC5v8Jz9RoZH9'],
            script_type: 'pay-to-pubkey-hash',
            age: 576
          }
        ],
        outputs: [
          {
            value: 1000000,
            script: '76a9145fb1af31edd2aa5a2bbaa24f6043d6ec31f7e63288ac',
            addresses: ['C1rGdt7QEPGiwPMFhNKNhHmyoWpa5X92pn'],
            script_type: 'pay-to-pubkey-hash'
          },
          {
            value: 3988000,
            script: '76a914efec6de6c253e657a9d5506a78ee48d89762fb3188ac',
            addresses: ['CEztKBAYNoUEEaPYbkyFeXC5v8Jz9RoZH9'],
            script_type: 'pay-to-pubkey-hash'
          }
        ]
      }
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      tx: {
        block_height: -1,
        hash: '4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50',
        addresses: ['CEztKBAYNoUEEaPYbkyFeXC5v8Jz9RoZH9', 'C1rGdt7QEPGiwPMFhNKNhHmyoWpa5X92pn'],
        total: 4988000,
        fees: 12000,
        size: 226,
        preference: 'high',
        relayed_by: '73.162.198.68',
        received: '2015-05-22T05:10:00.305308666Z',
        ver: 1,
        lock_time: 0,
        double_spend: false,
        vin_sz: 1,
        vout_sz: 2,
        confirmations: 0,
        inputs: [
          {
            prev_hash: 'c8ea8b221580ebb2f1cabc8b40797bffec742b97c82a329df96d93121db43519',
            output_index: 0,
            script:
              '483045022100921fc36b911094280f07d8504a80fbab9b823a25f102e2bc69b14bcd369dfc7902200d07067d47f040e724b556e5bc3061af132d5a47bd96e901429d53c41e0f8cca012102152e2bb5b273561ece7bbe8b1df51a4c44f5ab0bc940c105045e2cc77e618044',
            output_value: 5000000,
            sequence: 4294967295,
            addresses: ['CEztKBAYNoUEEaPYbkyFeXC5v8Jz9RoZH9'],
            script_type: 'pay-to-pubkey-hash',
            age: 576
          }
        ],
        outputs: [
          {
            value: 1000000,
            script: '76a9145fb1af31edd2aa5a2bbaa24f6043d6ec31f7e63288ac',
            addresses: ['C1rGdt7QEPGiwPMFhNKNhHmyoWpa5X92pn'],
            script_type: 'pay-to-pubkey-hash'
          },
          {
            value: 3988000,
            script: '76a914efec6de6c253e657a9d5506a78ee48d89762fb3188ac',
            addresses: ['CEztKBAYNoUEEaPYbkyFeXC5v8Jz9RoZH9'],
            script_type: 'pay-to-pubkey-hash'
          }
        ]
      }
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let result = await bc.broadcastTransactionAsync(tx, 1)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('txId')
        .and.to.equal('4e6dfb1415b4fba5bd257c129847c70fbd4e45e41828079c4a282680528f3a50')
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('blockcypher')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal('https://api.blockcypher.com/v1')
    })
  })

  describe('getTransactionDataAsync with badid', () => {
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'badid!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      block_hash: '000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711',
      block_height: 1568589,
      block_index: 3,
      hash: txId,
      addresses: [
        'msqcTjPzBGQ11GvDE8abaYLE9JrKMykan7',
        'myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2',
        'mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP'
      ],
      total: 10957447,
      fees: 114018,
      size: 226,
      preference: 'high',
      relayed_by: '206.189.122.4:18333',
      confirmed: '2019-07-11T19:21:19Z',
      received: '2019-07-11T19:14:44.697Z',
      ver: 1,
      double_spend: false,
      vin_sz: 1,
      vout_sz: 2,
      confirmations: 143,
      confidence: 1,
      inputs: [
        {
          prev_hash: 'dd2efe5e27e890c05163bfc38138b2991bb6ffdcfda3025ae144d88953082a31',
          output_index: 0,
          script:
            '48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729',
          output_value: 11071465,
          sequence: 4294967295,
          addresses: ['mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP'],
          script_type: 'pay-to-pubkey-hash',
          age: 1568577
        }
      ],
      outputs: [
        {
          value: 10871747,
          script: '76a914c1c6183f890d0e0c9bccfb823f640573f1d0498688ac',
          addresses: ['myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2'],
          script_type: 'pay-to-pubkey-hash'
        },
        {
          value: 85700,
          script: '76a9148728db57a62afd6054c90d85c3f610c1a81b949488ac',
          addresses: ['msqcTjPzBGQ11GvDE8abaYLE9JrKMykan7'],
          script_type: 'pay-to-pubkey-hash'
        }
      ]
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
        .and.to.equal(1562872484)
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
        .to.have.property('opReturnValue')
        .and.to.equal(null)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getTransactionDataAsync with valid parameters with anchor', () => {
    let txId = 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f'
    let response = {
      block_hash: '000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711',
      block_height: 1568589,
      block_index: 3,
      hash: txId,
      addresses: [
        'msqcTjPzBGQ11GvDE8abaYLE9JrKMykan7',
        'myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2',
        'mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP'
      ],
      total: 10957447,
      fees: 114018,
      size: 226,
      preference: 'high',
      relayed_by: '206.189.122.4:18333',
      confirmed: '2019-07-11T19:21:19Z',
      received: '2019-07-11T19:14:44.697Z',
      ver: 1,
      double_spend: false,
      vin_sz: 1,
      vout_sz: 2,
      confirmations: 143,
      confidence: 1,
      inputs: [
        {
          prev_hash: 'dd2efe5e27e890c05163bfc38138b2991bb6ffdcfda3025ae144d88953082a31',
          output_index: 0,
          script:
            '48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729',
          output_value: 11071465,
          sequence: 4294967295,
          addresses: ['mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP'],
          script_type: 'pay-to-pubkey-hash',
          age: 1568577
        }
      ],
      outputs: [
        {
          value: 10871747,
          script: '76a914c1c6183f890d0e0c9bccfb823f640573f1d0498688ac',
          addresses: ['myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2'],
          script_type: 'pay-to-pubkey-hash'
        },
        {
          value: 85700,
          script: '76a9148728db57a62afd6054c90d85c3f610c1a81b949488ac',
          addresses: ['msqcTjPzBGQ11GvDE8abaYLE9JrKMykan7'],
          script_type: 'null-data',
          data_hex: 'aaaa811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f'
        }
      ]
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
        .and.to.equal(1562872484)
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
        .to.have.property('opReturnValue')
        .and.to.equal('aaaa811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f')
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getTransactionDataAsync with valid parameters and raw result', () => {
    let txId = 'dc47811b98799ac5b7dd244dc672aa18d428f9715db47eb2435b5314f5cce05f'
    let response = {
      block_hash: '000000000000016dfa9427f823d94a53bb14591cbca2598dfb7729b7349e3711',
      block_height: 1568589,
      block_index: 3,
      hash: txId,
      addresses: [
        'msqcTjPzBGQ11GvDE8abaYLE9JrKMykan7',
        'myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2',
        'mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP'
      ],
      total: 10957447,
      fees: 114018,
      size: 226,
      preference: 'high',
      relayed_by: '206.189.122.4:18333',
      confirmed: '2019-07-11T19:21:19Z',
      received: '2019-07-11T19:14:44.697Z',
      ver: 1,
      double_spend: false,
      vin_sz: 1,
      vout_sz: 2,
      confirmations: 143,
      confidence: 1,
      inputs: [
        {
          prev_hash: 'dd2efe5e27e890c05163bfc38138b2991bb6ffdcfda3025ae144d88953082a31',
          output_index: 0,
          script:
            '48304502210096f45223e120e14a7eae6fc47d9f7982799c03a84c9d00e0306235220b292bb9022025c467a01c6a31ddddeefba6bfecaf0ab3a415c3f2690176adceb06e6bdeb9cd012103422dd29f121ef4e74234823126777a566c00112f53344bc86ccaed19cac7f729',
          output_value: 11071465,
          sequence: 4294967295,
          addresses: ['mzeFXu7NV6NLMpawqnvP4jU12RqQLFb5cP'],
          script_type: 'pay-to-pubkey-hash',
          age: 1568577
        }
      ],
      outputs: [
        {
          value: 10871747,
          script: '76a914c1c6183f890d0e0c9bccfb823f640573f1d0498688ac',
          addresses: ['myBY1wTPxRgnNZDXESfJpyAyqNDLAKH8K2'],
          script_type: 'pay-to-pubkey-hash'
        },
        {
          value: 85700,
          script: '76a9148728db57a62afd6054c90d85c3f610c1a81b949488ac',
          addresses: ['msqcTjPzBGQ11GvDE8abaYLE9JrKMykan7'],
          script_type: 'pay-to-pubkey-hash'
        }
      ]
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
        .and.to.equal(1562872484)
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
        .to.have.property('opReturnValue')
        .and.to.equal(null)
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('blockcypher')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal('https://api.blockcypher.com/v1')
    })
  })

  describe('getBlockDataAsync with badhash', () => {
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw { statusCode: 400, error: JSON.stringify({ error: 'badhash!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let err = null
      try {
        await bc.getBlockDataAsync('badhash')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid response : 400 : badhash!')
    })
  })

  describe('getBlockDataAsync with timeout', () => {
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let err = null
      try {
        await bc.getBlockDataAsync('badhash')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No response received on getBlockDataAsync : timeout!')
    })
  })

  describe('getBlockDataAsync with valid parameters', () => {
    let height = 1568576
    let response = {
      hash: '000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b',
      height: height,
      chain: 'BTC.test3',
      total: 243344881,
      fees: 405770,
      size: 5280,
      ver: 536870912,
      time: '2019-07-11T18:05:33Z',
      received_time: '2019-07-11T18:05:33Z',
      coinbase_addr: '',
      relayed_by: '54.210.67.188:18333',
      bits: 436440084,
      nonce: 2653842311,
      n_tx: 17,
      prev_block: '00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b',
      mrkl_root: '2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f',
      txids: [
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
      depth: 157,
      prev_block_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b',
      tx_url: 'https://api.blockcypher.com/v1/btc/test3/txs/'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
        .and.to.equal(158)
      expect(result)
        .to.have.property('merkleRoot')
        .and.to.equal('2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f')
      expect(result)
        .to.have.property('nTx')
        .and.to.equal(17)
      expect(result)
        .to.have.property('tx')
        .and.to.be.a('array')
        .and.to.deep.equal(response.txids)
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
      hash: '000000000000028e9f63d521a3ffeb12fd912798a1e8fb656c9105a16e9db46b',
      height: height,
      chain: 'BTC.test3',
      total: 243344881,
      fees: 405770,
      size: 5280,
      ver: 536870912,
      time: '2019-07-11T18:05:33Z',
      received_time: '2019-07-11T18:05:33Z',
      coinbase_addr: '',
      relayed_by: '54.210.67.188:18333',
      bits: 436440084,
      nonce: 2653842311,
      n_tx: 17,
      prev_block: '00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b',
      mrkl_root: '2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f',
      txids: [
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
      depth: 157,
      prev_block_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000002b31eabc6170bd3dd970e7e4dd4098e4b628fea4f1af8ad082b',
      tx_url: 'https://api.blockcypher.com/v1/btc/test3/txs/'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
        .and.to.equal(158)
      expect(result)
        .to.have.property('merkleRoot')
        .and.to.equal('2175455effaab39c1588746aa2208005f89833548267628686d240beb85a4d7f')
      expect(result)
        .to.have.property('nTx')
        .and.to.equal(17)
      expect(result)
        .to.have.property('tx')
        .and.to.be.a('array')
        .and.to.deep.equal(response.txids)
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
        .and.to.equal('blockcypher')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal('https://api.blockcypher.com/v1')
    })
  })

  describe('getEstimatedFeeAsync with server error', () => {
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw { statusCode: 500, error: JSON.stringify({ error: 'error!' }) }
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        throw new Error('timeout!')
      })
    })
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
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
    let response = {
      name: 'BTC.test3',
      height: 1568733,
      hash: '00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      time: '2019-07-12T14:34:45.580940789Z',
      latest_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      previous_hash: '00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      previous_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      peer_count: 284,
      unconfirmed_count: 96,
      high_fee_per_kb: 49600,
      medium_fee_per_kb: 25000,
      low_fee_per_kb: 15000,
      last_fork_height: 1568255,
      last_fork_hash: '00000000000112353966f5c8324679bd1d709818551df10ef443fbc92052d16b'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let result = await bc.getEstimatedFeeAsync(1)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('feerate')
        .and.to.equal(0.000496)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getEstimatedFeeAsync for 3 blocks', () => {
    let response = {
      name: 'BTC.test3',
      height: 1568733,
      hash: '00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      time: '2019-07-12T14:34:45.580940789Z',
      latest_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      previous_hash: '00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      previous_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      peer_count: 284,
      unconfirmed_count: 96,
      high_fee_per_kb: 49600,
      medium_fee_per_kb: 25000,
      low_fee_per_kb: 15000,
      last_fork_height: 1568255,
      last_fork_hash: '00000000000112353966f5c8324679bd1d709818551df10ef443fbc92052d16b'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let result = await bc.getEstimatedFeeAsync(3)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('feerate')
        .and.to.equal(0.00025)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getEstimatedFeeAsync for 25 blocks', () => {
    let response = {
      name: 'BTC.test3',
      height: 1568733,
      hash: '00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      time: '2019-07-12T14:34:45.580940789Z',
      latest_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      previous_hash: '00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      previous_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      peer_count: 284,
      unconfirmed_count: 96,
      high_fee_per_kb: 49600,
      medium_fee_per_kb: 25000,
      low_fee_per_kb: 15000,
      last_fork_height: 1568255,
      last_fork_hash: '00000000000112353966f5c8324679bd1d709818551df10ef443fbc92052d16b'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let result = await bc.getEstimatedFeeAsync(25)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('feerate')
        .and.to.equal(0.00015)
      expect(result).to.not.have.property('raw')
    })
  })

  describe('getEstimatedFeeAsync for 25 blocks with raw', () => {
    let response = {
      name: 'BTC.test3',
      height: 1568733,
      hash: '00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      time: '2019-07-12T14:34:45.580940789Z',
      latest_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000001dd0ae46f13b46e03d1197490cb93ab1cd1e3cc6b850e4b7fb9',
      previous_hash: '00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      previous_url:
        'https://api.blockcypher.com/v1/btc/test3/blocks/00000000000002e9d80dc60b292be747310c2cf9be166a320db3e814ad875356',
      peer_count: 284,
      unconfirmed_count: 96,
      high_fee_per_kb: 49600,
      medium_fee_per_kb: 25000,
      low_fee_per_kb: 15000,
      last_fork_height: 1568255,
      last_fork_hash: '00000000000112353966f5c8324679bd1d709818551df10ef443fbc92052d16b'
    }
    before(() => {
      btcBridge.providers.BlockcypherProvider.setRP(async () => {
        return { body: JSON.stringify(response) }
      })
    })
    it('should return the proper success result', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET)
      let result = await bc.getEstimatedFeeAsync(25, true)
      expect(result).to.be.a('object')
      expect(result)
        .to.have.property('feerate')
        .and.to.equal(0.00015)
      expect(result).to.have.property('raw')
      expect(result.raw)
        .to.have.property('provider')
        .and.to.equal('blockcypher')
      expect(result.raw)
        .to.have.property('result')
        .and.to.deep.equal(response)
      expect(result.raw)
        .to.have.property('uri')
        .and.to.equal('https://api.blockcypher.com/v1')
    })
  })
})
