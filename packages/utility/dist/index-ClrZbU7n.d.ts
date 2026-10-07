import { a as MonoFetchCookieOptions } from "./types-B6FdB7LJ.js";
import { NotivueItem, PushOptions } from "notivue";
import { RouteLocationNormalizedLoadedGeneric, Router } from "vue-router";
import DataSource, { DataSourceOptions } from "devextreme/data/data_source";
import CustomStore, { CustomStoreOptions } from "devextreme/data/custom_store";
import { FetchRequestConfig } from "@odata2ts/http-client-fetch";
import ODataStore, { ODataStoreOptions } from "devextreme/data/odata/store";
import { DxColumn, DxDataGrid, DxDataGridTypes } from "devextreme-vue/data-grid";
import { ObjectSchema } from "yup";
import { QBooleanPath, QDateTimeOffsetPath, QEntityCollectionPath, QEntityPath, QNumberPath, QStringPath } from "@odata2ts/odata-query-objects";
import { LoadOptions } from "devextreme/data";

//#region src/core/composables/use-static-datasource.d.ts
type AnyObj = Record<string, any>;
type DxFilter = [string, '=' | '<>' | '>' | '>=' | '<' | '<=' | 'contains' | 'notcontains' | 'startswith' | 'endswith', any] | ['!', DxFilter] | [DxFilter, 'and' | 'or', DxFilter] | any[];
type OdataParams = {
  $filter?: string | DxFilter;
  $orderby?: string;
  $select?: string | string[];
  $skip?: number;
  $top?: number;
  $search?: string;
};
type UseOdataStaticOpts<T extends AnyObj> = {
  data: T[] | (() => T[]);
  key?: keyof T | string;
  params?: OdataParams;
  searchFields?: (keyof T | string)[];
  caseInsensitive?: boolean;
  keepKeyOnSelect?: boolean;
  source: {
    DataSource: typeof DataSource;
    CustomStore: typeof CustomStore;
  };
};
type Result<T> = {
  dataSource: DataSource<T>;
  data: T[] | null;
  statusCode: number;
  error: null | {
    message: string;
    stack: string;
    response: any;
  };
};
declare function createStaticDatasource<T extends AnyObj>(opts: UseOdataStaticOpts<T>): Promise<Result<T>>;
//#endregion
//#region src/core/types/notif-action.d.ts
/** Relaxed button descriptor — no Vuetify dependency. */
interface MonoNotifButton {
  text?: string;
  label?: string;
  to?: string | Record<string, any>;
  color?: string;
  variant?: string;
  class?: string;
  disabled?: boolean;
  [key: string]: any;
}
/** `item` prop type for MonoNotifAction (self-contained). */
type MonoNotifActionTypes = NotivueItem & {
  props: NotifProps['props'];
};
interface MonoNotifActionProps {
  item: MonoNotifActionTypes;
}
//#endregion
//#region src/core/types/notif.d.ts
type NotifProps = {
  route?: RouteLocationNormalizedLoadedGeneric;
  router?: Router;
  message: string;
  type: "info" | 'promise' | "warning" | "error" | "success";
} & Omit<PushOptions, 'message'> & {
  props?: {
    [key: string]: any;
    redirect?: string;
    isAction?: boolean;
    isNewMessageRequest?: boolean;
    buttons?: MonoNotifButton[];
  };
};
//#endregion
//#region src/core/composables/use-helper.d.ts
declare const useHelper: () => {
  isDate: (value: unknown) => value is Date;
  isJSONString: ({
    input,
    strict,
    root
  }: {
    input: unknown;
    strict?: boolean;
    root?: ("object" | "any" | "array" | "primitive") | ReadonlyArray<"object" | "any" | "array" | "primitive">;
  }) => boolean;
  safeJSONParse: (str: string) => any;
  replacerData: <ComT>({
    fn,
    type,
    item,
    key,
    items
  }: {
    fn: "push" | "remove" | "replace";
    type: "data";
    item: ComT;
    key?: (keyof ComT & (string | number)) | undefined;
    items: MaybeRef<ComT_1[]> | {
      key: string;
      var: any;
    };
  } | {
    fn: "push" | "remove" | "replace";
    type: "datasource";
    item: ComT;
    key?: (keyof ComT & (string | number)) | undefined;
    items: MaybeRef<DataSource<ComT_1, any> | null> | {
      key: string;
      var: any;
    };
  }) => void;
  filterOrIn: (field: string, values: any[], combine?: boolean) => any;
  validateAllSchema: <T extends object = any>({
    schema,
    input,
    error
  }: ValidateSchema<T>, callback?: () => void) => Promise<boolean>;
  validateSchema: <T = any>({
    schema,
    field,
    input,
    error
  }: ValidateSchema<T>, callback?: Function) => Promise<boolean>;
  validateAllSchemaCheck: (error: ValidateError<any>) => boolean;
  clearSchemaValidation: ({
    error
  }: {
    error: Ref<any>;
  }) => void;
  notif: (options: NotifProps) => Promise<import("notivue").NotificationClearMethods | undefined>;
  dxFilterToString: ({
    filter,
    encode
  }: {
    /** encode only the filter value (URL-safe), default false */encode?: boolean;
    filter: string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | /*elided*/any | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined;
  }) => string;
};
//#endregion
//#region src/core/types/fetch.d.ts
interface FetchParam {
  method: string;
  url: string;
  params?: Object;
  body?: Object;
}
type FetchLoading<T extends string> = Record<T, boolean>;
// export type DataSourceOptions = DataSourceOptions
// type CustomQueryParams = {
//     [key: string]: any;
// };
// type Expand = string | string[];
// type FilterExpression =
//     | [string, string, any]
//     | [string, string, any][]
//     | [string, [string, string, any]]
//     | [string, [string, string, any]][]
//     | [string, [string, [string, string, any]]]
//     | [string, [string, [string, string, any]]][]
//     | [string, [string, [string, [string, string, any]]]]
//     | [string, [string, [string, [string, string, any]]]][]
//     | ['!', [string, string, any]]
//     | [FilterExpression, 'and', FilterExpression]
//     | [FilterExpression, 'or', FilterExpression];
// type GroupExpression =
//     | string
//     | { selector: string; desc?: boolean }
//     | Array<string | { selector: string; desc?: boolean }>
//     | ((item: any) => any);
// type LangParams = {
//     locale: string;
//     collatorOptions: {
//         sensitivity: 'base' | 'accent' | 'case' | 'variant';
//         caseFirst?: 'upper' | 'lower' | 'false';
//     };
// };
// export type DataSourceOptions = {
//     key: string,
//     store?: any;
//     customQueryParams?: CustomQueryParams;
//     expand?: Expand;
//     filter?: any[];
//     group?: GroupExpression;
//     langParams?: LangParams;
//     map?: (dataItem: any) => any;
//     onChanged?: (e?: { changes: Array<any> }) => void;
//     onLoadError?: (error: { message: string }) => void;
//     onLoadingChanged?: (isLoading: boolean) => void;
//     pageSize?: number;
//     paginate?: boolean;
//     postProcess?: (data: Array<any>) => Array<any>;
//     pushAggregationTimeout?: number;
//     requireTotalCount?: boolean;
//     reshapeOnPush?: boolean;
//     searchExpr?: string | ((data: any) => any) | Array<string | ((data: any) => any)>;
//     searchOperation?: string;
//     searchValue?: any;
//     select?: string | Array<string> | ((data: any) => any);
//     sort?: string | { selector: string; desc?: boolean, asc?: boolean } | Array<string | { selector: string; desc?: boolean, asc?: boolean }> | ((data: any) => any);
// };
type NotifHelper = ReturnType<typeof useHelper>['notif'];
interface FetchOData<T = any> {
  source: {
    DataSource: typeof DataSource;
    ODataStore: typeof ODataStore;
    CustomStore: typeof CustomStore;
    OdataService?: new (...args: any[]) => any;
  };
  force?: boolean;
  notif?: boolean | NotifHelper;
  baseUrl?: string;
  token?: string;
  url: string;
  override?: {
    dataSource?: ODataStoreOptions;
    fakeDataSource?: CustomStoreOptions;
  };
  options?: {
    key: string;
  } & DataSourceOptions<T>;
}
/**
 * Opt-in TanStack Query behaviour for a fetch. Honoured only when the installed data layer supports
 * it — store classes flagged with `Symbol.for('mono.tanstack')` (OData fetches) or a `tanstackRun`
 * export (REST fetches); with plain DevExtreme it is ignored and the fetch behaves as before.
 */
