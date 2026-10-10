import { C as MonoSyncTransport, _ as MonoMergeableKey, c as MonoConfig, n as JWTCompleteTokenTypes, o as MonoAppType, t as DefaultJWTTokenTypes, w as MonoTemplate } from "./create-config-D3m6xTaQ.js";
import { a as MonoFetchCookieOptions, i as LocalStorageParams, n as CookieTokenParams, o as NormalFetchOptions$1, r as JWTPayload, s as NormalFetchResult$1, t as CookieParams } from "./types-B6FdB7LJ.js";
import { a as monoToken, i as monoStorage, n as monoCookie, o as setMonoEventResolver, r as monoJwt, s as CookieApi, t as MonoRequestEvent } from "./universal-B2eD9xho.js";
import { A as ValidateErrorItem, B as NormalFetchOptions, C as Format, D as SchemaType, E as SchemaObject, F as LoopTemplate, G as NotifProps, H as OdataFetchTypes, I as PathValue, J as MonoNotifButton, K as MonoNotifActionProps, L as FetchLoading, M as ValidateSchema, N as Col, O as ValidateError, P as GroupTemplate, R as FetchOData, S as FilterExpression, T as Schema, U as TanstackFetchOptions, V as NormalFetchResult, W as useHelper, X as createStaticDatasource, Y as UseOdataStaticOpts, _ as getPrefetchBridge, a as TryCatchDatasourceParams, b as CustomSummary, c as extractErrorMessage, d as promiseWrapper, f as tryCatchDatasource, g as MonoPrefetchRequest, h as MonoPrefetchBridge, i as OdataFetchUniqueTypes, j as ValidateErrorSingle, k as ValidateErrorComplex, l as loadChuckStore, m as useNormalFetch, n as FetchOverrides, o as createFetcher, p as useFetchOData, q as MonoNotifActionTypes, r as LoadChunkStoreArgs, s as createUniqueFetcher, t as _default, u as parseDxError, v as setPrefetchBridge, w as HeaderFilter, x as DataGrid, y as OdataMapTypes, z as FetchParam } from "./index-D70EYjBS.js";
import { InjectionKey, Plugin, Ref as Ref$1 } from "vue";
import { RouteRecordRaw } from "vue-router";

//#region src/token/client.d.ts
/** Client cookie util — `document.cookie` backed (unchanged public shape). */
declare const useMyCookie: () => CookieApi;
/** Client token util — `document.cookie` backed (unchanged public shape). */
declare const useMyToken: (options?: CookieTokenParams) => {
  decode: <T extends object>(name?: CookieTokenParams["name"], split?: boolean) => JWTPayload<T> | null;
  add: ({
    name,
    value,
    days,
    milis,
    splitCookie
  }: Pick<CookieTokenParams, "name" | "value" | "days" | "milis" | "splitCookie">) => string | null | undefined;
  get: (name?: CookieTokenParams["name"], split?: boolean) => CookieTokenParams["value"] | null;
  replace: ({
    name,
    value,
    days,
    milis,
    splitCookie
  }: Pick<CookieTokenParams, "name" | "value" | "days" | "milis" | "splitCookie">) => boolean;
  fetch: <T = Record<string, any>>({
    fetchParams,
    name,
    path,
    splitCookie
  }?: MonoFetchCookieOptions) => Promise<{
    response: T | null;
    cookie: string | null | undefined;
  }>;
  validate: (name?: CookieTokenParams["name"], split?: boolean) => boolean;
  wrap: <T = any>({
    name,
    fetchParams,
    path,
    splitCookie
  }?: Pick<CookieTokenParams, "name" | "splitCookie" | "fetchParams" | "path">, callback?: (value?: string | null) => T | undefined | Promise<T | undefined>) => Promise<T | undefined>;
};
//#endregion
//#region src/token/jwt.d.ts
declare const useMyJwt: () => {
  isJwt: (jwt: string) => boolean;
  cookieDecode: <T extends object>({
    cookie,
    token,
    splitCookie
  }: {
    splitCookie?: CookieParams["split"];
    cookie?: CookieParams["name"];
    token?: CookieParams["value"];
  }) => JWTPayload<T> | null;
};
//#endregion
//#region src/token/storage.d.ts
declare const useMyStorage: (options?: LocalStorageParams) => {
  get: (name: LocalStorageParams["name"]) => LocalStorageParams["value"] | LocalStorageParams[] | null;
  add: ({
    name,
    value,
    items
  }: Pick<LocalStorageParams, "name" | "value" | "items">) => string | null;
  remove: (name: LocalStorageParams["name"]) => boolean;
  change: ({
    name,
    value
  }: Pick<LocalStorageParams, "name" | "value">) => string | null;
  pull: (name: LocalStorageParams["name"]) => LocalStorageParams["value"] | null;
  redirect: (url: string, {
    name,
    value,
    items
  }: Pick<LocalStorageParams, "name" | "value" | "items">) => void;
};
//#endregion
//#region src/token/fetch.d.ts
declare function useMyFetch<T>(url: string, options: NormalFetchOptions$1): Promise<NormalFetchResult$1<T>>;
//#endregion
//#region src/composables/state.d.ts
/**
 * `token` and `refreshToken` are always present (they reset to `{}` rather than vanish),
 * so they stay named and typed. Any other key comes from a custom `jwt` entry in
 * mono.config.ts — type those at the call site with `monoState<Override>()`.
 */
type MonoJwtState = {
  token: Partial<JWTCompleteTokenTypes>;
  refreshToken: Partial<DefaultJWTTokenTypes>;
} & Record<string, Record<string, any>>;
type MonoStateShape = {
  config?: MonoConfig;
  cookie: Record<string, any>;
  jwt: MonoJwtState;
};
declare function monoStatePatch(patch: {
  cookie?: Record<string, any>;
  jwt?: Partial<MonoJwtState>;
}): void;
type DeepMerge<A, B> = { [K in keyof (A & B)]: K extends keyof A ? K extends keyof B ? A[K] extends object ? B[K] extends object ? DeepMerge<A[K], B[K]> : A[K] & B[K] : A[K] & B[K] : A[K] : K extends keyof B ? B[K] : never };
declare function monoState<Override extends object = {}>(): Readonly<Pick<DeepMerge<MonoStateShape, Override>, 'config' | 'cookie' | 'jwt'>>;
declare function monoStateReset(): void;
/**
 * Bridge between mono.config.ts and monoState().
 *
 * This reads:
 * - configured cookies
 * - configured jwt token cookie
 * - configured refresh token cookie
 *
 * Then patches the shared reactive mono state.
 */
