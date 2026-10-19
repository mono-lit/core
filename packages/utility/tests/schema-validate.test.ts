import { describe, expect, test, vi } from 'vitest'
import * as yup from 'yup'
import * as v from 'valibot'
import { ref } from 'vue'
import { useHelper } from '../src/core/composables/use-helper'
import { parsePath } from '../src/core/composables/schema-validate'

const { validateAllSchema, validateSchema, validateAllSchemaCheck, clearSchemaValidation } = useHelper()

const slot = () => ({ valid: true, message: '' })
const makeError = () => ({
    username: slot(),
    password: slot(),
    address: { city: slot() },
    items: [{ name: slot() }],
})

// The SAME form described by both libraries — every test runs against both.
const yupSchema = yup.object({
    username: yup.string().required('Username is required'),
    password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
    address: yup.object({ city: yup.string().required('City is required') }),
    items: yup.array(yup.object({ name: yup.string().required('Item name is required') })),
})

const valibotSchema = v.object({
    username: v.pipe(v.string(), v.nonEmpty('Username is required')),
    password: v.pipe(v.string(), v.nonEmpty('Password is required'), v.minLength(6, 'Min 6 characters')),
    address: v.object({ city: v.pipe(v.string(), v.nonEmpty('City is required')) }),
    items: v.array(v.object({ name: v.pipe(v.string(), v.nonEmpty('Item name is required')) })),
})

const validInput = () => ({ username: 'ann', password: 'secret1', address: { city: 'Jakarta' }, items: [{ name: 'a' }] })

describe.each([
    ['yup', yupSchema],
    ['valibot', valibotSchema],
] as const)('%s', (_name, schema) => {
    test('validateAllSchema flags non-empty failures, nested + array paths', async () => {
        const error = makeError()
        const input = { username: '', password: 'abc', address: { city: '' }, items: [{ name: '' }] }
        const cb = vi.fn()
        const ok = await validateAllSchema({ schema, input, error }, cb)

        expect(ok).toBe(false)
        expect(cb).not.toHaveBeenCalled()
        expect(error.username).toEqual({ valid: false, message: 'Username is required' })
        expect(error.password).toEqual({ valid: false, message: 'Min 6 characters' })
        expect(error.address.city).toEqual({ valid: false, message: 'City is required' })
        expect(error.items[0]!.name).toEqual({ valid: false, message: 'Item name is required' })
        expect(validateAllSchemaCheck(error)).toBe(true)
    })

    test('stale errors clear on revalidation; callback awaited when valid', async () => {
        const error = makeError()
        await validateAllSchema({ schema, input: { ...validInput(), username: '' }, error })
        expect(error.username.valid).toBe(false)

        let done = false
        const ok = await validateAllSchema({ schema, input: validInput(), error }, async () => {
            await new Promise((r) => setTimeout(r, 5))
            done = true
        })
        expect(ok).toBe(true)
        expect(done).toBe(true)
        expect(error.username).toEqual({ valid: true, message: '' })
        expect(validateAllSchemaCheck(error)).toBe(false)
    })

    test('keys absent from input are not validated', async () => {
        const error = { username: slot(), password: slot() }
        const ok = await validateAllSchema({ schema, input: { username: 'ann', password: 'secret1' }, error })
        expect(ok).toBe(true)
        expect(error.password.valid).toBe(true)
    })

    test('validateSchema: single field, true when valid, flags non-empty failures', async () => {
        const error = makeError()
        const input = { ...validInput(), password: 'abc', username: '' }
        expect(await validateSchema({ schema, field: 'password', input, error })).toBe(false)
        expect(error.password).toEqual({ valid: false, message: 'Min 6 characters' })
        // other fields untouched
        expect(error.username.valid).toBe(true)

        input.password = 'secret1'
        const cb = vi.fn()
        expect(await validateSchema({ schema, field: 'password', input, error }, cb)).toBe(true)
        expect(error.password).toEqual({ valid: true, message: '' })
        expect(cb).toHaveBeenCalledOnce()
    })

    test('validateSchema: dotted and indexed paths', async () => {
        const error = makeError()
        const input = { ...validInput(), address: { city: '' }, items: [{ name: '' }] }
        expect(await validateSchema({ schema, field: 'address.city', input, error })).toBe(false)
        expect(error.address.city.message).toBe('City is required')
        expect(await validateSchema({ schema, field: 'items[0].name', input, error })).toBe(false)
        expect(error.items[0]!.name.message).toBe('Item name is required')
    })
})

describe('valibot specifics', () => {
    test('cross-field forward + partialCheck lands on the target field', async () => {
        const schema = v.pipe(
            v.object({ password: v.string(), confirm: v.string() }),
            v.forward(
                v.partialCheck([['password'], ['confirm']], (i) => i.password === i.confirm, 'Passwords do not match'),
                ['confirm'],
            ),
        )
        const error = { password: slot(), confirm: slot() }
        const input = { password: 'secret1', confirm: 'nope' }
        expect(await validateSchema({ schema, field: 'confirm', input, error })).toBe(false)
        expect(error.confirm.message).toBe('Passwords do not match')
        expect(await validateAllSchema({ schema, input: { password: 'x', confirm: 'x' }, error })).toBe(true)
    })

    test('async schemas are awaited', async () => {
        const taken = new Set(['admin'])
        const schema = v.objectAsync({
            username: v.pipeAsync(
                v.string(),
                v.checkAsync(async (u) => { await new Promise((r) => setTimeout(r, 5)); return !taken.has(u) }, 'Username taken'),
            ),
        })
        const error = { username: slot() }
        expect(await validateAllSchema({ schema, input: { username: 'admin' }, error })).toBe(false)
        expect(error.username.message).toBe('Username taken')
        expect(await validateSchema({ schema, field: 'username', input: { username: 'ann' }, error })).toBe(true)
    })
})

describe('clearSchemaValidation', () => {
    const dirty = () => {
        const e = makeError()
        e.username = { valid: false, message: 'x' }
        e.address.city = { valid: false, message: 'x' }
        e.items[0]!.name = { valid: false, message: 'x' }
        return e
    }

    test('clears a plain nested object', () => {
        const e = dirty()
        clearSchemaValidation({ error: e })
        expect(validateAllSchemaCheck(e)).toBe(false)
        expect(e.address.city).toEqual({ valid: true, message: '' })
    })

    test('clears a Ref', () => {
        const e = ref(dirty())
        clearSchemaValidation({ error: e })
        expect(validateAllSchemaCheck(e)).toBe(false)
        expect(e.value.items[0]!.name).toEqual({ valid: true, message: '' })
    })
})

test('unknown schema warns and reports invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await validateAllSchema({ schema: { nope: true }, input: {}, error: {} })).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
})

test('parsePath', () => {
    expect(parsePath('items[0].name')).toEqual(['items', 0, 'name'])
    expect(parsePath('a["b.c"].d')).toEqual(['a', 'b.c', 'd'])
    expect(parsePath('')).toEqual([])
})
