//#region src/token/types.d.ts
interface CookieParams {
  name: string;
  value: string;
  days?: number;
  milis?: number;
  split?: boolean | string;
  splitEvery?: number;
}
type MonoFetchCookieOptions = {
  name?: CookieTokenParams['name'];
  path?: CookieTokenParams['path'];
  fetchParams?: CookieTokenParams['fetchParams'];
  splitCookie?: boolean;
};
type JWTPayload<T extends object> = T & {
  nbf: string;
  exp: string;
  iat: string;
};
interface LocalStorageParams {
  name?: string | string[] | RegExp;
  value?: any;
  items?: LocalStorageParams[];
  type?: 'local' | 'session';
}
type NormalFetchOptions = RequestInit & {
  token?: string;
  baseUrl?: string;
  unauthCall?: () => void;
  callback?: (item: NormalFetchResult<Record<string, any>>) => void;
};
interface CookieTokenParams {
  name?: string;
  value?: string;
  days?: number;
  milis?: number;
  path?: {
    milis?: string;
    days?: string;
    value?: string;
    name?: string;
  };
  fetchParams?: {
    url?: string;
    options?: NormalFetchOptions | undefined;
  };
  splitCookie?: boolean;
}
type NormalFetchResult<T> = {
  statusCode: number;
  data: T | null;
  message: string | null;
  all: any;
};
//#endregion
export { MonoFetchCookieOptions as a, LocalStorageParams as i, CookieTokenParams as n, NormalFetchOptions as o, JWTPayload as r, NormalFetchResult as s, CookieParams as t };