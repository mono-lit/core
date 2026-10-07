import { v as MonoMockDbConfig } from "./create-config-D3m6xTaQ.js";

//#region pkg/mock-db/schema.d.ts
type MonoMockFieldType = 'number' | 'string' | 'boolean' | 'date' | 'object' | 'array';
/** `A->B:C` — "rows of B where `B[C] === row[A]`". */
interface MonoMockRelation {
  /** Field on THIS entity whose value is matched. */
  localField: string;
  /** Entity being pointed at. */
  targetEntity: string;
  /** Field on the target entity that must equal `row[localField]`. */
  targetKey: string;
  /** `object` -> first match, `array` -> every match. */
  kind: 'object' | 'array';
}
interface MonoMockField {
  name: string;
  type: MonoMockFieldType;
  primary: boolean;
  foreign: boolean;
  /** Set when the modifier is a relation. Virtual: never persisted. */
  relation?: MonoMockRelation;
}
interface MonoMockParsedEntity {
  name: string;
  /** Every declared field, including virtual relation fields. */
  fields: MonoMockField[];
  /** Fields actually written to the store (relations excluded). */
  columns: MonoMockField[];
  relations: MonoMockField[];
  primaryKey: string;
  seed?: Record<string, any>[];
}
interface MonoMockParsedSchema {
  /** The base-url this group of entities is served under. */
  baseUrl: string;
  entities: Record<string, MonoMockParsedEntity>;
}
interface MonoMockSchemaError {
  baseUrl: string;
  entity: string;
  field?: string;
  message: string;
}
/** Parse one `'<type>|<modifier>'` declaration. Throws with the field name attached. */
declare function parseField(name: string, declaration: string): MonoMockField;
/**
 * Parse every base-url group. Collects errors instead of throwing on the first
 * one, so `mono db validate` can report them all in a single pass.
 */
declare function parseMockSchema(config: MonoMockDbConfig): {
  schemas: MonoMockParsedSchema[];
  errors: MonoMockSchemaError[];
};
/** Strip leading/trailing slashes so `/a/` and `a` compare equal. */
declare function normalizeSegment(value: string): string;
/**
 * Find the schema whose base-url this request url belongs to, and the entity
 * within it. Matches on path segments (never a bare substring), so a base-url of
 * `flow` cannot swallow `/flowers/1`.
 *
 * Accepts absolute urls, and urls where the base-url is only part of the path
 * (e.g. `https://host/api/my-mock/users`).
 */
declare function matchMockRoute(schemas: MonoMockParsedSchema[], url: string): {
  schema: MonoMockParsedSchema;
  entity: MonoMockParsedEntity;
  rest: string;
} | null;
//#endregion
//#region pkg/mock-db/odata.d.ts
type TokenType = 'ident' | 'string' | 'number' | 'date' | 'op' | 'paren' | 'comma' | 'path' | 'colon' | 'eof';
interface Token {
  type: TokenType;
  value: string;
}
declare function tokenize(input: string): Token[];
type FilterNode = {
  kind: 'literal';
  value: unknown;
} | {
  kind: 'field';
  name: string;
} /** `A/B/C` — a navigation path, or a lambda range variable (`d/Bulan`). */ | {
  kind: 'path';
  segments: string[];
} /** `Nav/any(d: <predicate>)` — `nav` may be empty for a lambda on the row itself. */ | {
  kind: 'lambda';
  op: 'any' | 'all';
  nav: string[];
  variable: string;
  predicate: FilterNode;
} /** `Field in (1,2,3)` */ | {
  kind: 'in';
  left: FilterNode;
  values: FilterNode[];
} | {
  kind: 'call';
  name: string;
  args: FilterNode[];
} | {
  kind: 'compare';
  op: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';
  left: FilterNode;
  right: FilterNode;
} | {
  kind: 'logical';
  op: 'and' | 'or';
  left: FilterNode;
  right: FilterNode;
} | {
  kind: 'not';
  operand: FilterNode;
};
/**
 * Recursive descent, lowest precedence first:
 *   or  ->  and  ->  not  ->  comparison  ->  primary
 * so `a eq 1 and b eq 2 or c eq 3` parses as `((a eq 1 and b eq 2) or c eq 3)`.
 */
