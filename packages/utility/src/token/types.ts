// src/types.ts — shared type definitions (moved verbatim from the old index.ts).

export interface CookieParams {
    name: string,
    value: string,
    days?: number,
    milis?: number
    split?: boolean | string,
    splitEvery?: number
}

export type MonoFetchCookieOptions = {
    name?: CookieTokenParams['name'],
    path?: CookieTokenParams['path'],
    fetchParams?: CookieTokenParams['fetchParams'],
    splitCookie?: boolean
}

export type JWTPayload<T extends object> = T & {
    nbf: string;
    exp: string;
    iat: string;
}

export interface FetchParam {
    method: string,
    url: string
    params?: Object,
    body?: Object,
}

export interface RequestParam extends RequestInit {
    token?: string,
    baseUrl?: string
}

export interface LocalStorageParams {
    name?: string | string[] | RegExp
    value?: any,
    items?: LocalStorageParams[],
    type?: 'local' | 'session'
}

export type NormalFetchOptions = RequestInit & {
    token?: string,
    baseUrl?: string
    unauthCall?: () => void,
    callback?: (item: NormalFetchResult<Record<string, any>>) => void
}

export interface CookieTokenParams {
    name?: string,
    value?: string,
    days?: number,
    milis?: number,
    path?: { milis?: string, days?: string, value?: string, name?: string },
    fetchParams?: { url?: string, options?: NormalFetchOptions | undefined },
    splitCookie?: boolean
}

export type NormalFetchResult<T> = {
    statusCode: number;
    data: T | null;
    message: string | null;
    all: any
};