declare function initMono(option: MonoConfig): MonoConfig;
declare function monoConfig(): {
  readonly extends?: string | (() => Partial<MonoConfig> | undefined) | {
    readonly config: (() => Partial<MonoConfig> | undefined) | {
      readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
        readonly config?: never | undefined;
        readonly merges?: never | undefined;
        readonly ecosystems?: never | undefined;
      } | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
        readonly config?: never | undefined;
        readonly merges?: never | undefined;
        readonly ecosystems?: never | undefined;
      } | readonly [string, {
        readonly [x: string]: any;
      }])[] | undefined;
      readonly name?: string | undefined;
      readonly type?: MonoAppType | undefined;
      readonly template?: MonoTemplate | undefined;
      readonly skill?: {
        readonly url: string;
        readonly envToken?: string | undefined;
      } | undefined;
      readonly menu?: readonly {
        readonly title: string;
        readonly subtitle?: string | undefined;
        readonly url?: string | undefined;
        readonly icon?: string | undefined;
        readonly color?: string | undefined;
        readonly button?: {
          readonly title?: string | undefined;
          readonly icon?: string | undefined;
        } | undefined;
        readonly items?: readonly /*elided*/any[] | undefined;
        readonly remoteName?: string | undefined;
        readonly visible?: boolean | undefined;
        readonly order?: number | undefined;
        readonly route?: {
          readonly meta: {
            readonly layout: string;
            readonly title: string;
          };
        } | undefined;
      }[] | undefined;
      readonly apps?: readonly {
        readonly name: string;
        readonly url?: string | undefined;
        readonly path?: string | undefined;
        readonly envToken?: string | undefined;
        readonly transport?: MonoSyncTransport | undefined;
        readonly type: MonoAppType;
      }[] | undefined;
      readonly fetching?: {
        readonly api?: {
          readonly [x: string]: {
            readonly type: "restful" | "odata";
            readonly url: string;
            readonly oDataService?: any;
          };
        } | undefined;
        readonly source?: {
          readonly dataSource?: any;
          readonly oDataStore?: any;
          readonly customStore?: any;
        } | undefined;
        readonly auth?: {
          readonly token?: string | undefined;
          readonly tokenRefresh?: string | undefined;
          readonly use?: "token" | "tokenRefresh" | {
            readonly apiRequest?: string | undefined;
            readonly refreshTokenRequest?: string | undefined;
          } | undefined;
          readonly requestRefreshTokenRequest?: {
            readonly name?: string | undefined;
            readonly path: {
              readonly milis?: string | undefined;
              readonly days?: string | undefined;
              readonly value?: string | undefined;
              readonly name?: string | undefined;
            };
            readonly splitCookie?: boolean | undefined;
            readonly fetchParams: {
              readonly url: string;
              readonly options?: {
                readonly [x: string]: any;
                readonly baseUrl?: string | undefined;
              } | undefined;
            };
          } | undefined;
          readonly expiredBehaviour?: "refresh" | undefined;
        } | undefined;
      } | undefined;
      readonly env?: {
        readonly [x: string]: {
          readonly [x: string]: string | number | boolean;
        } | undefined;
        readonly default?: {
          readonly [x: string]: string | number | boolean;
        } | undefined;
      } | undefined;
      readonly mockIndexedDB?: {
        readonly dbName?: string | undefined;
        readonly version?: number | undefined;
        readonly seedCount?: number | undefined;
        readonly seedRandom?: number | undefined;
        readonly schema: {
          readonly [x: string]: {
            readonly [x: string]: {
              readonly fields: {
                readonly [x: string]: string;
              };
              readonly seed?: readonly {
                readonly [x: string]: any;
              }[] | undefined;
            };
          };
        };
      } | undefined;
      readonly renderFn?: (() => import("vue").VNode) | undefined;
      readonly jwt?: {
        readonly [x: string]: {
          readonly name: string | {
            readonly [x: string]: any;
          };
          readonly split?: boolean | undefined;
        } | undefined;
        readonly token?: {
          readonly name: string | {
            readonly USER_ID?: string | undefined;
            readonly USER_NAME?: string | undefined;
            readonly NAME?: string | undefined;
            readonly CHANNEL?: string | undefined;
            readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
            readonly ROLE_ID?: string | undefined;
            readonly ROLE_NAME?: string | undefined;
            readonly ROLE_TYPE?: string | undefined;
            readonly ORG_NAME?: string | undefined;
            readonly JOBPOS_ID?: string | undefined;
            readonly JOBPOS_NAME?: string | undefined;
            readonly JOBLVL_ID?: string | undefined;
            readonly JOBLVL_NAME?: string | undefined;
            readonly COMPANY_DB?: string | undefined;
            readonly DEPT_CODE?: string | undefined;
            readonly IS_SUPERADMIN?: "0" | "1" | undefined;
            readonly COMPANY_ID?: string | undefined;
            readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
            readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
            readonly ALL_COMPANY?: "0" | "1" | undefined;
            readonly ALL_BRAND?: "0" | "1" | undefined;
            readonly ALL_AREA?: "0" | "1" | undefined;
            readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
            readonly USER_BRAND?: string | undefined;
            readonly USER_AREA?: string | undefined;
            readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
            readonly EXPIRED?: string | undefined;
            readonly PERMISSIONS?: string | readonly {
              readonly permId: number;
              readonly module: string;
              readonly canView: boolean;
              readonly canEdit: boolean;
              readonly canDelete: boolean;
              readonly canCreate: boolean;
              readonly canApprove: boolean;
              readonly canReport: boolean;
            }[] | undefined;
            readonly nbf?: number | undefined;
            readonly exp?: number | undefined;
            readonly iat?: number | undefined;
          };
          readonly split?: boolean | undefined;
        } | undefined;
        readonly refreshToken?: {
          readonly name: string | {
            readonly nbf?: number | undefined;
            readonly exp?: number | undefined;
            readonly iat?: number | undefined;
          };
          readonly split?: boolean | undefined;
        } | undefined;
      } | undefined;
      readonly cookie?: readonly {
        readonly name: string;
        readonly split?: boolean | undefined;
      }[] | undefined;
    };
    readonly merges?: readonly MonoMergeableKey[] | undefined;
    readonly ecosystems?: readonly string[] | undefined;
  } | {
    readonly extends?: string | (() => Partial<MonoConfig> | undefined) | {
      readonly config: (() => Partial<MonoConfig> | undefined) | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
      };
      readonly merges?: readonly MonoMergeableKey[] | undefined;
      readonly ecosystems?: readonly string[] | undefined;
    } | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | {
      readonly config: (() => Partial<MonoConfig> | undefined) | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
      };
      readonly merges?: readonly MonoMergeableKey[] | undefined;
      readonly ecosystems?: readonly string[] | undefined;
    } | /*elided*/any | readonly [string, {
      readonly [x: string]: any;
    }])[] | undefined;
    readonly name?: string | undefined;
    readonly type?: MonoAppType | undefined;
    readonly template?: MonoTemplate | undefined;
    readonly skill?: {
      readonly url: string;
      readonly envToken?: string | undefined;
    } | undefined;
    readonly menu?: readonly {
      readonly title: string;
      readonly subtitle?: string | undefined;
      readonly url?: string | undefined;
      readonly icon?: string | undefined;
      readonly color?: string | undefined;
      readonly button?: {
        readonly title?: string | undefined;
        readonly icon?: string | undefined;
      } | undefined;
      readonly items?: readonly /*elided*/any[] | undefined;
      readonly remoteName?: string | undefined;
      readonly visible?: boolean | undefined;
      readonly order?: number | undefined;
      readonly route?: {
        readonly meta: {
          readonly layout: string;
          readonly title: string;
        };
      } | undefined;
    }[] | undefined;
    readonly apps?: readonly {
      readonly name: string;
      readonly url?: string | undefined;
      readonly path?: string | undefined;
      readonly envToken?: string | undefined;
      readonly transport?: MonoSyncTransport | undefined;
      readonly type: MonoAppType;
    }[] | undefined;
    readonly fetching?: {
      readonly api?: {
        readonly [x: string]: {
          readonly type: "restful" | "odata";
          readonly url: string;
          readonly oDataService?: any;
        };
      } | undefined;
      readonly source?: {
        readonly dataSource?: any;
        readonly oDataStore?: any;
        readonly customStore?: any;
      } | undefined;
      readonly auth?: {
        readonly token?: string | undefined;
        readonly tokenRefresh?: string | undefined;
        readonly use?: "token" | "tokenRefresh" | {
          readonly apiRequest?: string | undefined;
          readonly refreshTokenRequest?: string | undefined;
        } | undefined;
        readonly requestRefreshTokenRequest?: {
          readonly name?: string | undefined;
          readonly path: {
            readonly milis?: string | undefined;
            readonly days?: string | undefined;
            readonly value?: string | undefined;
            readonly name?: string | undefined;
          };
          readonly splitCookie?: boolean | undefined;
          readonly fetchParams: {
            readonly url: string;
            readonly options?: {
              readonly [x: string]: any;
              readonly baseUrl?: string | undefined;
            } | undefined;
          };
        } | undefined;
        readonly expiredBehaviour?: "refresh" | undefined;
      } | undefined;
    } | undefined;
    readonly env?: {
      readonly [x: string]: {
        readonly [x: string]: string | number | boolean;
      } | undefined;
      readonly default?: {
        readonly [x: string]: string | number | boolean;
      } | undefined;
    } | undefined;
    readonly mockIndexedDB?: {
      readonly dbName?: string | undefined;
      readonly version?: number | undefined;
      readonly seedCount?: number | undefined;
      readonly seedRandom?: number | undefined;
      readonly schema: {
        readonly [x: string]: {
          readonly [x: string]: {
            readonly fields: {
              readonly [x: string]: string;
            };
            readonly seed?: readonly {
              readonly [x: string]: any;
            }[] | undefined;
          };
        };
      };
    } | undefined;
    readonly renderFn?: (() => import("vue").VNode) | undefined;
    readonly jwt?: {
      readonly [x: string]: {
        readonly name: string | {
          readonly [x: string]: any;
        };
        readonly split?: boolean | undefined;
      } | undefined;
      readonly token?: {
        readonly name: string | {
          readonly USER_ID?: string | undefined;
          readonly USER_NAME?: string | undefined;
          readonly NAME?: string | undefined;
          readonly CHANNEL?: string | undefined;
          readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
          readonly ROLE_ID?: string | undefined;
          readonly ROLE_NAME?: string | undefined;
          readonly ROLE_TYPE?: string | undefined;
          readonly ORG_NAME?: string | undefined;
          readonly JOBPOS_ID?: string | undefined;
          readonly JOBPOS_NAME?: string | undefined;
          readonly JOBLVL_ID?: string | undefined;
          readonly JOBLVL_NAME?: string | undefined;
          readonly COMPANY_DB?: string | undefined;
          readonly DEPT_CODE?: string | undefined;
          readonly IS_SUPERADMIN?: "0" | "1" | undefined;
          readonly COMPANY_ID?: string | undefined;
          readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
          readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
          readonly ALL_COMPANY?: "0" | "1" | undefined;
          readonly ALL_BRAND?: "0" | "1" | undefined;
          readonly ALL_AREA?: "0" | "1" | undefined;
          readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
          readonly USER_BRAND?: string | undefined;
          readonly USER_AREA?: string | undefined;
          readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
          readonly EXPIRED?: string | undefined;
          readonly PERMISSIONS?: string | readonly {
            readonly permId: number;
            readonly module: string;
            readonly canView: boolean;
            readonly canEdit: boolean;
            readonly canDelete: boolean;
            readonly canCreate: boolean;
            readonly canApprove: boolean;
            readonly canReport: boolean;
          }[] | undefined;
          readonly nbf?: number | undefined;
          readonly exp?: number | undefined;
          readonly iat?: number | undefined;
        };
        readonly split?: boolean | undefined;
      } | undefined;
      readonly refreshToken?: {
        readonly name: string | {
          readonly nbf?: number | undefined;
          readonly exp?: number | undefined;
          readonly iat?: number | undefined;
        };
        readonly split?: boolean | undefined;
      } | undefined;
    } | undefined;
    readonly cookie?: readonly {
      readonly name: string;
      readonly split?: boolean | undefined;
    }[] | undefined;
    readonly config?: never | undefined;
    readonly merges?: never | undefined;
    readonly ecosystems?: never | undefined;
  } | readonly (string | (() => Partial<MonoConfig> | undefined) | {
    readonly config: (() => Partial<MonoConfig> | undefined) | {
      readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
        readonly config?: never | undefined;
        readonly merges?: never | undefined;
        readonly ecosystems?: never | undefined;
      } | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
        readonly config?: never | undefined;
        readonly merges?: never | undefined;
        readonly ecosystems?: never | undefined;
      } | readonly [string, {
        readonly [x: string]: any;
      }])[] | undefined;
      readonly name?: string | undefined;
      readonly type?: MonoAppType | undefined;
      readonly template?: MonoTemplate | undefined;
      readonly skill?: {
        readonly url: string;
        readonly envToken?: string | undefined;
      } | undefined;
      readonly menu?: readonly {
        readonly title: string;
        readonly subtitle?: string | undefined;
        readonly url?: string | undefined;
        readonly icon?: string | undefined;
        readonly color?: string | undefined;
        readonly button?: {
          readonly title?: string | undefined;
          readonly icon?: string | undefined;
        } | undefined;
        readonly items?: readonly /*elided*/any[] | undefined;
        readonly remoteName?: string | undefined;
        readonly visible?: boolean | undefined;
        readonly order?: number | undefined;
        readonly route?: {
          readonly meta: {
            readonly layout: string;
            readonly title: string;
          };
        } | undefined;
      }[] | undefined;
      readonly apps?: readonly {
        readonly name: string;
        readonly url?: string | undefined;
        readonly path?: string | undefined;
        readonly envToken?: string | undefined;
        readonly transport?: MonoSyncTransport | undefined;
        readonly type: MonoAppType;
      }[] | undefined;
      readonly fetching?: {
        readonly api?: {
          readonly [x: string]: {
            readonly type: "restful" | "odata";
            readonly url: string;
            readonly oDataService?: any;
          };
        } | undefined;
        readonly source?: {
          readonly dataSource?: any;
          readonly oDataStore?: any;
          readonly customStore?: any;
        } | undefined;
        readonly auth?: {
          readonly token?: string | undefined;
          readonly tokenRefresh?: string | undefined;
          readonly use?: "token" | "tokenRefresh" | {
            readonly apiRequest?: string | undefined;
            readonly refreshTokenRequest?: string | undefined;
          } | undefined;
          readonly requestRefreshTokenRequest?: {
            readonly name?: string | undefined;
            readonly path: {
              readonly milis?: string | undefined;
              readonly days?: string | undefined;
              readonly value?: string | undefined;
              readonly name?: string | undefined;
            };
            readonly splitCookie?: boolean | undefined;
            readonly fetchParams: {
              readonly url: string;
              readonly options?: {
                readonly [x: string]: any;
                readonly baseUrl?: string | undefined;
              } | undefined;
            };
          } | undefined;
          readonly expiredBehaviour?: "refresh" | undefined;
        } | undefined;
      } | undefined;
      readonly env?: {
        readonly [x: string]: {
          readonly [x: string]: string | number | boolean;
        } | undefined;
        readonly default?: {
          readonly [x: string]: string | number | boolean;
        } | undefined;
      } | undefined;
      readonly mockIndexedDB?: {
        readonly dbName?: string | undefined;
        readonly version?: number | undefined;
        readonly seedCount?: number | undefined;
        readonly seedRandom?: number | undefined;
        readonly schema: {
          readonly [x: string]: {
            readonly [x: string]: {
              readonly fields: {
                readonly [x: string]: string;
              };
              readonly seed?: readonly {
                readonly [x: string]: any;
              }[] | undefined;
            };
          };
        };
      } | undefined;
      readonly renderFn?: (() => import("vue").VNode) | undefined;
      readonly jwt?: {
        readonly [x: string]: {
          readonly name: string | {
            readonly [x: string]: any;
          };
          readonly split?: boolean | undefined;
        } | undefined;
        readonly token?: {
          readonly name: string | {
            readonly USER_ID?: string | undefined;
            readonly USER_NAME?: string | undefined;
            readonly NAME?: string | undefined;
            readonly CHANNEL?: string | undefined;
            readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
            readonly ROLE_ID?: string | undefined;
            readonly ROLE_NAME?: string | undefined;
            readonly ROLE_TYPE?: string | undefined;
            readonly ORG_NAME?: string | undefined;
            readonly JOBPOS_ID?: string | undefined;
            readonly JOBPOS_NAME?: string | undefined;
            readonly JOBLVL_ID?: string | undefined;
            readonly JOBLVL_NAME?: string | undefined;
            readonly COMPANY_DB?: string | undefined;
            readonly DEPT_CODE?: string | undefined;
            readonly IS_SUPERADMIN?: "0" | "1" | undefined;
            readonly COMPANY_ID?: string | undefined;
            readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
            readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
            readonly ALL_COMPANY?: "0" | "1" | undefined;
            readonly ALL_BRAND?: "0" | "1" | undefined;
            readonly ALL_AREA?: "0" | "1" | undefined;
            readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
            readonly USER_BRAND?: string | undefined;
            readonly USER_AREA?: string | undefined;
            readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
            readonly EXPIRED?: string | undefined;
            readonly PERMISSIONS?: string | readonly {
              readonly permId: number;
              readonly module: string;
              readonly canView: boolean;
              readonly canEdit: boolean;
              readonly canDelete: boolean;
              readonly canCreate: boolean;
              readonly canApprove: boolean;
              readonly canReport: boolean;
            }[] | undefined;
            readonly nbf?: number | undefined;
            readonly exp?: number | undefined;
            readonly iat?: number | undefined;
          };
          readonly split?: boolean | undefined;
        } | undefined;
        readonly refreshToken?: {
          readonly name: string | {
            readonly nbf?: number | undefined;
            readonly exp?: number | undefined;
            readonly iat?: number | undefined;
          };
          readonly split?: boolean | undefined;
        } | undefined;
      } | undefined;
      readonly cookie?: readonly {
        readonly name: string;
        readonly split?: boolean | undefined;
      }[] | undefined;
    };
    readonly merges?: readonly MonoMergeableKey[] | undefined;
    readonly ecosystems?: readonly string[] | undefined;
  } | {
    readonly extends?: string | (() => Partial<MonoConfig> | undefined) | {
      readonly config: (() => Partial<MonoConfig> | undefined) | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
      };
      readonly merges?: readonly MonoMergeableKey[] | undefined;
      readonly ecosystems?: readonly string[] | undefined;
    } | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | {
      readonly config: (() => Partial<MonoConfig> | undefined) | {
        readonly extends?: string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly (string | (() => Partial<MonoConfig> | undefined) | /*elided*/any | /*elided*/any | readonly [string, {
          readonly [x: string]: any;
        }])[] | undefined;
        readonly name?: string | undefined;
        readonly type?: MonoAppType | undefined;
        readonly template?: MonoTemplate | undefined;
        readonly skill?: {
          readonly url: string;
          readonly envToken?: string | undefined;
        } | undefined;
        readonly menu?: readonly {
          readonly title: string;
          readonly subtitle?: string | undefined;
          readonly url?: string | undefined;
          readonly icon?: string | undefined;
          readonly color?: string | undefined;
          readonly button?: {
            readonly title?: string | undefined;
            readonly icon?: string | undefined;
          } | undefined;
          readonly items?: readonly /*elided*/any[] | undefined;
          readonly remoteName?: string | undefined;
          readonly visible?: boolean | undefined;
          readonly order?: number | undefined;
          readonly route?: {
            readonly meta: {
              readonly layout: string;
              readonly title: string;
            };
          } | undefined;
        }[] | undefined;
        readonly apps?: readonly {
          readonly name: string;
          readonly url?: string | undefined;
          readonly path?: string | undefined;
          readonly envToken?: string | undefined;
          readonly transport?: MonoSyncTransport | undefined;
          readonly type: MonoAppType;
        }[] | undefined;
        readonly fetching?: {
          readonly api?: {
            readonly [x: string]: {
              readonly type: "restful" | "odata";
              readonly url: string;
              readonly oDataService?: any;
            };
          } | undefined;
          readonly source?: {
            readonly dataSource?: any;
            readonly oDataStore?: any;
            readonly customStore?: any;
          } | undefined;
          readonly auth?: {
            readonly token?: string | undefined;
            readonly tokenRefresh?: string | undefined;
            readonly use?: "token" | "tokenRefresh" | {
              readonly apiRequest?: string | undefined;
              readonly refreshTokenRequest?: string | undefined;
            } | undefined;
            readonly requestRefreshTokenRequest?: {
              readonly name?: string | undefined;
              readonly path: {
                readonly milis?: string | undefined;
                readonly days?: string | undefined;
                readonly value?: string | undefined;
                readonly name?: string | undefined;
              };
              readonly splitCookie?: boolean | undefined;
              readonly fetchParams: {
                readonly url: string;
                readonly options?: {
                  readonly [x: string]: any;
                  readonly baseUrl?: string | undefined;
                } | undefined;
              };
            } | undefined;
            readonly expiredBehaviour?: "refresh" | undefined;
          } | undefined;
        } | undefined;
        readonly env?: {
          readonly [x: string]: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
          readonly default?: {
            readonly [x: string]: string | number | boolean;
          } | undefined;
        } | undefined;
        readonly mockIndexedDB?: {
          readonly dbName?: string | undefined;
          readonly version?: number | undefined;
          readonly seedCount?: number | undefined;
          readonly seedRandom?: number | undefined;
          readonly schema: {
            readonly [x: string]: {
              readonly [x: string]: {
                readonly fields: {
                  readonly [x: string]: string;
                };
                readonly seed?: readonly {
                  readonly [x: string]: any;
                }[] | undefined;
              };
            };
          };
        } | undefined;
        readonly renderFn?: (() => import("vue").VNode) | undefined;
        readonly jwt?: {
          readonly [x: string]: {
            readonly name: string | {
              readonly [x: string]: any;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly token?: {
            readonly name: string | {
              readonly USER_ID?: string | undefined;
              readonly USER_NAME?: string | undefined;
              readonly NAME?: string | undefined;
              readonly CHANNEL?: string | undefined;
              readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
              readonly ROLE_ID?: string | undefined;
              readonly ROLE_NAME?: string | undefined;
              readonly ROLE_TYPE?: string | undefined;
              readonly ORG_NAME?: string | undefined;
              readonly JOBPOS_ID?: string | undefined;
              readonly JOBPOS_NAME?: string | undefined;
              readonly JOBLVL_ID?: string | undefined;
              readonly JOBLVL_NAME?: string | undefined;
              readonly COMPANY_DB?: string | undefined;
              readonly DEPT_CODE?: string | undefined;
              readonly IS_SUPERADMIN?: "0" | "1" | undefined;
              readonly COMPANY_ID?: string | undefined;
              readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
              readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
              readonly ALL_COMPANY?: "0" | "1" | undefined;
              readonly ALL_BRAND?: "0" | "1" | undefined;
              readonly ALL_AREA?: "0" | "1" | undefined;
              readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
              readonly USER_BRAND?: string | undefined;
              readonly USER_AREA?: string | undefined;
              readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
              readonly EXPIRED?: string | undefined;
              readonly PERMISSIONS?: string | readonly {
                readonly permId: number;
                readonly module: string;
                readonly canView: boolean;
                readonly canEdit: boolean;
                readonly canDelete: boolean;
                readonly canCreate: boolean;
                readonly canApprove: boolean;
                readonly canReport: boolean;
              }[] | undefined;
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
          readonly refreshToken?: {
            readonly name: string | {
              readonly nbf?: number | undefined;
              readonly exp?: number | undefined;
              readonly iat?: number | undefined;
            };
            readonly split?: boolean | undefined;
          } | undefined;
        } | undefined;
        readonly cookie?: readonly {
          readonly name: string;
          readonly split?: boolean | undefined;
        }[] | undefined;
      };
      readonly merges?: readonly MonoMergeableKey[] | undefined;
      readonly ecosystems?: readonly string[] | undefined;
    } | /*elided*/any | readonly [string, {
      readonly [x: string]: any;
    }])[] | undefined;
    readonly name?: string | undefined;
    readonly type?: MonoAppType | undefined;
    readonly template?: MonoTemplate | undefined;
    readonly skill?: {
      readonly url: string;
      readonly envToken?: string | undefined;
    } | undefined;
    readonly menu?: readonly {
      readonly title: string;
      readonly subtitle?: string | undefined;
      readonly url?: string | undefined;
      readonly icon?: string | undefined;
      readonly color?: string | undefined;
      readonly button?: {
        readonly title?: string | undefined;
        readonly icon?: string | undefined;
      } | undefined;
      readonly items?: readonly /*elided*/any[] | undefined;
      readonly remoteName?: string | undefined;
      readonly visible?: boolean | undefined;
      readonly order?: number | undefined;
      readonly route?: {
        readonly meta: {
          readonly layout: string;
          readonly title: string;
        };
      } | undefined;
    }[] | undefined;
    readonly apps?: readonly {
      readonly name: string;
      readonly url?: string | undefined;
      readonly path?: string | undefined;
      readonly envToken?: string | undefined;
      readonly transport?: MonoSyncTransport | undefined;
      readonly type: MonoAppType;
    }[] | undefined;
    readonly fetching?: {
      readonly api?: {
        readonly [x: string]: {
          readonly type: "restful" | "odata";
          readonly url: string;
          readonly oDataService?: any;
        };
      } | undefined;
      readonly source?: {
        readonly dataSource?: any;
        readonly oDataStore?: any;
        readonly customStore?: any;
      } | undefined;
      readonly auth?: {
        readonly token?: string | undefined;
        readonly tokenRefresh?: string | undefined;
        readonly use?: "token" | "tokenRefresh" | {
          readonly apiRequest?: string | undefined;
          readonly refreshTokenRequest?: string | undefined;
        } | undefined;
        readonly requestRefreshTokenRequest?: {
          readonly name?: string | undefined;
          readonly path: {
            readonly milis?: string | undefined;
            readonly days?: string | undefined;
            readonly value?: string | undefined;
            readonly name?: string | undefined;
          };
          readonly splitCookie?: boolean | undefined;
          readonly fetchParams: {
            readonly url: string;
            readonly options?: {
              readonly [x: string]: any;
              readonly baseUrl?: string | undefined;
            } | undefined;
          };
        } | undefined;
        readonly expiredBehaviour?: "refresh" | undefined;
      } | undefined;
    } | undefined;
    readonly env?: {
      readonly [x: string]: {
        readonly [x: string]: string | number | boolean;
      } | undefined;
      readonly default?: {
        readonly [x: string]: string | number | boolean;
      } | undefined;
    } | undefined;
    readonly mockIndexedDB?: {
      readonly dbName?: string | undefined;
      readonly version?: number | undefined;
      readonly seedCount?: number | undefined;
      readonly seedRandom?: number | undefined;
      readonly schema: {
        readonly [x: string]: {
          readonly [x: string]: {
            readonly fields: {
              readonly [x: string]: string;
            };
            readonly seed?: readonly {
              readonly [x: string]: any;
            }[] | undefined;
          };
        };
      };
    } | undefined;
    readonly renderFn?: (() => import("vue").VNode) | undefined;
    readonly jwt?: {
      readonly [x: string]: {
        readonly name: string | {
          readonly [x: string]: any;
        };
        readonly split?: boolean | undefined;
      } | undefined;
      readonly token?: {
        readonly name: string | {
          readonly USER_ID?: string | undefined;
          readonly USER_NAME?: string | undefined;
          readonly NAME?: string | undefined;
          readonly CHANNEL?: string | undefined;
          readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
          readonly ROLE_ID?: string | undefined;
          readonly ROLE_NAME?: string | undefined;
          readonly ROLE_TYPE?: string | undefined;
          readonly ORG_NAME?: string | undefined;
          readonly JOBPOS_ID?: string | undefined;
          readonly JOBPOS_NAME?: string | undefined;
          readonly JOBLVL_ID?: string | undefined;
          readonly JOBLVL_NAME?: string | undefined;
          readonly COMPANY_DB?: string | undefined;
          readonly DEPT_CODE?: string | undefined;
          readonly IS_SUPERADMIN?: "0" | "1" | undefined;
          readonly COMPANY_ID?: string | undefined;
          readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
          readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
          readonly ALL_COMPANY?: "0" | "1" | undefined;
          readonly ALL_BRAND?: "0" | "1" | undefined;
          readonly ALL_AREA?: "0" | "1" | undefined;
          readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
          readonly USER_BRAND?: string | undefined;
          readonly USER_AREA?: string | undefined;
          readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
          readonly EXPIRED?: string | undefined;
          readonly PERMISSIONS?: string | readonly {
            readonly permId: number;
            readonly module: string;
            readonly canView: boolean;
            readonly canEdit: boolean;
            readonly canDelete: boolean;
            readonly canCreate: boolean;
            readonly canApprove: boolean;
            readonly canReport: boolean;
          }[] | undefined;
          readonly nbf?: number | undefined;
          readonly exp?: number | undefined;
          readonly iat?: number | undefined;
        };
        readonly split?: boolean | undefined;
      } | undefined;
      readonly refreshToken?: {
        readonly name: string | {
          readonly nbf?: number | undefined;
          readonly exp?: number | undefined;
          readonly iat?: number | undefined;
        };
        readonly split?: boolean | undefined;
      } | undefined;
    } | undefined;
    readonly cookie?: readonly {
      readonly name: string;
      readonly split?: boolean | undefined;
    }[] | undefined;
    readonly config?: never | undefined;
    readonly merges?: never | undefined;
    readonly ecosystems?: never | undefined;
  } | readonly [string, {
    readonly [x: string]: any;
  }])[] | undefined;
  readonly name: string;
  readonly type: MonoAppType;
  readonly template?: MonoTemplate | undefined;
  readonly skill?: {
    readonly url: string;
    readonly envToken?: string | undefined;
  } | undefined;
  readonly menu?: readonly {
    readonly title: string;
    readonly subtitle?: string | undefined;
    readonly url?: string | undefined;
    readonly icon?: string | undefined;
    readonly color?: string | undefined;
    readonly button?: {
      readonly title?: string | undefined;
      readonly icon?: string | undefined;
    } | undefined;
    readonly items?: readonly /*elided*/any[] | undefined;
    readonly remoteName?: string | undefined;
    readonly visible?: boolean | undefined;
    readonly order?: number | undefined;
    readonly route?: {
      readonly meta: {
        readonly layout: string;
        readonly title: string;
      };
    } | undefined;
  }[] | undefined;
  readonly apps: readonly {
    readonly name: string;
    readonly url?: string | undefined;
    readonly path?: string | undefined;
    readonly envToken?: string | undefined;
    readonly transport?: MonoSyncTransport | undefined;
    readonly type: MonoAppType;
  }[];
  readonly fetching?: {
    readonly api?: {
      readonly [x: string]: {
        readonly type: "restful" | "odata";
        readonly url: string;
        readonly oDataService?: any;
      };
    } | undefined;
    readonly source?: {
      readonly dataSource?: any;
      readonly oDataStore?: any;
      readonly customStore?: any;
    } | undefined;
    readonly auth?: {
      readonly token?: string | undefined;
      readonly tokenRefresh?: string | undefined;
      readonly use?: "token" | "tokenRefresh" | {
        readonly apiRequest?: string | undefined;
        readonly refreshTokenRequest?: string | undefined;
      } | undefined;
      readonly requestRefreshTokenRequest?: {
        readonly name?: string | undefined;
        readonly path: {
          readonly milis?: string | undefined;
          readonly days?: string | undefined;
          readonly value?: string | undefined;
          readonly name?: string | undefined;
        };
        readonly splitCookie?: boolean | undefined;
        readonly fetchParams: {
          readonly url: string;
          readonly options?: {
            readonly [x: string]: any;
            readonly baseUrl?: string | undefined;
          } | undefined;
        };
      } | undefined;
      readonly expiredBehaviour?: "refresh" | undefined;
    } | undefined;
  } | undefined;
  readonly env?: {
    readonly [x: string]: {
      readonly [x: string]: string | number | boolean;
    } | undefined;
    readonly default?: {
      readonly [x: string]: string | number | boolean;
    } | undefined;
  } | undefined;
  readonly mockIndexedDB?: {
    readonly dbName?: string | undefined;
    readonly version?: number | undefined;
    readonly seedCount?: number | undefined;
    readonly seedRandom?: number | undefined;
    readonly schema: {
      readonly [x: string]: {
        readonly [x: string]: {
          readonly fields: {
            readonly [x: string]: string;
          };
          readonly seed?: readonly {
            readonly [x: string]: any;
          }[] | undefined;
        };
      };
    };
  } | undefined;
  readonly renderFn?: (() => import("vue").VNode) | undefined;
  readonly jwt?: {
    readonly [x: string]: {
      readonly name: string | {
        readonly [x: string]: any;
      };
      readonly split?: boolean | undefined;
    } | undefined;
    readonly token?: {
      readonly name: string | {
        readonly USER_ID?: string | undefined;
        readonly USER_NAME?: string | undefined;
        readonly NAME?: string | undefined;
        readonly CHANNEL?: string | undefined;
        readonly IS_DEPT_HEAD?: "0" | "1" | undefined;
        readonly ROLE_ID?: string | undefined;
        readonly ROLE_NAME?: string | undefined;
        readonly ROLE_TYPE?: string | undefined;
        readonly ORG_NAME?: string | undefined;
        readonly JOBPOS_ID?: string | undefined;
        readonly JOBPOS_NAME?: string | undefined;
        readonly JOBLVL_ID?: string | undefined;
        readonly JOBLVL_NAME?: string | undefined;
        readonly COMPANY_DB?: string | undefined;
        readonly DEPT_CODE?: string | undefined;
        readonly IS_SUPERADMIN?: "0" | "1" | undefined;
        readonly COMPANY_ID?: string | undefined;
        readonly IS_LOCK_BUDGET?: "0" | "1" | undefined;
        readonly ALL_DEPARTMENT?: "0" | "1" | undefined;
        readonly ALL_COMPANY?: "0" | "1" | undefined;
        readonly ALL_BRAND?: "0" | "1" | undefined;
        readonly ALL_AREA?: "0" | "1" | undefined;
        readonly IS_APPROVAL_PROGRAM?: "0" | "1" | undefined;
        readonly USER_BRAND?: string | undefined;
        readonly USER_AREA?: string | undefined;
        readonly TOKEN_KIND?: "ACCESS" | "REFRESH" | undefined;
        readonly EXPIRED?: string | undefined;
        readonly PERMISSIONS?: string | readonly {
          readonly permId: number;
          readonly module: string;
          readonly canView: boolean;
          readonly canEdit: boolean;
          readonly canDelete: boolean;
          readonly canCreate: boolean;
          readonly canApprove: boolean;
          readonly canReport: boolean;
        }[] | undefined;
        readonly nbf?: number | undefined;
        readonly exp?: number | undefined;
        readonly iat?: number | undefined;
      };
      readonly split?: boolean | undefined;
    } | undefined;
    readonly refreshToken?: {
      readonly name: string | {
        readonly nbf?: number | undefined;
        readonly exp?: number | undefined;
        readonly iat?: number | undefined;
      };
      readonly split?: boolean | undefined;
    } | undefined;
  } | undefined;
  readonly cookie?: readonly {
    readonly name: string;
    readonly split?: boolean | undefined;
  }[] | undefined;
} | undefined;
/**
 * The active-environment values from `mono.config.ts`'s `env` block, resolved
 * for the current `NODE_ENV` (see {@link resolveEnv}) and merged across the
 * host+remote `extends` chain.
 *
 * - `monoEnv()` returns the whole flattened object.
 * - `monoEnv('API_BASE')` returns a single value (or `undefined`).
 *
 * Use it for non-secret, environment-specific values (e.g. an API base URL)
 * instead of a `.env` file — e.g. `fetching.api.main.url` can be built from
 * `monoEnv('API_BASE')`.
 */