declare function parseFilter(input: string): FilterNode;
/**
 * What the evaluator needs beyond the row itself.
 *
 * `entity` + `readEntity` let a filter reach a NAVIGATION property. Relations here
 * are virtual — they only materialise under `$expand` — so without this a lambda
 * like `Detail/any(d: d/Bulan eq 3)` would see an empty collection and silently
 * match nothing.
 *
 * `scope` binds lambda range variables (`d` -> the item currently under test).
 */
interface FilterContext {
  entity?: MonoMockParsedEntity;
  readEntity?: (name: string) => Record<string, any>[];
  scope?: Record<string, Record<string, any>>;
}
declare function evaluateFilter(node: FilterNode, row: Record<string, any>, context?: FilterContext): boolean;
/**
 * One `$expand` item, with the options that can live inside its parens:
 * `Approval($select=Id;$expand=Step($select=X);$filter=Status eq 'Menunggu';$top=1)`.
 *
 * These are not decoration — the app relies on the nested `$filter`/`$top` to cut a
 * child collection down to the row it wants. Ignoring them returns every child.
 */
interface ExpandItem {
  name: string;
  select?: string[];
  filter?: string;
  orderby?: {
    field: string;
    desc: boolean;
  }[];
  top?: number;
  skip?: number;
  expand?: ExpandItem[];
}
interface ODataQuery {
  filter?: string;
  select?: string[];
  orderby?: {
    field: string;
    desc: boolean;
  }[];
  top?: number;
  skip?: number;
  count?: boolean;
  /**
   * Either bare relation names (`['cars']`) or parsed items with nested options.
   * A raw string is normalised on the way in, so both call styles work.
   */
  expand?: (string | ExpandItem)[];
  /** Raw `$apply` pipeline, e.g. `filter(X gt 1)/groupby((A),aggregate(B with sum as T))`. */
  apply?: string;
}
/**
 * Parse an `$expand` value into a tree.
 *
 * Tolerates everything the real app emits: embedded newlines/tabs, spaces after
 * commas (`Feature($select=Id, Nama)`), a stray trailing `;`
 * (`BudgetAlokasi($select=…;)`), and a single string holding several comma-separated
 * expands.
 */
declare function parseExpand(input: string | string[]): ExpandItem[];
/** Read OData options off a query string or a param object (DevExtreme sends both shapes). */
declare function parseQuery(input: string | Record<string, any>): ODataQuery;
interface ODataResult {
  /** Rows after filter -> order -> page -> expand -> select. */
  rows: Record<string, any>[];
  /** Total AFTER filtering but BEFORE paging — what @odata.count must report. */
  total: number;
}
/**
 * Run a query over an entity's rows.
 *
 * Order matters and is the usual source of off-by-one bugs: filter first, take
 * the count from the FILTERED set, then page, then expand, then select. Counting
 * before filtering (or after paging) is the classic way to break a grid's pager.
 */
declare function executeQuery(rows: Record<string, any>[], query: ODataQuery, context?: {
  entity: MonoMockParsedEntity;
  readEntity: (name: string) => Record<string, any>[]; /** Resolves a child entity's schema — needed to recurse into a nested $expand. */
  entityOf?: (name: string) => MonoMockParsedEntity | undefined;
}): ODataResult;
/** `Entity(1)` / `Entity('abc')` -> the key, or null for a collection request. */
declare function parseKeySegment(segment: string): string | number | null;
/** The `{ value, @odata.count }` envelope DevExtreme's ODataStore expects. */
declare function toODataEnvelope(result: ODataResult, count: boolean): {
  value: Record<string, any>[];
  '@odata.count'?: number | undefined;
};
//#endregion
//#region pkg/mock-db/apply.d.ts
/** Compiles a `$filter` expression into a row predicate. Injected to avoid an import cycle. */
type CompileFilter = (expression: string) => (row: Record<string, any>) => boolean;
/**
 * Reads a property that may be a NAVIGATION PATH (`PostBudget/ParentName`).
 *
 * Injected for the same reason as `compileFilter`: the path resolver lives in
 * odata.ts, which imports this module. Without it `groupby((PostBudget/ParentName))`
 * read a flat field, found nothing, and silently collapsed every row into one
 * `null` group — the aggregate looked plausible and was wrong.
 */
