import type { ValidateErrorItem } from '../types'

/**
 * Library-agnostic core behind `validateAllSchema` / `validateSchema` /
 * `clearSchemaValidation`. Nothing here imports a schema library: yup schemas are
 * driven through their own methods (so the app's yup instance is the one used and
 * @mono-lit/utility ships no copy), and everything else goes through Standard
 * Schema v1 (`schema['~standard'].validate`) — Valibot, Zod, ArkType, …
 */

export type SchemaKey = string | number

/** One failed check, normalised to a key path + message. */
export interface SchemaIssue {
    keys: SchemaKey[]
    message: string
}

export interface SchemaResult {
    ok: boolean
    issues: SchemaIssue[]
}

// ───────────────── detection ─────────────────

/** yup ≥1.7 also exposes `~standard`, so yup must be checked first. */
export const isYupSchema = (schema: any): boolean =>
    !!schema && (schema.__isYupSchema__ === true || typeof schema.validateAt === 'function')

export const isStandardSchema = (schema: any): boolean =>
    !!schema && typeof schema['~standard']?.validate === 'function'

let warnedUnknown = false
function warnUnknown(schema: any) {
    if (warnedUnknown) return
    warnedUnknown = true
    console.warn('[mono-utility] schema validation: expected a yup schema or a Standard Schema (e.g. Valibot), got', schema)
}

// ───────────────── paths ─────────────────

/** `'items[0].name'` / `'a["b.c"]'` / `'address.city'` → key list. */
export function parsePath(path: string | number | undefined | null): SchemaKey[] {
    if (path === undefined || path === null || path === '') return []
    if (typeof path === 'number') return [path]
    const keys: SchemaKey[] = []
    const re = /\[\s*"([^"]*)"\s*\]|\[\s*'([^']*)'\s*\]|\[(\d+)\]|([^.[\]]+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(path))) {
        if (m[1] !== undefined) keys.push(m[1])
        else if (m[2] !== undefined) keys.push(m[2])
        else if (m[3] !== undefined) keys.push(Number(m[3]))
        else keys.push(m[4]!)
    }
    return keys
}

const sameKey = (a: SchemaKey, b: SchemaKey) => String(a) === String(b)

const startsWith = (keys: SchemaKey[], prefix: SchemaKey[]) =>
    prefix.length <= keys.length && prefix.every((k, i) => sameKey(k, keys[i]!))

// ───────────────── error-object helpers ─────────────────

const isSlot = (v: any): v is ValidateErrorItem =>
    v !== null && typeof v === 'object' && 'valid' in v && 'message' in v

/** Accept a Vue Ref or the plain/reactive object itself, without importing vue. */
export const unwrapError = (error: any) => (error && error.__v_isRef ? error.value : error)

/** Walk `keys` into the error object; never creates anything. */
function getNode(error: any, keys: SchemaKey[]): any {
    let cursor = error
    for (const k of keys) {
        if (cursor === null || typeof cursor !== 'object') return undefined
        cursor = cursor[k as any]
    }
    return cursor
}

/** Set every `{ valid, message }` slot under `node` back to valid. */
export function resetSlots(node: any): void {
    if (node === null || typeof node !== 'object') return
    if (isSlot(node)) {
        node.valid = true
        node.message = ''
        return
    }
    for (const key of Object.keys(node)) resetSlots(node[key])
}

/** `true` when every slot under `node` is valid. */
export function everyValid(node: any): boolean {
    if (node === null || typeof node !== 'object') return true
    if (isSlot(node)) return !!node.valid
    return Object.keys(node).every((k) => everyValid(node[k]))
}

/**
 * Write issues into the error object. Only slots that already exist are
 * touched; the first message for a slot wins. An issue on a nested object/array
 * with no slot of its own is ignored, like today's yup behaviour.
 */
function applyIssues(error: any, issues: SchemaIssue[]) {
    const seen = new Set<any>()
    for (const issue of issues) {
        const slot = getNode(error, issue.keys)
        if (!isSlot(slot) || seen.has(slot)) continue
        seen.add(slot)
        slot.valid = false
        slot.message = issue.message
    }
}

