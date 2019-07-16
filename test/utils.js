/* global describe, it */

process.env.NODE_ENV = 'test'

// test related packages
const expect = require('chai').expect

const btcBridge = require('../src/index')

describe('Utils', () => {
  describe('bitsToDifficulty', () => {
    it('should return the correct result', async () => {
      let d1 = btcBridge.utils.bitsToDifficulty(388627269)
      let d2 = btcBridge.utils.bitsToDifficulty(402742748)
      let d3 = btcBridge.utils.bitsToDifficulty(403867578)
      expect(d1).to.equal(6704632680587.417)
      expect(d2).to.equal(804525194568.1318)
      expect(d3).to.equal(59335351233.86657)
    })
  })
})