type ReadValue = (row: Record<string, any>, field: string) => unknown;
type AggregateMethod = 'sum' | 'average' | 'min' | 'max' | 'count' | 'countdistinct';
interface AggregateSpec {
  /** Source field. Absent for `$count as X`. */
  field?: string;
  method: AggregateMethod;
  /** Output property name (`... as Alias`). */
  alias: string;
}
type ApplyTransform = {
  kind: 'filter';
  expression: string;
} | {
  kind: 'groupby';
  fields: string[];
  aggregates: AggregateSpec[];
} | {
  kind: 'aggregate';
  aggregates: AggregateSpec[];
} | {
  kind: 'identity';
};
declare function parseApply(input: string): ApplyTransform[];
/** Run the pipeline. Each transform's output feeds the next. */
declare function applyTransforms(rows: Record<string, any>[], transforms: ApplyTransform[], compileFilter: CompileFilter, readValue?: ReadValue): Record<string, any>[];
//#endregion
//#region pkg/mock-db/generate.d.ts
/** mulberry32 — small, fast, seedable. We need repeatability, not cryptography. */
declare function createRandom(seed: number): () => number;
/**
 * Topologically order entities so every parent is generated before the children
 * that point at it — otherwise a foreign key would reference rows that don't
 * exist yet. Cycles fall back to declaration order (a self-referencing FK just
 * gets a key from an already-generated row of the same entity).
 */
declare function orderEntitiesByDependency(entities: MonoMockParsedEntity[]): MonoMockParsedEntity[];
interface GenerateOptions {
  /** Rows per entity that has no explicit `seed`. */
  count?: number;
  /** RNG seed — same seed, same rows. */
  random?: number;
}
/**
 * Build the seed for one base-url group.
 *
 * An entity's explicit `seed` wins outright: a generator cannot invent
 * enum-like columns or a serialized graph, so anything an app parses must be
 * supplied as fixtures.
 */
declare function generateSeed(schema: MonoMockParsedSchema, options?: GenerateOptions): Record<string, Record<string, any>[]>;
//#endregion
//#region pkg/mock-db/store.d.ts
declare function isIndexedDbAvailable(): boolean;
interface MonoMockStore {
  read(baseUrl: string, entity: string): Promise<Record<string, any>[]>;
  write(baseUrl: string, entity: string, rows: Record<string, any>[]): Promise<void>;
  insert(baseUrl: string, entity: string, row: Record<string, any>): Promise<Record<string, any>>;
  /**
   * `merge: true` (PATCH) keeps fields absent from `changes`.
   * `merge: false` (PUT) REPLACES the row, carrying over only the primary key —
   * which is what a real OData PUT does. A merging PUT would hide the production
   * bug where a partial PUT nulls out the fields you omitted.
   */
  update(baseUrl: string, entity: string, key: any, changes: Record<string, any>, options?: {
    merge?: boolean;
  }): Promise<Record<string, any> | null>;
  remove(baseUrl: string, entity: string, key: any): Promise<boolean>;
  clear(): Promise<void>;
  close(): void;
}
/**
 * Open (and upgrade) the database. Every entity across every base-url becomes an
 * object store keyed on its declared primary key, with an index per foreign key.
 *
 * `version` comes from the config: bumping it triggers `onupgradeneeded`, which
 * drops and recreates the stores — i.e. a schema change WIPES the user's data.
 * That's correct for a mock, but it is destructive and therefore logged.
 */
