import { describe, expect, test, vi } from 'vitest'
import * as yup from 'yup'
import * as v from 'valibot'
import { runRules } from '../src/components/form/form-rules'
import type { MonoFormRule, MonoFormSchemaLike } from '../src/components/form/form-types'

const ctx = (value: unknown) => ({ value, values: { pw: value }, key: 'pw' })
const run = (rules: MonoFormRule[], value: unknown, timing?: 'live' | 'change') =>
  runRules(rules, ctx(value), { timing, defaultTiming: 'change' })

// Both libraries' schemas must type-check as a rule schema.
const _typecheck: MonoFormSchemaLike[] = [yup.string(), v.string(), v.pipeAsync(v.string())]
void _typecheck

describe.each([
  ['yup', yup.string().min(6, 'Min 6 characters'), yup.string().matches(/\d/, 'Needs a digit')],
  ['valibot', v.pipe(v.string(), v.minLength(6, 'Min 6 characters')), v.pipe(v.string(), v.regex(/\d/, 'Needs a digit'))],
] as const)('%s schema rule', (_name, min6, digit) => {
  test('passes / fails with the schema\'s own message', async () => {
    expect(await run([{ schema: min6 }], 'secret1')).toEqual({ success: true, message: '' })
    expect(await run([{ schema: min6 }], 'abc')).toEqual({ success: false, message: 'Min 6 characters' })
  })

  test('the schema message wins over rule.message, and schema wins over type', async () => {
    expect(await run([{ type: 'required', schema: min6, message: 'ignored' }], 'abc'))
      .toEqual({ success: false, message: 'Min 6 characters' })
  })

  test('first failing rule wins, mixed with built-ins', async () => {
    const rules: MonoFormRule[] = [{ type: 'required', message: 'Required' }, { schema: min6 }, { schema: digit }]
    expect(await run(rules, '')).toEqual({ success: false, message: 'Required' })
    expect(await run(rules, 'abc')).toEqual({ success: false, message: 'Min 6 characters' })
    expect(await run(rules, 'abcdefg')).toEqual({ success: false, message: 'Needs a digit' })
    expect((await run(rules, 'abcdef1')).success).toBe(true)
  })

  test('timing filters schema rules like any other rule', async () => {
    const rules: MonoFormRule[] = [{ schema: min6 }] // default timing: change
    expect((await run(rules, 'abc', 'live')).success).toBe(true)
    expect((await run(rules, 'abc', 'change')).success).toBe(false)
  })
})

test('valibot async schema is awaited', async () => {
  const schema = v.pipeAsync(
    v.string(),
    v.checkAsync(async (s) => { await new Promise((r) => setTimeout(r, 5)); return s !== 'admin' }, 'Username taken'),
  )
  expect(await run([{ schema }], 'admin')).toEqual({ success: false, message: 'Username taken' })
  expect((await run([{ schema }], 'ann')).success).toBe(true)
})

test('an unrecognised schema warns once and is ignored', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  expect((await run([{ schema: {} as MonoFormSchemaLike }], 'x')).success).toBe(true)
  expect(warn).toHaveBeenCalledOnce()
  warn.mockRestore()
})