interface TanstackFetchOptions {
  /** ms a cached read stays fresh (`'static'` = never stale). Setting it enables sharing. */
  staleTime?: number | 'static';
  /** ms an unused cached read is kept. */
  gcTime?: number;
  /** Share identical in-flight reads even without caching. */
  dedupe?: boolean;
  /** Retry failed reads (network errors, 408, 429, 5xx only): `true`, a count, or a predicate. */
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
  /** ms between retries, or `(attempt, error) => ms`; default exponential backoff. */
  retryDelay?: number | ((attempt: number, error: any) => number);
  /** `'online'` / `'offlineFirst'` pause requests while offline and resume on reconnect. */
  networkMode?: 'online' | 'always' | 'offlineFirst';
  /** Keep reads across page reloads (IndexedDB by default). Results must be JSON-safe. */
  persist?: boolean | {
    /** ms a persisted read is kept (default 24 h). */maxAge?: number; /** Entries persisted under another buster are discarded — use the user id / app version. */
    buster?: string;
    storage?: 'indexeddb' | 'local';
  };
  /** Collect the store's `byKey` calls made within `wait` ms into one filtered request. */
  batchByKey?: boolean | {
    wait?: number;
    maxSize?: number;
  };
  /** Broadcast writes to other tabs so they drop (and can refetch) this endpoint's data. */
  syncTabs?: boolean;
  /** A stable cache name (custom stores); stores with the same scope share cached reads. */
  scope?: string;
}
type NormalFetchOptions = RequestInit & {
  notif?: boolean | NotifHelper;
  token?: string;
  baseUrl?: string;
  unauthCall?: () => void;
  expiredBehaviour?: 'refresh';
  tokenOptions?: MonoFetchCookieOptions;
};
type NormalFetchResult<T> = {
  statusCode: number;
  data: T | null;
  message: string | null;
  all: any;
};
type ConfigType$1 = {
  jwtName: string;
  jwtRefreshName: string;
};
interface OdataFetchTypes<T = any> extends FetchOData<T>, FetchRequestConfig {
  method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  unauthCall?: () => void;
  expiredBehaviour?: 'refresh';
  selfProxy?: string;
  allowZero?: boolean;
  cache?: boolean;
  type?: 'data' | 'datasource' | 'fakedatasource' | 'fakedata';
  payload?: {
    data?: Record<string, any> | null;
    keyValue?: any;
    keyName: string;
    keyType?: string;
    useBatch?: boolean;
  };
  config?: ConfigType$1;
  tokenOptions?: MonoFetchCookieOptions;
  /** Opt-in TanStack Query behaviour for the stores this fetch builds (see TanstackFetchOptions). */
  tanstack?: TanstackFetchOptions;
}
//#endregion
//#region src/core/types/column.d.ts
// primitives / built-ins we don't want to recurse into
type BuiltIn = Date | Function | RegExp | Error; // treat only plain objects (not arrays, not built-ins) as nestable
type IsPlainObject<T> = T extends object ? T extends BuiltIn ? false : T extends readonly any[] ? false : true : false;
/** "a" | "a.b" | "a.b.c" ... including top-level keys */
type DotKeys<T> = T extends object ? { [K in Extract<keyof T, string>]: IsPlainObject<T[K]> extends true ? K | `${K}.${DotKeys<T[K]>}` : K }[Extract<keyof T, string>] : never;
/** Optional: value type at a given dot-path */
type PathValue<T, P extends string> = P extends `${infer K}.${infer R}` ? K extends keyof T ? PathValue<T[K], R> : never : P extends keyof T ? T[P] : never;
// --- Your Col type using DotKeys<T> and allowing extra keys I[number] ---
type Col<T = any, I extends readonly string[] = []> = InstanceType<typeof DxColumn>["$props"] & {
  dataField: [keyof T] extends [never] ? I[number] | string // when T is unknown/empty
  : I[number] | DotKeys<T>; // typed dot-paths + extras
  cellTemplate?: [keyof T] extends [never] ? string : `${Extract<DotKeys<T>, string>}Template` | (string & {}) | ((container: HTMLElement, options: DxDataGridTypes.ColumnCellTemplateData) => void);
  groupCellTemplate?: [keyof T] extends [never] ? string : `${Extract<DotKeys<T>, string>}GroupTemplate`;
  headerCellTemplate?: [keyof T] extends [never] ? string : `${Extract<DotKeys<T>, string>}HeaderTemplate`;
  editCellTemplate?: [keyof T] extends [never] ? string : `${Extract<DotKeys<T>, string>}EditCellTemplate`;
  columns?: Col<T, I>[];
};
interface LoopTemplate<T = {}> extends Col {
  items: keyof T extends never ? string[] : (keyof T)[];
}
interface GroupTemplate {
  name: string;
  code: string;
}
//#endregion
//#region src/core/types/schema.d.ts
interface ValidateSchema<T = any> {
  schema: any;
  field?: keyof T;
  input: T;
  error: any;
}
type ValidateErrorItem = {
  valid: boolean;
  message: string;
};
type ValidateError<T extends string = string> = Record<T, ValidateErrorItem>;
type WithUndefined<T> = { [P in keyof T]: T[P] | undefined };
interface SchemaType<T> extends WithUndefined<T> {}
interface Schema<T> extends ObjectSchema<SchemaType<T>> {}
type AnyObject = yup.AnyObject;
/** Map a TS type T to the corresponding Yup schema type */
type SchemaFor<T> = T extends string ? yup.StringSchema<string> : T extends number ? yup.NumberSchema<number> : T extends boolean ? yup.BooleanSchema<boolean> : T extends Date ? yup.DateSchema<Date> : T extends (infer U)[] ? yup.ArraySchema<SchemaFor<U>, AnyObject, U[]> : T extends Record<string, any> ? yup.ObjectSchema<{ [K in keyof T]-?: SchemaFor<T[K]> }, AnyObject, T> : yup.Schema<T>;
/** Build a per-key schema shape with proper schema types */
type SchemaObject<T> = { [K in keyof T]-?: SchemaFor<T[K]> };
type ValidateErrorSingle<T> = { [K in keyof T]: T[K] extends object ? ValidateError<T[K]> : ValidateErrorItem };
type ValidateErrorComplex<T> = { [K in keyof T]: T[K] extends object[] ? ValidateErrorItem[] // or more complex handling
: T[K] extends object ? ValidateErrorComplex<T[K]> : ValidateErrorItem };
//#endregion
//#region src/core/types/devextreme.d.ts
type FilterExpression = "=" | "<>" | ">" | ">=" | "<" | "<=" | "startswith" | "endswith" | "contains" | "notcontains";
interface HeaderFilter<T> {
  value: [keyof T, FilterExpression, string];
  text: string;
}
interface Format {
  type?: 'currency';
  currency?: 'IDR';
  precision?: number;
}
interface CustomSummary {
  column: string;
  summaryType: "sum" | "min" | "max" | "avg" | "count";
  name?: string;
  alignment?: 'right' | 'center' | 'left';
  cssClass?: string;
  displayFormat?: string;
  showInColumn?: string;
  valueFormat?: Format | string;
}
type DataGrid<T = {}> = (InstanceType<typeof DxDataGrid>['$props']) & {
  keyExpr?: keyof T extends never ? string | string[] : keyof T | (keyof T)[];
};
//#endregion
//#region src/core/types/odatamap.d.ts
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
type GetInstance<T> = T extends (new (...args: any) => infer I) ? I : T;
type UnwrapPath<T> = T extends QStringPath<infer U> ? U : T extends QNumberPath<infer U> ? U : T extends QBooleanPath<infer U> ? U : T extends QDateTimeOffsetPath<infer U> ? U : T extends QEntityCollectionPath<infer Q> ? DTO_FromQ<Q>[] : T extends QEntityPath<infer Q> ? DTO_FromQ<Q> : never;
type AllowedPath = QStringPath<any> | QNumberPath<any> | QBooleanPath<any> | QDateTimeOffsetPath<any> | QEntityCollectionPath<any> | QEntityPath<any>;
type DTO_FromQ<Q> = { [K in keyof Mutable<GetInstance<Q>> as Mutable<GetInstance<Q>>[K] extends AllowedPath ? K : never]: UnwrapPath<Mutable<GetInstance<Q>>[K]> };
type Ctor<T = any> = new (...args: any) => T;
type OdataMapTypes<Q, Overrides extends Record<string, Ctor<any> | Ctor<any>[]> = {}> = Omit<DTO_FromQ<Q>, keyof Overrides> & { [K in keyof Overrides]: Overrides[K] extends Ctor<infer _> ? DTO_FromQ<Overrides[K]> : Overrides[K] extends Array<infer U> ? DTO_FromQ<U>[] : never };
//#endregion
//#region src/core/composables/use-fetch-helper.d.ts
declare global {
  interface Window {
    helper?: any;
  }
}
type ConfigType = {
  jwtName: string;
  jwtRefreshName: string;
};
declare function extractErrorMessage(source: any, fallback?: string): string;
declare function parseDxError(err: any): {
  status: any;
  code: any;
  message: string;
  body: any;
  err: any;
};
declare const useFetchOData: <T = any>({
  url,
  options,
  source,
  type,
  params,
  notif,
  force,
  token,
  headers,
  selfProxy,
  method,
  baseUrl,
  override,
  allowZero,
  cache,
  expiredBehaviour,
  unauthCall,
  payload,
  config,
  tokenOptions,
  tanstack
}: OdataFetchTypes) => Promise<{
  data: T | null;
  dataSource: DataSource<T> | null;
  statusCode: number;
  error: {
    message: string;
    stack: string;
    response: any;
  } | null;
}>;
type FetchOverrides = Omit<Partial<OdataFetchTypes>, 'url' | 'type' | 'options'> & {
  options?: Omit<Partial<NonNullable<OdataFetchTypes['options']>>, 'key'>;
};
declare function createFetcher<T>(base: OdataFetchTypes): {
  response(option?: FetchOverrides): Promise<{
    data: T | null;
    dataSource: DataSource<T, any> | null;
    statusCode: number;
    error: {
      message: string;
      stack: string;
      response: any;
    } | null;
  }>;
};
type OdataFetchUniqueTypes<T> = {
  unique: keyof T & string;
} & OdataFetchTypes;
declare const createUniqueFetcher: <T extends any>(opt: OdataFetchUniqueTypes<T>) => Promise<{
  data: T | null;
  dataSource: DataSource<T, any> | null;
  statusCode: number;
  error: {
    message: string;
    stack: string;
    response: any;
  } | null;
}>;
declare function useNormalFetch<T>(url: string, options: NormalFetchOptions, config?: ConfigType): Promise<NormalFetchResult<T>>;
interface TryCatchDatasourceParams<T> {
  tryCallback: () => Promise<T> | T;
  catchCallback?: (error: any, parsed: ReturnType<typeof parseDxError>) => Promise<T> | T;
  finallyCallback?: () => Promise<any> | any;
  notif?: OdataFetchTypes['notif'];
}
declare function tryCatchDatasource<T>({
  tryCallback,
  catchCallback,
  finallyCallback,
  notif
}: TryCatchDatasourceParams<T>): Promise<T>;
type LoadChunkStoreArgs<T> = {
  datasource: DataSource<T>;
  options: LoadOptions<T>;
  limit?: number;
  maxRows?: number;
  concurrency?: number;
};
declare function loadChuckStore<T>({
  datasource,
  options,
  limit,
  maxRows,
  concurrency
}: LoadChunkStoreArgs<T>): Promise<T[]>;
type AwaitedMap<T extends Record<string, Promise<any>>> = { [K in keyof T]: Awaited<T[K]> };
type SettledMap<T extends Record<string, Promise<any>>> = {
  values: Partial<AwaitedMap<T>>;
  errors: Partial<Record<keyof T, unknown>>;
};
type AllMap<T extends Record<string, Promise<any>>> = {
  values: AwaitedMap<T>;
  errors: {};
};
declare function promiseWrapper<T extends Record<string, Promise<any>>, Mode extends 'all' | 'allSettled' = 'allSettled'>({
  task,
  type
}: {
  task: T;
  type?: Mode;
}): Promise<Mode extends 'all' ? AllMap<T> : SettledMap<T>>;
//#endregion
//#region src/core/components/Notif.vue.d.ts
type __VLS_Props = {
  item: MonoNotifActionTypes;
};
declare const __VLS_export: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
//#endregion
export { GroupTemplate as A, useHelper as B, SchemaType as C, ValidateErrorSingle as D, ValidateErrorItem as E, FetchParam as F, UseOdataStaticOpts as G, MonoNotifActionProps as H, NormalFetchOptions as I, createStaticDatasource as K, NormalFetchResult as L, PathValue as M, FetchLoading as N, ValidateSchema as O, FetchOData as P, OdataFetchTypes as R, SchemaObject as S, ValidateErrorComplex as T, MonoNotifActionTypes as U, NotifProps as V, MonoNotifButton as W, DataGrid as _, TryCatchDatasourceParams as a, HeaderFilter as b, extractErrorMessage as c, promiseWrapper as d, tryCatchDatasource as f, CustomSummary as g, OdataMapTypes as h, OdataFetchUniqueTypes as i, LoopTemplate as j, Col as k, loadChuckStore as l, useNormalFetch as m, FetchOverrides as n, createFetcher as o, useFetchOData as p, LoadChunkStoreArgs as r, createUniqueFetcher as s, _default as t, parseDxError as u, FilterExpression as v, ValidateError as w, Schema as x, Format as y, TanstackFetchOptions as z };