declare function openMockDb(dbName: string, version: number, schemas: MonoMockParsedSchema[]): Promise<IDBDatabase>;
declare function createMockStore(db: IDBDatabase): MonoMockStore;
//#endregion
//#region pkg/mock-db/index.d.ts
interface MonoMockRequest {
  url: string;
  method?: string;
  /** Query string or param object — DevExtreme sends either. */
  params?: string | Record<string, any>;
  /**
   * A prebuilt query, which wins over `params`.
   *
   * The fetch wrapper uses this to merge the core's `options` (the DevExtreme
   * DataSourceOptions shape: select/filter/sort/expand/take/pageSize) with any raw
   * `$`-params, since only the caller knows both.
   */
  query?: ODataQuery;
  /**
   * Row key for PUT/PATCH/DELETE, when the url carries none.
   *
   * The core sends it in the payload envelope (`payload.keyValue`) and leaves the url
   * keyless — `store.update(payload.keyValue, payload.data)`. A url key still wins,
   * so the DevExtreme CustomStore's `Entity(key)` urls keep working.
   */
  key?: string | number;
  /** Body for POST/PUT/PATCH. */
  payload?: Record<string, any> | null;
}
interface MonoMockResponse<T = any> {
  data: T | null;
  statusCode: number;
  error: {
    message: string;
    stack: string;
    response: any;
  } | null;
}
interface MonoMockDb {
  /** True once the schema is parsed and IndexedDB is hydrated. */
  ready: Promise<void>;
  schemas: MonoMockParsedSchema[];
  /** Does this url belong to a mock schema? */
  matches(url: string): boolean;
  request<T = any>(request: MonoMockRequest): Promise<MonoMockResponse<T>>;
  /** Wipe and re-hydrate from the seed. */
  reset(): Promise<void>;
  /** Dump every table (for promoting generated rows into an explicit `seed`). */
  export(): Promise<Record<string, Record<string, Record<string, any>[]>>>;
  /** Replace tables with the given rows. */
  import(data: Record<string, Record<string, Record<string, any>[]>>): Promise<void>;
}
/**
 * Build the runtime for a config. Idempotent per page — `monoMockDb()` caches it,
 * so the schema is parsed and IndexedDB opened once.
 */
declare function createMockDb(config: MonoMockDbConfig): MonoMockDb;
/**
 * The page-wide mock backend, built from `mono.config.ts` `mockIndexedDB`.
 * Returns null when the app declares no mock — every caller must treat that as
 * "go to the network".
 */
declare function monoMockDb(config?: MonoMockDbConfig): MonoMockDb | null;
/** Test seam — drops the cached instance. */
declare function resetMonoMockDb(): void;
//#endregion
export { parseFilter as A, MonoMockSchemaError as B, FilterContext as C, evaluateFilter as D, ODataResult as E, MonoMockField as F, normalizeSegment as H, MonoMockFieldType as I, MonoMockParsedEntity as L, parseQuery as M, toODataEnvelope as N, executeQuery as O, tokenize as P, MonoMockParsedSchema as R, ExpandItem as S, ODataQuery as T, parseField as U, matchMockRoute as V, parseMockSchema as W, ApplyTransform as _, monoMockDb as a, applyTransforms as b, createMockStore as c, GenerateOptions as d, createRandom as f, AggregateSpec as g, AggregateMethod as h, createMockDb as i, parseKeySegment as j, parseExpand as k, isIndexedDbAvailable as l, orderEntitiesByDependency as m, MonoMockRequest as n, resetMonoMockDb as o, generateSeed as p, MonoMockResponse as r, MonoMockStore as s, MonoMockDb as t, openMockDb as u, CompileFilter as v, FilterNode as w, parseApply as x, ReadValue as y, MonoMockRelation as z };