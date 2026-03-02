import { assert } from 'chai'

describe('/src/index.ts', () => {
  describe('#index', () => {
    it('should export the correct types and functions', async () => {
      const module = await import('../../src/index.js')
      assert.isOk(module)
    })
  })
})
