/* global describe, it, before */

process.env.NODE_ENV = 'test'

// test related packages
const expect = require('chai').expect

const btcBridge = require('../src/index')
const Fallback = require('../src/providers/fallback')
const networks = require('../src/networks')

describe('Fallback Provider', () => {
  describe('Init with non array data', () => {
    it('should return the proper error', async () => {
      let err = null
      try {
        new btcBridge.providers.FallbackProvider('nonarray')
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No providers array specified for fallback provider')
    })
  })
  describe('Init with empty array data', () => {
    it('should return the proper error', async () => {
      let err = null
      try {
        new btcBridge.providers.FallbackProvider([])
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('No providers array specified for fallback provider')
    })
  })
  describe('Init with bad object only', () => {
    it('should return the proper error', async () => {
      let badObj = { 1: 1 }
      let err = null
      try {
        new btcBridge.providers.FallbackProvider([badObj])
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid provider specified at index 0 for fallback provider')
    })
  })
  describe('Init with good and bad object', () => {
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET, 'key')
      let badObj = { 1: 1 }
      let err = null
      try {
        new btcBridge.providers.FallbackProvider([bc, badObj])
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Invalid provider specified at index 1 for fallback provider')
    })
  })
  describe('Init with different network objects', () => {
    it('should return the proper error', async () => {
      let bc = new btcBridge.providers.BlockcypherProvider(networks.TESTNET, 'key')
      let bc2 = new btcBridge.providers.BlockcypherProvider(networks.MAINNET, 'key')
      let err = null
      try {
        new btcBridge.providers.FallbackProvider([bc, bc2])
      } catch (error) {
        err = error.message
      }
      expect(err).to.equal('Providers must all be configured to use the same network within the fallback provider')
    })
  })
  describe('Init with good objects, shuffle disabled', () => {
    let rpc = function(name) {
      this.id = name
      this.getNetwork = () => networks.MAINNET
      this.getUnspentOutputsAsync = () => {
        throw new Error(this.id)
      }
    }
    before(() => {
      Fallback.setRPC(rpc)
    })
    let rpc1 = new rpc('a')
    let rpc2 = new rpc('b')
    let rpc3 = new rpc('c')
    it('should use objects in expected order', async () => {
      let fb = new btcBridge.providers.FallbackProvider([rpc1, rpc2, rpc3], false)
      for (let x = 0; x < 100; x++) {
        let expectedResult = [{ error: 'a' }, { error: 'b' }, { error: 'c' }]
        try {
          await fb.getUnspentOutputsAsync()
        } catch (error) {
          expect(JSON.parse(error.message)).to.deep.equal(expectedResult)
        }
      }
    })
  })
  describe('Init with good objects, shuffle enabled', () => {
    let rpc = function(name) {
      this.id = name
      this.getNetwork = () => networks.MAINNET
      this.getUnspentOutputsAsync = () => {
        throw new Error(this.id)
      }
    }
    before(() => {
      Fallback.setRPC(rpc)
    })
    let rpc1 = new rpc('a')
    let rpc2 = new rpc('b')
    let rpc3 = new rpc('c')
    it('should use objects in random order', async () => {
      let fb = new btcBridge.providers.FallbackProvider([rpc1, rpc2, rpc3], true)
      let aStarts = 0
      for (let x = 0; x < 100; x++) {
        try {
          await fb.getUnspentOutputsAsync()
        } catch (error) {
          if (JSON.parse(error.message)[0].error === 'a') aStarts++
        }
      }
      expect(aStarts).to.be.greaterThan(0)
      expect(aStarts).to.be.lessThan(100)
    })
  })
})
