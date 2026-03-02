import { JsonObj, OrmSearch } from 'functional-models'

/**
 * 
 */
export enum ModelAction {
  Save = 'save',
  Retrieve = 'retrieve',
  Delete = 'delete',
  Search = 'search',
  BulkInsert = 'bulkInsert',
  BulkDelete = 'bulkDelete',
}

/**
 * 
 */
export enum ModelActionToolName {
  Save = 'model_save',
  Retrieve = 'model_retrieve',
  Delete = 'model_delete',
  Search = 'model_search',
  BulkInsert = 'model_bulk_insert',
  BulkDelete = 'model_bulk_delete',
}

/**
 * @interface
 */
export type ModelSave = Readonly<{
  modelType: string
  instance: JsonObj
}>

/**
 * @interface
 */
export type ModelBulkInsert = Readonly<{
  modelType: string
  items: ReadonlyArray<JsonObj>
}>

/**
 * @interface
 */
export type ModelBulkDelete = Readonly<{
  modelType: string
  ids: ReadonlyArray<string>
}>

/**
 * @interface
 */
export type ModelRetrieve = Readonly<{
  modelType: string
  id: string
}>

/**
 * @interface
 */
export type ModelDelete = Readonly<{
  modelType: string
  id: string
}>

/**
 * @interface
 */
export type ModelSearch = Readonly<{
  modelType: string
  search: OrmSearch
}>

type _ModelActionMap = Readonly<{
  [ModelAction.Save]: Readonly<{
    toolName: ModelActionToolName.Save
    args: ModelSave
  }>
  [ModelAction.Retrieve]: Readonly<{
    toolName: ModelActionToolName.Retrieve
    args: ModelRetrieve
  }>
  [ModelAction.Delete]: Readonly<{
    toolName: ModelActionToolName.Delete
    args: ModelDelete
  }>
  [ModelAction.Search]: Readonly<{
    toolName: ModelActionToolName.Search
    args: ModelSearch
  }>
  [ModelAction.BulkInsert]: Readonly<{
    toolName: ModelActionToolName.BulkInsert
    args: ModelBulkInsert
  }>
  [ModelAction.BulkDelete]: Readonly<{
    toolName: ModelActionToolName.BulkDelete
    args: ModelBulkDelete
  }>
}>

/**
 * @interface
 */
export type MCPToolExecuteData<
  ToolName extends string,
  T extends JsonObj = JsonObj,
> = Readonly<{
  toolName: ToolName
  args: T
}>

/**
 * Extracted data when an MCP tool execution represents a Model CRUD action.
 * @interface
 */
export type ExecuteModelData<A extends ModelAction = ModelAction> =
  A extends any
    ? MCPToolExecuteData<
        _ModelActionMap[A]['toolName'],
        _ModelActionMap[A]['args'] & JsonObj
      > &
        Readonly<{
          toolName: _ModelActionMap[A]['toolName']
          action: A
          domain: string
          modelName: string
        }>
    : never

/**
 * Extracted data when an MCP tool execution represents a Feature execution.
 * @interface
 */
export type ExecuteFeatureData = MCPToolExecuteData<'execute_feature'> &
  Readonly<{
    domain: string
    featureName: string
  }>

/**
 * Extracted data when an MCP tool execution represents a Function execution.
 * @interface
 */
export type ExecuteFunctionData = MCPToolExecuteData<string, JsonObj> &
  Readonly<{
    functionName: string
  }>