declare function monoEnv(): Record<string, string | number | boolean>;
declare function monoEnv<T = string | number | boolean>(key: string): T | undefined;
/**
 * Vue plugin version.
 *
 * Usage:
 *
 * createApp(App)
 *   .use(createMono(config))
 *   .mount('#app')
 */
declare function createMono(option: MonoConfig): Plugin;
//#endregion
//#region src/composables/nuxt-state.d.ts
/**
 * Shared, keyed reactive state — the Vue/Vite stand-in for Nuxt's `useState`.
 *
 *   const count = useState('count', () => 0)   // shared by key
 *   const local = useState(() => 'hello')      // plain ref('hello')
 *
 * Differences from Nuxt's: no SSR payload (nothing to hydrate in a SPA), and a
 * missing/empty key is tolerated instead of throwing — Nuxt's build-time auto-key
 * transform never ran on this code, so `useState('', () => 'hello')` can only mean
 * "an unshared `ref('hello')`".
 *
 * `init` runs ONLY the first time a key is seen (as in Nuxt); later callers get
 * the existing ref untouched, even if their `init` differs. Returning a ref from
 * `init` adopts that ref rather than nesting it.
 */
declare function useState<T = any>(init?: (() => T | Ref$1<T>) | T): Ref$1<T>;
declare function useState<T = any>(key: string, init?: (() => T | Ref$1<T>) | T): Ref$1<T>;
/** Explicit alias — for hosts that don't want the bare Nuxt name in scope. */
declare const monoUseState: typeof useState;
/**
 * Drop keyed state so the next `useState(key, init)` re-runs `init` (Nuxt's
 * `clearNuxtState`). No argument clears everything; a predicate filters by key.
 *
 * Only the registry entry goes — refs already handed out keep working, they're
 * just no longer what that key resolves to.
 */
