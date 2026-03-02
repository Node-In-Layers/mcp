import z from 'zod'
import {
  DatastoreValueType,
  EqualitySymbol,
  JsonAble,
  JsonObj,
  OrmSearch,
  SortOrder,
} from 'functional-models'
import {
  ModelAction,
  ModelActionToolName,
  ModelBulkDelete,
  ModelBulkInsert,
  ModelDelete,
  ModelRetrieve,
  ModelSave,
  ModelSearch,
} from './types.js'

export const crossLayerPropsSchema = z
  .object({
    logging: z
      .object({
        ids: z
          .array(
            z
              .record(z.string(), z.string())
              .describe(
                'Each of these are individual objects, that have a key:id pair. Example: "ids": [{"myId":"123"},{"anotherId":"456"}]'
              )
          )
          .optional(),
      })
      .loose()
      .optional(),
  })
  .loose()
  .describe(
    'CrossLayerProps is an optional argument you can send with NIL MCP tool calls to enable end-to-end tracing across layers (features/services) and across multiple tool invocations. It carries correlation ids that the system logs at each hop so you can stitch together a full execution story.'
  )

/**
 * Zod Schema for a JsonAble object.
 * @see https://monolithst.github.io/functional-models/modules/index.types.html#jsonable
 */
export const jsonAbleSchema = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined(),
    z.array(jsonAbleSchema),
    z.record(z.string(), jsonAbleSchema),
  ])
) as unknown as z.ZodType<JsonAble>

/**
 * Zod Schema for a JsonObj object.
 * @see https://monolithst.github.io/functional-models/modules/index.types.html#jsonobj
 */
export const jsonObjSchema: z.ZodType<JsonObj> = z.record(
  z.string(),
  jsonAbleSchema
)

/**
 * Zod Schema for a ModelBulkInsert object.
 * {@link ModelBulkInsert}
 */
export const modelBulkInsertSchema: z.ZodType<ModelBulkInsert> = z.object({
  modelType: z.string(),
  items: z.array(jsonObjSchema),
})

/**
 * Zod Schema for a ModelRetrieve object.
 * {@link ModelRetrieve}
 */
export const modelRetrieveSchema: z.ZodType<ModelRetrieve> = z.object({
  modelType: z.string(),
  id: z.string(),
})

/**
 * Zod Schema for a ModelDelete object.
 * {@link ModelDelete}
 */
export const modelDeleteSchema: z.ZodType<ModelDelete> = z.object({
  modelType: z.string(),
  id: z.string(),
})

/**
 * Zod Schema for a OrmSearch object.
 * @see https://monolithst.github.io/functional-models/modules/index.orm.html#ormsearch
 */
export const searchSchema: z.ZodType<OrmSearch> = z.object({
  take: z.number().int().optional(),
  sort: z
    .object({
      key: z.string(),
      order: z.enum(SortOrder),
    })
    .optional(),
  page: jsonAbleSchema.optional(),
  query: z
    .array(
      z.union([
        z.enum(['AND', 'OR']),
        z.object({
          type: z.literal('property'),
          key: z.string(),
          value: z.any(),
          valueType: z.enum(DatastoreValueType),
          equalitySymbol: z.enum(EqualitySymbol),
          options: z
            .object({
              caseSensitive: z.boolean().optional(),
              startsWith: z.boolean().optional(),
              endsWith: z.boolean().optional(),
            })
            .optional(),
        }),
        z.object({
          type: z.literal('datesAfter'),
          key: z.string(),
          date: z.string(),
          valueType: z.enum(DatastoreValueType),
          options: z
            .object({
              equalToAndAfter: z.boolean().optional(),
            })
            .optional(),
        }),
        z.object({
          type: z.literal('datesBefore'),
          key: z.string(),
          date: z.string(),
          valueType: z.enum(DatastoreValueType),
          options: z
            .object({
              equalToAndBefore: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
    )
    .optional(),
}) as unknown as z.ZodType<OrmSearch>

/**
 * Zod Schema for a ModelSearch object.
 * {@link ModelSearch}
 */
export const modelSearchSchema: z.ZodType<ModelSearch> = z.object({
  modelType: z.string(),
  search: searchSchema,
})

/**
 * Zod Schema for a ModelBulkDelete object.
 * {@link ModelBulkDelete}
 */
export const modelBulkDeleteSchema: z.ZodType<ModelBulkDelete> = z.object({
  modelType: z.string(),
  ids: z.array(z.string()),
})

/**
 * Zod Schema for a ModelSave object.
 * {@link ModelSave}
 */
export const modelSaveSchema: z.ZodType<ModelSave> = z.object({
  modelType: z.string(),
  instance: jsonObjSchema,
})

/**
 * Zod Schema for a ExecuteModelData object.
 * {@link ExecuteModelData}
 */
export const executeModelSchema = z.object({
  toolName: z.enum(ModelActionToolName),
  action: z.enum(ModelAction),
  domain: z.string(),
  modelName: z.string(),
  args: z.xor([
    modelBulkInsertSchema,
    modelRetrieveSchema,
    modelDeleteSchema,
    modelSearchSchema,
    modelBulkDeleteSchema,
    modelSaveSchema,
  ]),
  crossLayerProps: crossLayerPropsSchema.optional(),
})

/**
 * Schema for the arguments of a Feature execution.
 * @param argsSchema
 * @returns
 */
export const executeFeatureSchema = (argsSchema: z.ZodObject<any>) =>
  z.object({
    toolName: z.literal('execute_feature'),
    domain: z.string().optional(),
    featureName: z.string(),
    args: argsSchema,
    crossLayerProps: crossLayerPropsSchema.optional(),
  })

/**
 * Zod Schema for a Function execution.
 * {@link ExecuteFunctionData}
 */
export const executeFunctionSchema = z.object({
  toolName: z.string(),
  functionName: z.string(),
  args: z.object().loose(),
  crossLayerProps: crossLayerPropsSchema.optional(),
})
