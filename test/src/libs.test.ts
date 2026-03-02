import { assert } from 'chai'
import { describe, it } from 'mocha'
import {
  parseExecuteData,
  isExecuteFeatureData,
  isExecuteFunctionData,
  isExecuteModelData,
  isExecuteModelSave,
  isExecuteModelRetrieve,
  isExecuteModelDelete,
  isExecuteModelSearch,
  isExecuteModelBulkInsert,
  isExecuteModelBulkDelete,
  isZodError,
  convertZodErrorToErrorObject,
} from '../../src/libs.js'
import { ModelAction, ModelActionToolName } from '../../src/types.js'
import z from 'zod'

describe('/src/libs.ts', () => {
  describe('#parseExecuteData()', () => {
    it('should return undefined when body is not an object', () => {
      const input = null
      const actual = parseExecuteData(input)
      assert.isUndefined(actual)
    })

    it('should parse execute_feature calls with toolName and args', () => {
      const input = {
        toolName: 'execute_feature',
        args: {
          domain: 'users',
          featureName: 'createUser',
          foo: 'bar',
        },
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: 'execute_feature',
        domain: 'users',
        featureName: 'createUser',
        args: input.args,
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
      // @ts-ignore
      assert.isTrue(isExecuteFeatureData(actual))
    })

    it('should parse execute_feature calls using name and arguments aliases', () => {
      const input = {
        name: 'execute_feature',
        arguments: {
          domain: 'orders',
          featureName: 'listOrders',
        },
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: 'execute_feature',
        domain: 'orders',
        featureName: 'listOrders',
        // falls back to arguments when args is missing
        // @ts-ignore
        args: input.arguments,
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
      // @ts-ignore
      assert.isTrue(isExecuteFeatureData(actual))
    })

    it('should parse model save actions into ExecuteModelData', () => {
      const input = {
        toolName: ModelActionToolName.Save,
        args: {
          modelType: 'inventory.Product',
          instance: { id: '1' },
        },
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: ModelActionToolName.Save,
        action: ModelAction.Save,
        domain: 'inventory',
        modelName: 'Product',
        args: input.args,
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
      // @ts-ignore
      assert.isTrue(isExecuteModelData(actual))
      // @ts-ignore
      assert.isTrue(isExecuteModelSave(actual))
    })

    it('should parse model search actions using name alias', () => {
      const input = {
        name: ModelActionToolName.Search,
        arguments: {
          modelType: 'billing.Invoice',
          search: { query: [] },
        },
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: ModelActionToolName.Search,
        action: ModelAction.Search,
        domain: 'billing',
        modelName: 'Invoice',
        // @ts-ignore
        args: input.arguments,
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
      // @ts-ignore
      assert.isTrue(isExecuteModelData(actual))
      // @ts-ignore
      assert.isTrue(isExecuteModelSearch(actual))
    })

    it('should parse generic function execution when toolName is not a model or feature action', () => {
      const input = {
        toolName: 'custom_function',
        args: { foo: 'bar' },
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: 'custom_function',
        functionName: 'custom_function',
        args: input.args,
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
      // @ts-ignore
      assert.isTrue(isExecuteFunctionData(actual))
      // @ts-ignore
      assert.isFalse(isExecuteFeatureData(actual))
      // @ts-ignore
      assert.isFalse(isExecuteModelData(actual))
    })

    it('should return undefined when no toolName or name is provided', () => {
      const input = { args: { foo: 'bar' } }
      const actual = parseExecuteData(input)
      assert.isUndefined(actual)
    })

    it('should default to empty object when args and arguments are missing', () => {
      const input = {
        toolName: 'execute_feature',
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: 'execute_feature',
        domain: '',
        featureName: '',
        args: {},
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
    })

    it('should default domain and featureName to empty strings if missing', () => {
      const input = {
        toolName: 'execute_feature',
        args: {},
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: 'execute_feature',
        domain: '',
        featureName: '',
        args: {},
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
    })

    it('should throw ZodError when modelType is missing in model action', () => {
      const input = {
        toolName: ModelActionToolName.Save,
        args: {},
      }
      try {
        parseExecuteData(input)
        assert.fail('Should have thrown')
      } catch (e) {
        assert.instanceOf(e, z.ZodError)
      }
    })

    it('should handle modelType without dot separator', () => {
      const input = {
        toolName: ModelActionToolName.Save,
        args: {
          modelType: 'JustModel',
          instance: {},
        },
      }
      const actual = parseExecuteData(input)
      const expected = {
        toolName: ModelActionToolName.Save,
        action: ModelAction.Save,
        domain: 'JustModel',
        modelName: '',
        args: input.args,
      }
      // @ts-ignore
      assert.deepEqual(actual, expected)
    })
  })

  describe('Execute data type guards', () => {
    describe('#isExecuteFeatureData()', () => {
      it('should return true for execute_feature data', () => {
        const input = {
          toolName: 'execute_feature',
          domain: 'users',
          featureName: 'createUser',
          args: {},
        }
        const actual = isExecuteFeatureData(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false for non-execute_feature toolName', () => {
        const input = {
          toolName: ModelActionToolName.Save,
          domain: 'users',
          featureName: 'createUser',
          args: {},
        }
        const actual = isExecuteFeatureData(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteFunctionData()', () => {
      it('should return true when functionName is defined and toolName is not feature or model action', () => {
        const input = {
          toolName: 'custom_function',
          functionName: 'custom_function',
          args: {},
        }
        const actual = isExecuteFunctionData(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false for execute_feature even if functionName exists', () => {
        const input = {
          toolName: 'execute_feature',
          functionName: 'execute_feature',
          args: {},
        }
        const actual = isExecuteFunctionData(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })

      it('should return false for model action toolNames', () => {
        const input = {
          toolName: ModelActionToolName.Delete,
          functionName: 'model_delete',
          args: {},
        }
        const actual = isExecuteFunctionData(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelData()', () => {
      it('should return true for all model action toolNames', () => {
        const inputs = [
          { toolName: ModelActionToolName.Save },
          { toolName: ModelActionToolName.Retrieve },
          { toolName: ModelActionToolName.Delete },
          { toolName: ModelActionToolName.Search },
          { toolName: ModelActionToolName.BulkInsert },
          { toolName: ModelActionToolName.BulkDelete },
        ]

        inputs.forEach(input => {
          const actual = isExecuteModelData(input)
          const expected = true
          assert.strictEqual(actual, expected)
        })
      })

      it('should return false for non-model action toolNames', () => {
        const input = { toolName: 'custom_function' }
        const actual = isExecuteModelData(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelSave()', () => {
      it('should return true when action is save', () => {
        const input = {
          toolName: ModelActionToolName.Save,
          action: ModelAction.Save,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelSave(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false when action is not save', () => {
        const input = {
          toolName: ModelActionToolName.Delete,
          action: ModelAction.Delete,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelSave(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })

      it('should return false when not model data', () => {
        const input = {
          toolName: 'custom_function',
          action: ModelAction.Save,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelSave(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelRetrieve()', () => {
      it('should return true when action is retrieve', () => {
        const input = {
          toolName: ModelActionToolName.Retrieve,
          action: ModelAction.Retrieve,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelRetrieve(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false when not model data', () => {
        const input = {
          toolName: 'custom_function',
          action: ModelAction.Retrieve,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelRetrieve(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelDelete()', () => {
      it('should return true when action is delete', () => {
        const input = {
          toolName: ModelActionToolName.Delete,
          action: ModelAction.Delete,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelDelete(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false when action is not delete', () => {
        const input = {
          toolName: ModelActionToolName.Delete,
          action: ModelAction.Save,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelDelete(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })

      it('should return false when not model data', () => {
        const input = {
          toolName: 'custom_function',
          action: ModelAction.Delete,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelDelete(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelSearch()', () => {
      it('should return true when action is search', () => {
        const input = {
          toolName: ModelActionToolName.Search,
          action: ModelAction.Search,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelSearch(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false when toolName is not a model action', () => {
        const input = {
          toolName: 'custom_function',
          action: ModelAction.Search,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelSearch(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelBulkInsert()', () => {
      it('should return true when action is bulkInsert', () => {
        const input = {
          toolName: ModelActionToolName.BulkInsert,
          action: ModelAction.BulkInsert,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelBulkInsert(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false when not model data', () => {
        const input = {
          toolName: 'custom_function',
          action: ModelAction.BulkInsert,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelBulkInsert(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#isExecuteModelBulkDelete()', () => {
      it('should return true when action is bulkDelete', () => {
        const input = {
          toolName: ModelActionToolName.BulkDelete,
          action: ModelAction.BulkDelete,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelBulkDelete(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false when action is not bulkDelete', () => {
        const input = {
          toolName: ModelActionToolName.BulkDelete,
          action: ModelAction.BulkInsert,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelBulkDelete(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })

      it('should return false when not model data', () => {
        const input = {
          toolName: 'custom_function',
          action: ModelAction.BulkDelete,
          domain: 'inventory',
          modelName: 'Product',
          args: {},
        }
        const actual = isExecuteModelBulkDelete(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })
  })

  describe('Zod helpers', () => {
    describe('#isZodError()', () => {
      it('should return true for a ZodError', () => {
        const input = new z.ZodError([])
        const actual = isZodError(input)
        const expected = true
        assert.strictEqual(actual, expected)
      })

      it('should return false for a standard Error', () => {
        const input = new Error('test')
        const actual = isZodError(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })

      it('should return false for a plain object', () => {
        const input = { message: 'test' }
        const actual = isZodError(input)
        const expected = false
        assert.strictEqual(actual, expected)
      })
    })

    describe('#convertZodErrorToErrorObject()', () => {
      it('should convert a ZodError into an ErrorObject with issues', () => {
        const issue: z.ZodIssue = {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['user', 'name'],
          message: 'Expected string, received number',
        }
        const input = new z.ZodError([issue])
        const actual = convertZodErrorToErrorObject(input)

        assert.equal(actual.error.code, 'VALIDATION_ERROR')
        assert.equal(actual.error.message, 'A validation error occurred')
        assert.isDefined(actual.error.data)
        assert.isArray(actual.error.data!.issues)
        // @ts-ignore
        assert.lengthOf(actual.error.data!.issues, 1)
        // @ts-ignore
        assert.equal(actual.error.data!.issues[0].path, 'user.name')
        // @ts-ignore
        assert.equal(
          actual.error.data!.issues[0].message,
          'Expected string, received number'
        )
      })
    })
  })
})