declare function clearNuxtState(keys?: string | string[] | ((key: string) => boolean)): void;
/** The live keyed refs — for devtools/debugging, not app logic. */
declare function nuxtStateKeys(): string[];
//#endregion
//#region src/composables/combine-layout.d.ts
interface SidebarMenu {
  title: string;
  subtitle?: string;
  url?: string;
  icon?: string;
  color?: string;
  button?: {
    title?: string;
    icon?: string;
  };
  items?: SidebarMenu[];
  remoteName?: string;
  visible?: boolean;
  order?: number;
  route?: {
    meta: {
      layout: string;
      title: string;
    };
  };
}
declare let defineLayout: ({
  menu,
  routes
}: {
  menu: SidebarMenu[];
  routes: RouteRecordRaw[];
}) => RouteRecordRaw[];
//#endregion
//#region src/composables/host-provider.d.ts
type HostKey<T> = string | symbol | InjectionKey<Ref$1<T>>;
type InjectHostOptions<T> = {
  key: HostKey<T>;
  defaultValue: T;
};
type HostProviderOptions<T> = {
  key: HostKey<T>;
  syncRef: Ref$1<T>;
  immediate?: boolean;
  deep?: boolean;
  resetOnUnmount?: boolean;
  resetValue?: T;
  deleteOnUnmount?: boolean;
};
declare function monoInject<T>(options: InjectHostOptions<T>): Ref$1<T>;
declare function monoProvide<T>(options: HostProviderOptions<T>): Ref$1<T>;
//#endregion
//#region src/composables/use-mono-utility.d.ts
/**
 * The shared helper surface — validation (Yup), notifications, list/DataSource
 * add-update-remove, OData filters, JSON parsing — combined into `@mono-lit/utility` so
 * apps import from one place:
 *
 * ```ts
 * import { useMonoUtility } from '@mono-lit/utility/runtime'
 * const { validateAllSchema, notif, replacerData } = useMonoUtility()
 * ```
 *
 * Same surface as the core `useUtils()` (src/core); `useMonoUtility` is the public name.
 */
