// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'

import { jwtExample } from './token-fixtures/utils'
import { useMyCookie, useMyJwt, useMyToken, useMyStorage, useMyFetch } from '../src/token'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'


let initFetch = (url: string) => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const filePath = path.resolve(__dirname, url)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
}

const parsedFetchJwt = initFetch('./token-fixtures/jwt_token.json')
const parsedFetchSession = initFetch('./token-fixtures/session_token.json')
const parsedFetchAdaptUi = initFetch('./token-fixtures/adapt_ui.json')
const parsedFetchSessionConfig = initFetch('./token-fixtures/session_config.json')

const server = setupServer(

    http.get('/session_config.json', () => {
        return HttpResponse.json(parsedFetchSessionConfig)
    }),

    http.get('/adapt_ui.json', () => {
        return HttpResponse.json(parsedFetchAdaptUi)
    }),

    http.get('/jwt_token.json', () => {
        return HttpResponse.json(parsedFetchJwt)
    }),

    http.get('/session_token.json', () => {
        return HttpResponse.json(parsedFetchSession)
    })
)


describe('test auth libs', () => {

    beforeAll(() => server.listen())
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())


    beforeEach(() => {
        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        })
    })

    test('should be detect jwt', () => {
        expect(useMyJwt().isJwt.test(jwtExample)).toBeTruthy()
    })

    test('should add,get,remove cookie', () => {
        const cookie = useMyCookie()

        const setCookie = cookie.add({ name: 'test', value: jwtExample, days: 1 })
        const getCookie = cookie.get('test')
        const removeCookie = cookie.remove('test')

        expect(setCookie && getCookie && removeCookie).toBeTruthy()
    })

    test('should decode jwt cookie', () => {

        const cookie = useMyCookie()
        cookie.add({ name: 'test', value: jwtExample, days: 1 })
        cookie.get('test')

        const decodeToken = useMyJwt().cookieDecode({ token: jwtExample })
        const decodeCookie = useMyJwt().cookieDecode({ cookie: 'test' })


        expect(decodeCookie && decodeToken).toBeTruthy()
        expect(decodeCookie).toEqual({
            USER_ID: 1,
            USER_CODE: 'ADMIN',
            USER_NAME: 'Administrator',
            COMPANY_DB: 'SBODEMOAU',
            COMPANY_NAME: 'SBO DEMO AU',
            COMPANY_LOGO: 'CompanyLogo/SBODEMOAU',
            ROLE_ID: 1,
            ROLE_CODE: 'Admin',
            ACCESS: [
                'Header/O/RW',
                'Page/Approver/MO',
                'Page/Approver/TO',
                'Page/Dashboard',
                'Page/MO',
                'Page/PickList',
                'Page/TO',
                'Page/Upload',
                'Page/User',
                'Tab/Activity/RW',
                'Tab/Marketing/RW',
                'Tab/Transport/RW',
                'Table/PickList/Download',
                'Table/PickList/Process',
                'Table/PickList/RW'
            ],
            LOGIN_HASH: '6ce9290d70893dcde05a2531c070e61d',
            nbf: 1709542315,
            exp: 1712134315,
            iat: 1709542315
        })

    })

    test('should set,get useMyToken', () => {

        const token = useMyToken()
        const setToken = token.add({ name: 'test', value: jwtExample, days: 1 })
        const getToken = token.get('test')
        const decodeToken = token.decode('test')

        expect(setToken && getToken && decodeToken).toBeTruthy()

    })

    test('should validate useMyToken', () => {
        const token = useMyToken()
        const setToken = token.add({ name: 'test', value: jwtExample, days: 1 })
        const validateToken = token.validate('test')
        expect(validateToken && setToken).toBeFalsy()
    })

    test('should replace useMyToken', () => {

        const token = useMyToken()
        const setToken = token.add({ name: 'test', value: jwtExample, days: 1 })

        const replaceToken = token.replace({ name: 'test-replace', value: 'new value', days: 1 })

        const getToken = token.get('test-replace')

        expect(getToken).toEqual('new value')

        expect(setToken && replaceToken).toBeTruthy()

    })

    test('should fetching', async () => {

        const token = useMyToken()

        const result = await token.fetch({
            name: 'test',
            path: { milis: 'exp', value: 'token' },
            fetchParams: { url: '/jwt_token.json' }
        })

        const getToken = token.get('test')

        expect(getToken && result).toBeTruthy()


    })



    test('the wrap should return the token', async () => {

        const sessionToken = useMyToken()

        const result = await sessionToken.wrap(({
            name: 'test_session',
            path: { milis: 'result.exp', value: 'result.token' },
            fetchParams: { url: '/session_token.json' }
        }), async (token) => {
            expect(token).toMatch(useMyJwt().isJwt)
            if (token) {
                return await useMyFetch('/jwt_token.json', { token })
            }
        })

        expect(result).toEqual({
            data: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVU0VSX0lEIjoxLCJVU0VSX0NPREUiOiJBRE1JTiIsIlVTRVJfTkFNRSI6IkFkbWluaXN0cmF0b3IiLCJDT01QQU5ZX0RCIjoiU0JPX0dDVV9PTVMiLCJDT01QQU5ZX05BTUUiOiJTQk9fR0NVX09NUyIsIkNPTVBBTllfTE9HTyI6IkNvbXBhbnlMb2dvL1NCT19HQ1VfT01TIiwiUk9MRV9JRCI6MSwiUk9MRV9DT0RFIjoiQWRtaW4iLCJBQ0NFU1MiOlsiVGFibGUvVHJhbnNwb3J0ZXJQcmljZS9SVyIsIkRhc2hib2FyZC9CZXJhdFRlcmltYSIsIkRhc2hib2FyZC9CTF9SZXNlcnZlRGV0YWlsIiwiRGFzaGJvYXJkL0RPX0NhbmNlbERldGFpbCIsIkRhc2hib2FyZC9GdWxmaWxsbWVudCIsIkRhc2hib2FyZC9PdXRzdGFuZGluZ1NKIiwiRGFzaGJvYXJkL1NoaXBtZW50RnJhbmNvIiwiRGFzaGJvYXJkL1NoaXBtZW50TG9jbyIsIkRhc2hib2FyZC9TaGlwbWVudFRvdGFsIiwiRGFzaGJvYXJkL1NPX0RldGFpbHMiLCJEYXNoYm9hcmQvVE9fQWN0aXZpdHkiLCJHUklSL1JXIiwiSGVhZGVyL08vTUMiLCJIZWFkZXIvTy9SVyIsIkxPL0FQUF9ERU1BTkQvUlciLCJMTy9BUFBfSU5CT1VORC9SVyIsIkxPL0FQUF9PVVRCT1VORC9SVyIsIkxPL0FQUF9UUkFOU1BPUlQvUEFHRSIsIkxPL0FQUF9UUkFOU1BPUlQvUlciLCJMTy9CRU5DSE1BUktfUFJJQ0UvUEFHRSIsIkxPL0lOQk9VTkQvUEFHRSIsIkxPL0lOQk9VTkQvUlciLCJMTy9JTkRFWC9QQUdFIiwiTE8vT1VUQk9VTkQvUEFHRSIsIkxPL09VVEJPVU5EL1JXIiwiTE8vVU5JVC9QQUdFIiwiTE8vVU5JVC9SVyIsIlBhZ2UvQXBwcm92ZXIvTU8iLCJQYWdlL0FwcHJvdmVyL1RPIiwiUGFnZS9EYXNoYm9hcmQiLCJQYWdlL0dSSVIiLCJQYWdlL0dSSVIvQXBwcm92ZUNMIiwiUGFnZS9HUklSL0FwcHJvdmVJTiIsIlBhZ2UvR1JJUi9TY2hlZHVsZXIiLCJQYWdlL01lbnUiLCJQYWdlL01PIiwiUGFnZS9QaWNrTGlzdCIsIlBhZ2UvUG9ydFJlY2VpdmUiLCJQYWdlL1RPIiwiUGFnZS9UcmFuc3BvcnRlclByaWNlIiwiUGFnZS9VcGxvYWQiLCJQYWdlL1VzZXIiLCJQb3J0UmVjZWl2ZS9SVyIsIlJvdy9DYW5jZWwiLCJUYWIvQWN0aXZpdHkvUlciLCJUYWIvQ2hhbmdlTG9nIiwiVGFiL01hcmtldGluZy9SVyIsIlRhYi9UcmFuc3BvcnQvUlciLCJUYWJsZS9QaWNrbGlzdC9BZGR0RWRpdCIsIlRhYmxlL1BpY2tMaXN0L0Rvd25sb2FkIiwiVGFibGUvUGlja0xpc3QvUHJvY2VzcyIsIlRhYmxlL1BpY2tMaXN0L1JXIiwiTE8vSU5ERVgvUlciXSwiTE9HSU5fSEFTSCI6IjMzNmVhYWMzZmJiOWNlNmRjOTgyZGYwYzQ1ZTQ5ZTQ5IiwiQ0hBTkdFX0FUX0xPR0lOIjpmYWxzZSwibmJmIjoxNzQwMzY2MTI1LCJleHAiOjE3NDI5NTgxMjUsImlhdCI6MTc0MDM2NjEyNX0.sb5c9MaV6u2Uz0BoKRhQrgS9mGt1k-RbOiUxgkGs0RI",
                exp: 1712134315
            },
            statusCode: 200,
            error: null
        })

    })


    test('should works even using global options', async () => {

        const tokenss = useMyToken({ name: 'test', days: 1, path: { milis: 'exp', value: 'token' }, fetchParams: { url: '/jwt_token.json' } })

        const fetchToken = await tokenss.fetch()
        const setToken = tokenss.add({ value: jwtExample })
        const getToken = tokenss.get()
        const validateToken = tokenss.validate()
        const decodeToken = tokenss.decode()

        const replaceToken = tokenss.replace({ value: 'new value' })
        expect(setToken && getToken && decodeToken && !validateToken && replaceToken && fetchToken).toBeTruthy()

        const getNewToken = tokenss.get()

        expect(getNewToken).toEqual('new value')


        const tokensss = useMyToken({
            name: 'testsession',

            fetchParams: { url: '/session_token.json' }
        })

        await tokensss.wrap({
            path: { milis: 'result.exp', value: 'result.token' },
        }, (token) => {
            expect(token).toMatch(useMyJwt().isJwt)
        })
    })

    test('should be get,add, remove localstorage', () => {

        const myStorage = useMyStorage()

        const addStorage = myStorage.add({ name: 'test', value: 'test_storage' })
        const changeStorage = myStorage.change({ name: 'test', value: 'test_storage_changed' })
        const addStorages = myStorage.add({
            items: [
                { name: 'test1', value: 'test_storage1' },
                { name: 'test2', value: 'test_storage2' },
                { name: 'test3', value: 'test_storage3' },
                { name: 'test4', value: 'test_storage4' }
            ]
        })

        expect(addStorage && addStorages).toBeTruthy()

        const getStorage = myStorage.get('test')
        const getStorages = myStorage.get(['test1', 'test2', 'test3', 'test4'])
        const getStorageRegex = myStorage.get(/test/)

        expect(getStorage).toEqual('test_storage_changed')
        expect(getStorages).toEqual([
            { name: 'test1', value: 'test_storage1' },
            { name: 'test2', value: 'test_storage2' },
            { name: 'test3', value: 'test_storage3' },
            { name: 'test4', value: 'test_storage4' }
        ])

        expect(getStorageRegex).toEqual([
            { name: 'test', value: 'test_storage_changed' },
            { name: 'test1', value: 'test_storage1' },
            { name: 'test2', value: 'test_storage2' },
            { name: 'test3', value: 'test_storage3' },
            { name: 'test4', value: 'test_storage4' }
        ])

        const pullStorage = myStorage.pull('test2')

        expect(pullStorage).toEqual('test_storage2')
        expect(myStorage.get('test2')).toBeNull()

        myStorage.remove('test')
        myStorage.remove(['test1'])
        myStorage.remove(/test/)

        const checkStorageRegex = myStorage.get(/test/)



        expect(checkStorageRegex).toBeNull()

    })

    test('should be get,add, remove sessionstorage', () => {

        const myStorage = useMyStorage({ type: 'session' })

        const addStorage = myStorage.add({ name: 'test', value: 'test_storage' })
        const changeStorage = myStorage.change({ name: 'test', value: 'test_storage_changed' })

        const addStorages = myStorage.add({
            items: [
                { name: 'test1', value: 'test_storage1' },
                { name: 'test2', value: 'test_storage2' },
                { name: 'test3', value: 'test_storage3' },
                { name: 'test4', value: 'test_storage4' }
            ]
        })

        expect(addStorage && addStorages && changeStorage).toBeTruthy()

        const getStorage = myStorage.get('test')
        const getStorages = myStorage.get(['test1', 'test2', 'test3', 'test4'])
        const getStorageRegex = myStorage.get(/test/)


        expect(getStorage).toEqual('test_storage_changed')
        expect(getStorages).toEqual([
            { name: 'test1', value: 'test_storage1' },
            { name: 'test2', value: 'test_storage2' },
            { name: 'test3', value: 'test_storage3' },
            { name: 'test4', value: 'test_storage4' }
        ])

        expect(getStorageRegex).toEqual([
            { name: 'test', value: 'test_storage_changed' },
            { name: 'test1', value: 'test_storage1' },
            { name: 'test2', value: 'test_storage2' },
            { name: 'test3', value: 'test_storage3' },
            { name: 'test4', value: 'test_storage4' }
        ])

        const pullStorage = myStorage.pull('test2')

        expect(pullStorage).toEqual('test_storage2')
        expect(myStorage.get('test2')).toBeNull()

        myStorage.remove('test')
        myStorage.remove(['test1'])
        myStorage.remove(/test/)

        const checkStorageRegex = myStorage.get(/test/)
        expect(checkStorageRegex).toBeNull()
    })


    test.skip('should fetch data', async () => {

        const { data: dataAdaptUi } = await useMyFetch<{ name: string, value: string }[]>('/adapt_ui.json')

        const localStr = useMyStorage({ type: 'local' })

        if (dataAdaptUi) {

            const addLocalStr = localStr.add({ items: dataAdaptUi })

            if (addLocalStr) {
                const sessionStr = useMyStorage({ type: 'session' })


                const { data: dataSessionConfig } = await useMyFetch<any>('/session_config.json')

                if (dataSessionConfig) {

                    sessionStr.add({ name: 'sap.ui.fl.info.bsc', value: dataSessionConfig })

                    sessionStr.change({ name: 'sap.ui.fl.info.bsc', value: { version: "id_updated" } })

                    console.log(sessionStr.get('sap.ui.fl.info.bsc'))

                }

            }


        }










    })

})
