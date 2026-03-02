import { createErrorObject, ErrorObject } from '@node-in-layers/core'
import z from 'zod'
import {
  ExecuteFeatureData,
  ExecuteModelData,
  ExecuteFunctionData,
  ModelAction,
  ModelActionToolName,
} from './types.js'
import {
  executeFeatureSchema,
  executeModelSchema,
  executeFunctionSchema,
} from './schemas.js'

const ACTION_TOOL_NAMES = Object.values(ModelActionToolName)

/**
 * Parses the express body object for an MCP tool call and returns the appropriate typed object, if its a valid MCP call.
 * @param body - The body to parse.
 * @returns The parsed data.
 * @returns undefined if the body is not an object or if the toolName is not a valid model or feature action.
 */
export const parseExecuteData = (
  body: any
):
  | ExecuteFeatureData
  | ExecuteModelData<any>
  | ExecuteFunctionData
  | undefined => {
  if (!body || typeof body !== 'object') {
    return undefined
  }

  const toolName = body.toolName || body.name
  const args = body.args || body.arguments || {}

  if (toolName === 'execute_feature') {
    return zodParse(executeFeatureSchema(z.object().loose()), {
      toolName: 'execute_feature',
      domain: args.domain || '',
      featureName: args.featureName || '',
      args,
    }) as ExecuteFeatureData
  }

  const modelActionMap: Record<string, ModelAction> = {
    [ModelActionToolName.Save]: ModelAction.Save,
    [ModelActionToolName.Retrieve]: ModelAction.Retrieve,
    [ModelActionToolName.Delete]: ModelAction.Delete,
    [ModelActionToolName.Search]: ModelAction.Search,
    [ModelActionToolName.BulkInsert]: ModelAction.BulkInsert,
    [ModelActionToolName.BulkDelete]: ModelAction.BulkDelete,
  }

  const action = modelActionMap[toolName]
  if (action) {
    const [domain = '', modelName = ''] = (args.modelType || '').split('.')
    return zodParse(executeModelSchema, {
      toolName: toolName as any,
      action,
      domain,
      modelName,
      args,
    }) as ExecuteModelData<any>
  }

  if (toolName) {
    return zodParse(executeFunctionSchema, {
      toolName: toolName as any,
      functionName: toolName,
      args,
    }) as ExecuteFunctionData
  }

  return undefined
}

/**
 * Checks if the data is a feature data.
 * @param data - The data to check.
 * @returns True if the data is a feature data, false otherwise.
 */
export const isExecuteFeatureData = (data: any): data is ExecuteFeatureData => {
  return data?.toolName === 'execute_feature'
}

/**
 * Checks if the data is a function data.
 * @param data - The data to check.
 * @returns True if the data is a function data, false otherwise.
 */
export const isExecuteFunctionData = (
  data: any
): data is ExecuteFunctionData => {
  return (
    data?.functionName !== undefined &&
    data?.toolName !== 'execute_feature' &&
    !ACTION_TOOL_NAMES.includes(data?.toolName)
  )
}

/**
 * Checks if the data is a model data.
 * @param data - The data to check.
 * @returns True if the data is a model data, false otherwise.
 */
export const isExecuteModelData = (data: any): data is ExecuteModelData => {
  return ACTION_TOOL_NAMES.includes(data?.toolName)
}

/**
 * Checks if the data is a save model data.
 * @param data - The data to check.
 * @returns True if the data is a save model data, false otherwise.
 */
export const isExecuteModelSave = (
  data: any
): data is ExecuteModelData<ModelAction.Save> => {
  if (!isExecuteModelData(data)) {
    return false
  }
  return data?.action === ModelAction.Save
}

/**
 * Checks if the data is a retrieve model data.
 * @param data - The data to check.
 * @returns True if the data is a retrieve model data, false otherwise.
 */
export const isExecuteModelRetrieve = (
  data: any
): data is ExecuteModelData<ModelAction.Retrieve> => {
  if (!isExecuteModelData(data)) {
    return false
  }
  return data?.action === ModelAction.Retrieve
}

/**
 * Checks if the data is a delete model data.
 * @param data - The data to check.
 * @returns True if the data is a delete model data, false otherwise.
 */
export const isExecuteModelDelete = (
  data: any
): data is ExecuteModelData<ModelAction.Delete> => {
  if (!isExecuteModelData(data)) {
    return false
  }
  return data?.action === ModelAction.Delete
}

/**
 * Checks if the data is a search model data.
 * @param data - The data to check.
 * @returns True if the data is a search model data, false otherwise.
 */
export const isExecuteModelSearch = (
  data: any
): data is ExecuteModelData<ModelAction.Search> => {
  if (!isExecuteModelData(data)) {
    return false
  }
  return data?.action === ModelAction.Search
}

/**
 * Checks if the data is a bulk insert model data.
 * @param data - The data to check.
 * @returns True if the data is a bulk insert model data, false otherwise.
 * @returns 
 */
export const isExecuteModelBulkInsert = (
  data: any
): data is ExecuteModelData<ModelAction.BulkInsert> => {
  if (!isExecuteModelData(data)) {
    return false
  }
  return data?.action === ModelAction.BulkInsert
}

/**
 * Checks if the data is a bulk delete model data.
 * @param data - The data to check.
 * @returns True if the data is a bulk delete model data, false otherwise.
 * @returns 
 */
export const isExecuteModelBulkDelete = (
  data: any
): data is ExecuteModelData<ModelAction.BulkDelete> => {
  if (!isExecuteModelData(data)) {
    return false
  }
  return data?.action === ModelAction.BulkDelete
}

/**
 * Checks if the error is a zod error.
 * @param error - The error to check.
 * @returns True if the error is a zod error, false otherwise.
 */
export const isZodError = (error: any): error is z.ZodError => {
  return error instanceof z.ZodError
}

/**
 * Converts a zod error into a proper error object.
 * @param error - The zod error to convert.
 * @returns The error object.
 */
export const convertZodErrorToErrorObject = (
  error: z.ZodError
): ErrorObject => {
  // AI: Convert this into a proper error object.
  const issues = error.issues.map((issue: z.ZodIssue) => {
    return {
      path: issue.path.join('.'),
      message: issue.message,
    }
  })
  return createErrorObject('VALIDATION_ERROR', 'A validation error occurred', {
    issues,
  })
}

/**
 * Runs zod parse on the raw object input, and then if successful returns the typed object. Otherwise an exception is thrown.
 * @param schema - The zod schema to parse the input against.
 * @param rawInput - The raw object input to parse.
 * @returns The typed object.
 * @throws An exception if the input does not match the schema.
 */
export const zodParse = <T extends object>(
  schema: z.ZodType<T>,
  rawInput: any
): T => {
  return schema.parse(rawInput)
}
