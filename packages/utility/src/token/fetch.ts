// src/fetch.ts — environment-agnostic fetch wrapper (runs on client and server).
// Moved verbatim from the old index.ts.

import type { NormalFetchOptions, NormalFetchResult } from './types'

export async function useMyFetch<T>(url: string, options: NormalFetchOptions): Promise<NormalFetchResult<T>> {
    let response: Response | null = null

    try {

        response = await fetch((options?.baseUrl) + url, {
            ...options,
            headers: {
                ...options?.headers,
                'Content-Type': 'application/json',
                ...((options?.token) && { Authorization: `Bearer ${(options.token)}` })
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                if (options?.unauthCall) options.unauthCall()
            }

            const errorResponse = await response.json();
            const error = errorResponse?.Message || errorResponse?.message || errorResponse?.Error || errorResponse || 'Terjadi kesalahan!.'
            const errorReturn = typeof error === 'string' ? error : JSON.stringify(error)

            const respon = { message: errorReturn, statusCode: response.status, data: null, all: null }
            if (options.callback) options.callback({ message: errorReturn, statusCode: response.status, data: null, all: null });

            return respon;
        } else {
            const raw = await response.text()
            let responseData: T | null
            try {
                responseData = raw === '' ? null : (JSON.parse(raw) as T);
            } catch {
                responseData = raw as T;
            }

            const respon = {
                //@ts-ignore
                data: responseData?.data,
                statusCode: response.status,
                //@ts-ignore
                message: responseData?.message || null,
                //@ts-ignore
                all: responseData
            };

            if (options.callback) options.callback(respon);

            return respon
        }
    } catch (error: any) {
        const respon = { message: error?.message || "Tejadi kesalahan!.", statusCode: 500, data: null, all: null }
        if (options.callback) options.callback(respon);

        return { message: error?.message || "Tejadi kesalahan!.", statusCode: 500, data: null, all: null };
    }
}