/**
 * Drop issues for keys the input doesn't carry: a field that is absent from
 * `input` is not part of this form, so it isn't validated (the yup helper has
 * always worked on the "partial" schema of present keys).
 */
function presentInInput(input: any, keys: SchemaKey[]): boolean {
    let cursor = input
    for (const k of keys) {
        if (cursor === null || typeof cursor !== 'object') return true
        if (!(k in cursor)) return false
        cursor = cursor[k as any]
    }
    return true
}

// ───────────────── runners ─────────────────

function yupIssues(e: any): SchemaIssue[] {
    if (!e || !Array.isArray(e.errors)) throw e
    const list = Array.isArray(e.inner) && e.inner.length ? e.inner : [e]
    return list.map((err: any) => ({ keys: parsePath(err.path), message: String(err.message ?? '') }))
}

/** Rebuild an object schema keeping only the keys present in `input`, recursively. */
function yupPartial(schema: any, input: any): any {
    if (!schema || !schema.fields || input === null || typeof input !== 'object' || Array.isArray(input)) return schema
    const keys = Object.keys(schema.fields).filter((k) => k in input)
    let partial = schema.pick(keys)
    const nested: Record<string, any> = {}
    for (const k of keys) {
        const field = schema.fields[k]
        const value = input[k]
        if (field?.type === 'object' && field.fields && value !== null && typeof value === 'object' && !Array.isArray(value))
            nested[k] = yupPartial(field, value)
    }
    if (Object.keys(nested).length) partial = partial.shape(nested)
    return partial
}

async function runYup(schema: any, input: any, field?: SchemaKey[]): Promise<SchemaResult> {
    try {
        if (field?.length) await schema.validateAt(field.map(String).join('.'), input, { abortEarly: false })
        else await yupPartial(schema, input).validate(input, { abortEarly: false })
        return { ok: true, issues: [] }
    } catch (e) {
        const issues = yupIssues(e).map((i) =>
            // validateAt reports paths from the root already; guard anyway
            field?.length && !startsWith(i.keys, field) ? { ...i, keys: [...field, ...i.keys] } : i)
        return { ok: false, issues }
    }
}

async function runStandard(schema: any, input: any): Promise<SchemaResult> {
    const result = await schema['~standard'].validate(input)
    if (!result.issues) return { ok: true, issues: [] }
    const issues: SchemaIssue[] = result.issues.map((issue: any) => ({
        keys: (issue.path ?? []).map((seg: any) =>
            seg !== null && typeof seg === 'object' ? seg.key : seg) as SchemaKey[],
        message: String(issue.message ?? ''),
    }))
    return { ok: false, issues }
}

/** Validate with whichever library `schema` belongs to. `null` = unknown schema. */
export async function runSchema(schema: any, input: any, field?: SchemaKey[]): Promise<SchemaResult | null> {
    if (isYupSchema(schema)) return runYup(schema, input, field)
    if (isStandardSchema(schema)) return runStandard(schema, input)
    warnUnknown(schema)
    return null
}

// ───────────────── public operations ─────────────────

/** Whole form. Resolves `true` when every slot is valid. */
export async function validateAll(schema: any, input: any, errorIn: any): Promise<boolean> {
    const error = unwrapError(errorIn)
    const result = await runSchema(schema, input)
    if (!result) return false
    resetSlots(error)
    applyIssues(error, result.issues.filter((i) => presentInInput(input, i.keys)))
    return everyValid(error)
}

/** One field (dotted path allowed). Resolves `true` when that field is valid. */
export async function validateField(schema: any, field: SchemaKey | string, input: any, errorIn: any): Promise<boolean> {
    const error = unwrapError(errorIn)
    const keys = typeof field === 'number' ? [field] : parsePath(field)
    const result = await runSchema(schema, input, keys)
    if (!result) return false
    const node = getNode(error, keys)
    resetSlots(node)
    applyIssues(error, result.issues.filter((i) => startsWith(i.keys, keys)))
    return everyValid(node)
}

/** Reset every slot. Takes a Ref or the object itself. */
export function clearAll(errorIn: any): void {
    resetSlots(unwrapError(errorIn))
}
