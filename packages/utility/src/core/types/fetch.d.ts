import { type FetchRequestConfig } from '@odata2ts/http-client-fetch'
import { type DataSourceOptions} from 'devextreme/data/data_source';

import type ODataStore, { type ODataStoreOptions } from 'devextreme/data/odata/store';
import type CustomStore, { type CustomStoreOptions } from 'devextreme/data/custom_store';
import { useHelper } from '../composables/use-helper';
import DataSource from 'devextreme/data/data_source';
import type { MonoFetchCookieOptions } from '../../token';

export interface FetchParam {
    method: string,
    url: string
    params?: Object,
    body?: Object,
}

export type FetchLoading<T extends string> = Record<T, boolean>;

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

type NotifHelper = ReturnType<typeof useHelper>['notif']

export interface FetchOData<T = any> {
    source: {
        DataSource: typeof DataSource,
        ODataStore: typeof ODataStore,
        CustomStore: typeof CustomStore,
        OdataService?: new (...args: any[]) => any;
    },
    force?: boolean,
    notif?: boolean | NotifHelper,
    baseUrl?: string,
    token?: string,
    url: string,
    override?: {
        dataSource?: ODataStoreOptions,
        fakeDataSource?: CustomStoreOptions
    },
    options?: {key: string} & DataSourceOptions<T>
}


/**
 * Opt-in TanStack Query behaviour for a fetch. Honoured only when the installed data layer supports
 * it — store classes flagged with `Symbol.for('mono.tanstack')` (OData fetches) or a `tanstackRun`
 * export (REST fetches); with plain DevExtreme it is ignored and the fetch behaves as before.
 */
export interface TanstackFetchOptions {
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
        /** ms a persisted read is kept (default 24 h). */
        maxAge?: number;
        /** Entries persisted under another buster are discarded — use the user id / app version. */
        buster?: string;
        storage?: 'indexeddb' | 'local';
    };
    /** Collect the store's `byKey` calls made within `wait` ms into one filtered request. */
    batchByKey?: boolean | { wait?: number; maxSize?: number };
    /** Broadcast writes to other tabs so they drop (and can refetch) this endpoint's data. */
    syncTabs?: boolean;
    /** A stable cache name (custom stores); stores with the same scope share cached reads. */
    scope?: string;
}

export type NormalFetchOptions = RequestInit & {
    notif?: boolean | NotifHelper,
    token?: string,
    baseUrl?: string,
    unauthCall?: () => void,
    expiredBehaviour?: 'refresh',
    tokenOptions?: MonoFetchCookieOptions,
}

export type NormalFetchResult<T> = {
  statusCode: number;
  data: T | null;
  message: string | null;
  all: any
};

type ConfigType = { jwtName: string, jwtRefreshName: string }

export interface OdataFetchTypes<T =  any> extends FetchOData<T>, FetchRequestConfig {
    method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
    unauthCall?: () => void
    expiredBehaviour?: 'refresh',
    selfProxy?: string,
    allowZero?: boolean,
    cache?: boolean,
    type?: 'data' | 'datasource' | 'fakedatasource' | 'fakedata',
    payload?: {
        data?: Record<string, any> | null,
        keyValue?: any,
        keyName: string,
        keyType?: string,
        useBatch?: boolean
    },
    config?: ConfigType,
    tokenOptions?: MonoFetchCookieOptions,
    /** Opt-in TanStack Query behaviour for the stores this fetch builds (see TanstackFetchOptions). */
    tanstack?: TanstackFetchOptions
}

