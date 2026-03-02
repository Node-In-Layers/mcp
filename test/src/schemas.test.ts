import { assert } from 'chai'
import { describe, it } from 'mocha'
import {
  crossLayerPropsSchema,
  executeFeatureSchema,
  executeModelSchema,
  executeFunctionSchema,
  jsonAbleSchema,
  jsonObjSchema,
  modelBulkDeleteSchema,
  modelBulkInsertSchema,
  modelDeleteSchema,
  modelRetrieveSchema,
  modelSaveSchema,
  modelSearchSchema,
  searchSchema,
} from '../../src/schemas.js'
import z from 'zod'
import {
  DatastoreValueType,
  EqualitySymbol,
  queryBuilder,
  SortOrder,
} from 'functional-models'

describe('/src/schemas.ts', () => {
  describe('#executeFeatureSchema()', () => {
    it('should create a schema with the correct structure', () => {
      const argsSchema = z.object({ foo: z.string() })
      const schema = executeFeatureSchema(argsSchema)
      const input = {
        toolName: 'execute_feature',
        domain: 'd',
        featureName: 'f',
        args: { foo: 'bar' },
      }
      const parsed = schema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#executeFunctionSchema()', () => {
    it('should parse valid function data', () => {
      const input = {
        toolName: 'my_func',
        functionName: 'my_func',
        args: { a: 1 },
      }
      const parsed = executeFunctionSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#executeModelSchema()', () => {
    it('should parse valid model save data', () => {
      const input = {
        toolName: 'model_save',
        action: 'save',
        domain: 'd',
        modelName: 'm',
        args: {
          modelType: 'd.m',
          instance: { id: '1' },
        },
      }
      const parsed = executeModelSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#jsonAbleSchema()', () => {
    it('should parse deeply nested JSON-able structures', () => {
      const input = {
        str: 'foo',
        num: 42,
        bool: true,
        nil: null,
        undef: undefined,
        arr: ['a', 1, false, null, { nested: 'value' }],
        obj: {
          inner: {
            another: 'field',
          },
        },
      }

      const parsed = jsonAbleSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#jsonObjSchema()', () => {
    it('should parse a JsonObj record', () => {
      const input = {
        id: '1',
        count: 10,
        active: true,
        meta: { nested: 'ok' },
      }

      const parsed = jsonObjSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#modelBulkInsertSchema()', () => {
    it('should parse modelBulkInsertSchema', () => {
      const input = {
        modelType: 'inventory.Product',
        items: [
          { id: '1', name: 'Widget' },
          { id: '2', name: 'Gadget' },
        ],
      }

      const parsed = modelBulkInsertSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#modelRetrieveSchema()', () => {
    it('should parse modelRetrieveSchema', () => {
      const input = {
        modelType: 'inventory.Product',
        id: '1',
      }

      const parsed = modelRetrieveSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#modelDeleteSchema()', () => {
    it('should parse modelDeleteSchema', () => {
      const input = {
        modelType: 'inventory.Product',
        id: '1',
      }

      const parsed = modelDeleteSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#modelBulkDeleteSchema()', () => {
    it('should parse modelBulkDeleteSchema', () => {
      const input = {
        modelType: 'inventory.Product',
        ids: ['1', '2', '3'],
      }

      const parsed = modelBulkDeleteSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#modelSaveSchema()', () => {
    it('should parse modelSaveSchema', () => {
      const input = {
        modelType: 'inventory.Product',
        instance: {
          id: '1',
          name: 'Widget',
        },
      }

      const parsed = modelSaveSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })

  describe('#searchSchema()', () => {
    it('should parse a rich search object', () => {
      const searchInput = queryBuilder()
        .property('name', 'Widget', {
          type: DatastoreValueType.string,
          equalitySymbol: EqualitySymbol.eq,
        })
        .take(10)
        .sort('createdAt', SortOrder.asc)
        .pagination({ cursor: 'abc' })
        .compile()

      const parsedSearch = searchSchema.parse(searchInput)
      assert.deepEqual(parsedSearch, searchInput)
    })
  })

  describe('#modelSearchSchema()', () => {
    it('should parse a rich model search object', () => {
      const searchInput = queryBuilder()
        .property('name', 'Widget', {
          type: DatastoreValueType.string,
          equalitySymbol: EqualitySymbol.eq,
        })
        .take(10)
        .sort('createdAt', SortOrder.asc)
        .pagination({ cursor: 'abc' })
        .compile()

      const modelSearchInput = {
        modelType: 'inventory.Product',
        search: searchInput,
      }

      const parsedModelSearch = modelSearchSchema.parse(modelSearchInput)
      assert.deepEqual(parsedModelSearch, modelSearchInput)
    })
  })

  describe('#crossLayerPropsSchema()', () => {
    it('should allow optional logging ids array', () => {
      const input = {
        logging: {
          ids: [{ traceId: 'abc' }, { spanId: 'def' }],
          extra: 'value',
        },
      }

      const parsed = crossLayerPropsSchema.parse(input)
      assert.deepEqual(parsed, input)
    })
  })
})