declare const useMonoUtility: () => {
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
    items: MaybeRef<import("@mono-lit/devextreme").DataSource<ComT_1, any> | null> | {
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
    encode?: boolean;
    filter: string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | (string | number | boolean | Date | /*elided*/any | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined)[] | [string, string, any] | null | undefined;
  }) => string;
};
//#endregion
//#region src/components/MonoNotivue.vue.d.ts
declare const __VLS_export: import("vue").DefineComponent<{}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const _default$1: typeof __VLS_export;
//#endregion
export { type Col, type Col as MonoDataGridCol, type CustomSummary, type DataGrid, type DataGrid as MonoDataGridTypes, type FetchLoading, type FetchOData, type FetchParam, type FilterExpression, type Format, type GroupTemplate, type HeaderFilter, type LoopTemplate, type createStaticDatasource as MonoCreateStaticDatasource, type FetchOverrides as MonoFetchOverrides, type NormalFetchOptions as MonoNormalFetchTypes, type NormalFetchOptions, _default as MonoNotifAction, type MonoNotifActionProps as MonoNotifActionPropsTypes, type MonoNotifActionTypes, type MonoNotifButton as MonoNotifButtonTypes, type NotifProps as MonoNotifPropsTypes, type NotifProps, _default$1 as MonoNotivue, type OdataFetchTypes as MonoOdataFetchTypes, type OdataFetchTypes, type OdataFetchUniqueTypes as MonoOdataFetchUniqueTypes, type OdataMapTypes as MonoOdataMapTypes, type OdataMapTypes, type MonoPrefetchBridge, type MonoPrefetchRequest, type MonoRequestEvent, type SchemaObject as MonoSchemaObject, type SchemaObject, type LoadChunkStoreArgs as MonoStoreChunkTypes, type TanstackFetchOptions as MonoTanstackFetchTypes, type TanstackFetchOptions, type TryCatchDatasourceParams as MonoTryCatchDatasourceTypes, type UseOdataStaticOpts as MonoUseOdataStaticTypes, type ValidateErrorComplex as MonoValidateError, type ValidateErrorComplex, type ValidateErrorSingle as MonoValidateErrorSingle, type ValidateErrorSingle, type NormalFetchResult, type PathValue, type Schema, type SchemaType, type ValidateError, type ValidateErrorItem, type ValidateSchema, clearNuxtState, type createFetcher, createMono, type createUniqueFetcher, defineLayout, type extractErrorMessage, type useNormalFetch as fetchNormal, type useFetchOData as fetchOData, type getPrefetchBridge, initMono, type loadChuckStore, monoConfig, monoCookie, monoEnv, monoInject, monoJwt, monoProvide, monoState, monoStatePatch, monoStateReset, monoStorage, monoToken, monoUseState, nuxtStateKeys, type parseDxError, type promiseWrapper, setMonoEventResolver, type setPrefetchBridge, type tryCatchDatasource, useMonoUtility, useMonoUtility as useMonoUtils, useMyCookie, useMyFetch, useMyJwt, useMyStorage, useMyToken, useState, useHelper as useUtils };