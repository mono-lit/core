// pkg/mock-db/odata.ts — a practical OData v4 query engine.
//
// Tokenizer -> AST -> evaluator. A regex-based translation (like the old
// json-server.mjs mock) cannot express precedence (`a eq 1 and b eq 2 or c eq 3`),
// nested parens or `not`, and silently drops what it fails to match — which
// means a grid quietly shows unfiltered rows. This parses the grammar properly.
//
// Supported: $filter (eq ne gt ge lt le, and or not, parens,
// contains/startswith/endswith/tolower/toupper/trim/length), $select, $orderby,
// $top, $skip, $count, $expand.
// Not supported (deliberately): $metadata, $batch, $apply, lambda any/all.
//
// Pure — no storage, no DOM. Unit-testable in plain node.

import type { MonoMockParsedEntity, MonoMockParsedSchema } from './schema'
import { applyTransforms, parseApply } from './apply'
import { splitTopLevel } from './split'

/* --------------------------------- tokens --------------------------------- */

type TokenType = 'ident' | 'string' | 'number' | 'date' | 'op' | 'paren' | 'comma' | 'path' | 'colon' | 'eof'

interface Token {
    type: TokenType
    value: string
}

const OPERATORS = new Set(['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'and', 'or', 'not', 'in'])

export function tokenize(input: string): Token[] {
    const tokens: Token[] = []
    const source = String(input ?? '')
    let i = 0

    while (i < source.length) {
        const char = source[i]!

        if (/\s/.test(char)) {
            i++
            continue
        }

        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char })
            i++
            continue
        }

        // `/` is the OData path separator (`Nav/any(...)`, `d/Field`). It used to be
        // part of the identifier charset, which lexed `Nav/any` as ONE identifier and
        // made lambdas unparseable.
        if (char === '/') {
            tokens.push({ type: 'path', value: char })
            i++
            continue
        }

        // lambda range-variable separator: `any(d: d/Bulan eq 3)`
        if (char === ':') {
            tokens.push({ type: 'colon', value: char })
            i++
            continue
        }

        if (char === ',') {
            tokens.push({ type: 'comma', value: char })
            i++
            continue
        }

        // 'string literal' — '' is an escaped quote, per OData
        if (char === "'" || char === '"') {
            const quote = char
            let value = ''
            i++
            while (i < source.length) {
                if (source[i] === quote) {
                    if (source[i + 1] === quote) {
                        value += quote
                        i += 2
                        continue
                    }
                    break
                }
                value += source[i]
                i++
            }
            if (source[i] !== quote) throw new Error(`$filter: unterminated string near "${value}"`)
            i++ // closing quote
            tokens.push({ type: 'string', value })
            continue
        }

        if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(source[i + 1] ?? ''))) {
            // An unquoted ISO datetime is a valid OData v4 literal, and it is exactly what
            // The core's `literal()` emits for a Date (`v.toISOString()`). Match it BEFORE the
            // number rule, or `2026-01-15T…` lexes as the number 2026 followed by garbage.
            const iso = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?/
                .exec(source.slice(i))
            if (iso) {
                tokens.push({ type: 'date', value: iso[0] })
                i += iso[0].length
                continue
            }

            let value = ''
            if (char === '-') {
                value += '-'
                i++
            }
            while (i < source.length && /[0-9.]/.test(source[i]!)) {
                value += source[i]
                i++
            }
            tokens.push({ type: 'number', value })
            continue
        }

        if (/[A-Za-z_$]/.test(char)) {
            let value = ''
            // NOTE: `/` is deliberately NOT here — it is a path token now (see above).
            while (i < source.length && /[A-Za-z0-9_$.]/.test(source[i]!)) {
                value += source[i]
                i++
            }
            const lower = value.toLowerCase()
            tokens.push({ type: OPERATORS.has(lower) ? 'op' : 'ident', value: OPERATORS.has(lower) ? lower : value })
            continue
        }

        throw new Error(`$filter: unexpected character "${char}" at ${i}`)
    }

    tokens.push({ type: 'eof', value: '' })
    return tokens
}

/* ----------------------------------- AST ---------------------------------- */

export type FilterNode =
    | { kind: 'literal'; value: unknown }
    | { kind: 'field'; name: string }
    /** `A/B/C` — a navigation path, or a lambda range variable (`d/Bulan`). */
    | { kind: 'path'; segments: string[] }
    /** `Nav/any(d: <predicate>)` — `nav` may be empty for a lambda on the row itself. */
    | { kind: 'lambda'; op: 'any' | 'all'; nav: string[]; variable: string; predicate: FilterNode }
    /** `Field in (1,2,3)` */
    | { kind: 'in'; left: FilterNode; values: FilterNode[] }
    | { kind: 'call'; name: string; args: FilterNode[] }
    | { kind: 'compare'; op: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le'; left: FilterNode; right: FilterNode }
    | { kind: 'logical'; op: 'and' | 'or'; left: FilterNode; right: FilterNode }
    | { kind: 'not'; operand: FilterNode }

/**
 * Recursive descent, lowest precedence first:
 *   or  ->  and  ->  not  ->  comparison  ->  primary
 * so `a eq 1 and b eq 2 or c eq 3` parses as `((a eq 1 and b eq 2) or c eq 3)`.
 */
export function parseFilter(input: string): FilterNode {
    const tokens = tokenize(input)
    let pos = 0

    const peek = () => tokens[pos]!
    const next = () => tokens[pos++]!

    function expect(type: TokenType, value?: string) {
        const token = next()
        if (token.type !== type || (value !== undefined && token.value !== value)) {
            throw new Error(
                `$filter: expected ${value ?? type} but found "${token.value || 'end of input'}"`,
            )
        }
        return token
    }

    function parseOr(): FilterNode {
        let left = parseAnd()
        while (peek().type === 'op' && peek().value === 'or') {
            next()
            left = { kind: 'logical', op: 'or', left, right: parseAnd() }
        }
        return left
    }

    function parseAnd(): FilterNode {
        let left = parseNot()
        while (peek().type === 'op' && peek().value === 'and') {
            next()
            left = { kind: 'logical', op: 'and', left, right: parseNot() }
        }
        return left
    }

    function parseNot(): FilterNode {
        if (peek().type === 'op' && peek().value === 'not') {
            next()
            return { kind: 'not', operand: parseNot() }
        }
        return parseComparison()
    }

    function parseComparison(): FilterNode {
        const left = parsePrimary()
        const token = peek()

        if (
            token.type === 'op' &&
            ['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(token.value)
        ) {
            next()
            const right = parsePrimary()
            return { kind: 'compare', op: token.value as any, left, right }
        }

        // `Field in (1,2,3)`
        if (token.type === 'op' && token.value === 'in') {
            next()
            expect('paren', '(')

            const values: FilterNode[] = []
            if (!(peek().type === 'paren' && peek().value === ')')) {
                values.push(parsePrimary())
                while (peek().type === 'comma') {
                    next()
                    values.push(parsePrimary())
                }
            }
            expect('paren', ')')

            return { kind: 'in', left, values }
        }

        return left
    }

    function parsePrimary(): FilterNode {
        const token = peek()

        if (token.type === 'paren' && token.value === '(') {
            next()
            const inner = parseOr()

            // A comma here means a value list was used where an expression belongs —
            // i.e. the operands of `in` are the wrong way round.
            if (peek().type === 'comma') {
                throw new Error(
                    `$filter: a value list "(a,b,c)" cannot be the left operand. ` +
                    `The OData v4 form is "Field in (1,2,3)", not "(1,2,3) in 'Field'".`,
                )
            }

            expect('paren', ')')
            return inner
        }

        if (token.type === 'string') {
            next()
            return { kind: 'literal', value: token.value }
        }

        if (token.type === 'number') {
            next()
            return { kind: 'literal', value: Number(token.value) }
        }

        if (token.type === 'date') {
            next()
            // keep the ISO text; comparison coerces to a timestamp (see compareValues)
            return { kind: 'literal', value: token.value }
        }

        if (token.type === 'ident') {
            next()

            // function call
            if (peek().type === 'paren' && peek().value === '(') {
                next()
                const args: FilterNode[] = []
                if (!(peek().type === 'paren' && peek().value === ')')) {
                    args.push(parseOr())
                    while (peek().type === 'comma') {
                        next()
                        args.push(parseOr())
                    }
                }
                expect('paren', ')')
                return { kind: 'call', name: token.value.toLowerCase(), args }
            }

            // path: `A/B/C`, possibly ending in a lambda (`Nav/any(d: ...)`)
            if (peek().type === 'path') {
                const segments = [token.value]

                while (peek().type === 'path') {
                    next()
                    const segment = next()
                    if (segment.type !== 'ident') {
                        throw new Error(`$filter: expected a property after "/" but found "${segment.value}"`)
                    }
                    segments.push(segment.value)
                }

                const last = segments[segments.length - 1]!.toLowerCase()

                // `Nav/any(d: <predicate>)` / `Nav/all(d: <predicate>)`
                if ((last === 'any' || last === 'all') && peek().type === 'paren' && peek().value === '(') {
                    next()

                    // `any()` with no predicate is legal: "the collection is non-empty"
                    if (peek().type === 'paren' && peek().value === ')') {
                        next()
                        return {
                            kind: 'lambda',
                            op: last,
                            nav: segments.slice(0, -1),
                            variable: '',
                            predicate: { kind: 'literal', value: true },
                        }
                    }

                    const variable = next()
                    if (variable.type !== 'ident' || peek().type !== 'colon') {
                        throw new Error(
                            `$filter: ${last}() needs a range variable — the form is ` +
                            `"${segments.slice(0, -1).join('/') || 'Nav'}/${last}(d: d/Field eq 1)". ` +
                            `Found "${variable.value}${peek().value}".`,
                        )
                    }
                    expect('colon')

                    const predicate = parseOr()
                    expect('paren', ')')

                    return {
                        kind: 'lambda',
                        op: last,
                        nav: segments.slice(0, -1),
                        variable: variable.value,
                        predicate,
                    }
                }

                return { kind: 'path', segments }
            }

            const lower = token.value.toLowerCase()
            if (lower === 'true') return { kind: 'literal', value: true }
            if (lower === 'false') return { kind: 'literal', value: false }
            if (lower === 'null') return { kind: 'literal', value: null }

            return { kind: 'field', name: token.value }
        }

        throw new Error(`$filter: unexpected "${token.value || 'end of input'}"`)
    }

    const ast = parseOr()
    if (peek().type !== 'eof') {
        throw new Error(`$filter: unexpected trailing "${peek().value}"`)
    }
    return ast
}

/* -------------------------------- evaluate -------------------------------- */

/** Case-insensitive field lookup, so `name` matches a `Name` column. */
function readField(row: Record<string, any>, name: string): unknown {
    if (name in row) return row[name]
    const lower = name.toLowerCase()
    const hit = Object.keys(row).find((key) => key.toLowerCase() === lower)
    return hit ? row[hit] : undefined
}

/** An ISO-ish date string, or a Date. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}|$)/

function asTimestamp(value: unknown): number | null {
    if (value instanceof Date) return value.getTime()
    if (typeof value === 'string' && ISO_DATE.test(value)) {
        const time = Date.parse(value)
        return Number.isNaN(time) ? null : time
    }
    return null
}

function compareValues(op: string, left: any, right: any): boolean {
    // null/undefined only ever equal each other
    if (left == null || right == null) {
        if (op === 'eq') return left == null && right == null
        if (op === 'ne') return !(left == null && right == null)
        return false
    }

    // Dates compare as instants, not as text: '2025-1-5' and '2025-01-05T00:00:00Z'
    // are the same moment but different strings, and lexical ordering across
    // timezone suffixes is wrong.
    const leftTime = asTimestamp(left)
    const rightTime = asTimestamp(right)
    if (leftTime != null && rightTime != null) {
        switch (op) {
            case 'eq': return leftTime === rightTime
            case 'ne': return leftTime !== rightTime
            case 'gt': return leftTime > rightTime
            case 'ge': return leftTime >= rightTime
            case 'lt': return leftTime < rightTime
            case 'le': return leftTime <= rightTime
            default: return false
        }
    }

    // Compare numerically only when one side is genuinely a number — the OData
    // literal's own type decides (`Id eq 1` is numeric, `Code eq '1'` is textual).
    //
    // Do NOT widen this to "both sides parse as a number": that makes
    // `Code eq '007'` match a row whose Code is the string "7", because both
    // coerce to 7. Zero-padded codes, account numbers and phone numbers all break.
    const numeric = typeof left === 'number' || typeof right === 'number'

    const a = numeric ? Number(left) : String(left)
    const b = numeric ? Number(right) : String(right)

    switch (op) {
        case 'eq': return a === b
        case 'ne': return a !== b
        case 'gt': return a > b
        case 'ge': return a >= b
        case 'lt': return a < b
        case 'le': return a <= b
        default: return false
    }
}

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
export interface FilterContext {
    entity?: MonoMockParsedEntity
    readEntity?: (name: string) => Record<string, any>[]
    scope?: Record<string, Record<string, any>>
}

/**
 * Resolve `A/B` against a row: a materialised value if the row already carries one
 * (an `$expand`ed relation), otherwise the declared relation, joined on demand.
 */
function resolvePath(
    segments: string[],
    row: Record<string, any>,
    context: FilterContext,
): unknown {
    // a leading lambda variable (`d/Bulan`) resolves against the bound item
    const head = segments[0]!
    const bound = context.scope?.[head]

    let current: any = bound !== undefined ? bound : undefined
    let rest = bound !== undefined ? segments.slice(1) : segments
    let entity = bound !== undefined ? undefined : context.entity

    if (current === undefined) current = row

    for (const segment of rest) {
        if (current == null) return undefined

        // `Details/$count` — the size of the collection resolved so far. Without this it
        // silently resolved to undefined, so `Details/$count gt 0` matched NOTHING and
        // never errored.
        if (segment === '$count') {
            return Array.isArray(current) ? current.length : (current == null ? 0 : 1)
        }

        // already materialised on the row?
        const direct = Array.isArray(current) ? undefined : readField(current, segment)
        if (direct !== undefined) {
            current = direct
            entity = undefined
            continue
        }

        // otherwise: a declared relation we can join on demand
        const field = entity?.relations.find(
            (candidate) => candidate.name.toLowerCase() === segment.toLowerCase(),
        )
        if (!field?.relation || !context.readEntity) return undefined

        const relation = field.relation
        const localValue = readField(current, relation.localField)
        const matches = context
            .readEntity(relation.targetEntity)
            .filter((target) => keyEquals(readField(target, relation.targetKey), localValue))

        current = relation.kind === 'array' ? matches : (matches[0] ?? null)
        entity = undefined
    }

    return current
}

function evaluateNode(node: FilterNode, row: Record<string, any>, context: FilterContext): any {
    switch (node.kind) {
        case 'literal':
            return node.value

        case 'field': {
            // a bare identifier can also be a bound lambda variable
            const bound = context.scope?.[node.name]
            if (bound !== undefined) return bound
            return readField(row, node.name)
        }

        case 'path':
            return resolvePath(node.segments, row, context)

        case 'lambda': {
            const collection = node.nav.length
                ? resolvePath(node.nav, row, context)
                : row

            const items: Record<string, any>[] = Array.isArray(collection)
                ? collection
                : collection == null
                    ? []
                    : [collection as Record<string, any>]

            const test = (item: Record<string, any>) =>
                Boolean(
                    evaluateNode(node.predicate, row, {
                        ...context,
                        scope: { ...(context.scope ?? {}), [node.variable]: item },
                    }),
                )

            // `all` over an empty collection is vacuously TRUE, per spec; `any` is false
            return node.op === 'any' ? items.some(test) : items.every(test)
        }

        case 'in': {
            const left = evaluateNode(node.left, row, context)
            return node.values.some((value) =>
                compareValues('eq', left, evaluateNode(value, row, context)),
            )
        }

        case 'not':
            return !evaluateNode(node.operand, row, context)

        case 'logical': {
            const left = Boolean(evaluateNode(node.left, row, context))
            if (node.op === 'and') return left && Boolean(evaluateNode(node.right, row, context))
            return left || Boolean(evaluateNode(node.right, row, context))
        }

        case 'compare':
            return compareValues(
                node.op,
                evaluateNode(node.left, row, context),
                evaluateNode(node.right, row, context),
            )

        case 'call': {
            const args = node.args.map((arg) => evaluateNode(arg, row, context))
            const text = (value: unknown) => String(value ?? '')

            switch (node.name) {
                case 'contains': return text(args[0]).toLowerCase().includes(text(args[1]).toLowerCase())
                case 'startswith': return text(args[0]).toLowerCase().startsWith(text(args[1]).toLowerCase())
                case 'endswith': return text(args[0]).toLowerCase().endsWith(text(args[1]).toLowerCase())
                case 'tolower': return text(args[0]).toLowerCase()
                case 'toupper': return text(args[0]).toUpperCase()
                case 'trim': return text(args[0]).trim()
                case 'length': return text(args[0]).length
                case 'concat': return args.map(text).join('')
                case 'indexof': return text(args[0]).indexOf(text(args[1]))

                // Date parts. The app writes both `year(...)` and `Year(...)`; function
                // names are lower-cased at parse time, so one entry covers both.
                case 'year':
                case 'month':
                case 'day':
                case 'hour':
                case 'minute':
                case 'second': {
                    const time = asTimestamp(args[0])
                    if (time == null) return null

                    const date = new Date(time)
                    switch (node.name) {
                        case 'year': return date.getUTCFullYear()
                        case 'month': return date.getUTCMonth() + 1 // OData months are 1-based
                        case 'day': return date.getUTCDate()
                        case 'hour': return date.getUTCHours()
                        case 'minute': return date.getUTCMinutes()
                        default: return date.getUTCSeconds()
                    }
                }
                case 'now': return new Date().toISOString()
                case 'substring':
                    return args.length > 2
                        ? text(args[0]).substr(Number(args[1]), Number(args[2]))
                        : text(args[0]).substring(Number(args[1]))
                case 'substringof': // legacy v2 spelling, arg order is reversed
                    return text(args[1]).toLowerCase().includes(text(args[0]).toLowerCase())
                default:
                    throw new Error(`$filter: unsupported function "${node.name}()"`)
            }
        }
    }
}

export function evaluateFilter(
    node: FilterNode,
    row: Record<string, any>,
    context: FilterContext = {},
): boolean {
    return Boolean(evaluateNode(node, row, context))
}

/* ------------------------------ query options ----------------------------- */

/**
 * One `$expand` item, with the options that can live inside its parens:
 * `Approval($select=Id;$expand=Step($select=X);$filter=Status eq 'Menunggu';$top=1)`.
 *
 * These are not decoration — the app relies on the nested `$filter`/`$top` to cut a
 * child collection down to the row it wants. Ignoring them returns every child.
 */
export interface ExpandItem {
    name: string
    select?: string[]
    filter?: string
    orderby?: { field: string; desc: boolean }[]
    top?: number
    skip?: number
    expand?: ExpandItem[]
}

export interface ODataQuery {
    filter?: string
    select?: string[]
    orderby?: { field: string; desc: boolean }[]
    top?: number
    skip?: number
    count?: boolean
    /**
     * Either bare relation names (`['cars']`) or parsed items with nested options.
     * A raw string is normalised on the way in, so both call styles work.
     */
    expand?: (string | ExpandItem)[]
    /** Raw `$apply` pipeline, e.g. `filter(X gt 1)/groupby((A),aggregate(B with sum as T))`. */
    apply?: string
}

/** A bare name, an already-parsed item, or a string carrying nested options. */
function normalizeExpand(input: (string | ExpandItem)[]): ExpandItem[] {
    return input.flatMap((item) =>
        typeof item === 'string' ? parseExpand(item) : [item],
    )
}

/** `Field desc, Other` -> orderby rules. */
function parseOrderBy(input: string): { field: string; desc: boolean }[] {
    return splitTopLevel(input, ',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [field, direction] = part.split(/\s+/)
            return { field: field!, desc: String(direction ?? '').toLowerCase() === 'desc' }
        })
}

/**
 * Parse an `$expand` value into a tree.
 *
 * Tolerates everything the real app emits: embedded newlines/tabs, spaces after
 * commas (`Feature($select=Id, Nama)`), a stray trailing `;`
 * (`BudgetAlokasi($select=…;)`), and a single string holding several comma-separated
 * expands.
 */
export function parseExpand(input: string | string[]): ExpandItem[] {
    // an array element may itself contain several comma-separated expands
    const raw = Array.isArray(input) ? input.join(',') : String(input ?? '')

    return splitTopLevel(raw, ',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part): ExpandItem => {
            const open = part.indexOf('(')
            if (open < 0) return { name: part.trim() }

            const name = part.slice(0, open).trim()
            const body = part.slice(open + 1, part.lastIndexOf(')'))

            const item: ExpandItem = { name }

            // options inside the parens are `;`-separated
            for (const option of splitTopLevel(body, ';')) {
                const at = option.indexOf('=')
                if (at < 0) continue // tolerate a stray trailing `;`

                const key = option.slice(0, at).trim().toLowerCase()
                const value = option.slice(at + 1).trim()
                if (!value) continue

                switch (key) {
                    case '$select':
                        item.select = splitTopLevel(value, ',').map((s) => s.trim()).filter(Boolean)
                        break
                    case '$filter':
                        // may span newlines — the tokenizer skips whitespace
                        item.filter = value
                        break
                    case '$orderby':
                        item.orderby = parseOrderBy(value)
                        break
                    case '$top':
                        item.top = Number(value)
                        break
                    case '$skip':
                        item.skip = Number(value)
                        break
                    case '$expand':
                        item.expand = parseExpand(value) // recurse
                        break
                    default:
                        break // $count etc. inside expand: ignored, not fatal
                }
            }

            return item
        })
}

/** Read OData options off a query string or a param object (DevExtreme sends both shapes). */
export function parseQuery(input: string | Record<string, any>): ODataQuery {
    const params = new Map<string, string>()

    if (typeof input === 'string') {
        const search = input.includes('?') ? input.slice(input.indexOf('?') + 1) : input
        for (const [key, value] of new URLSearchParams(search)) params.set(key.toLowerCase(), value)
    } else {
        for (const [key, value] of Object.entries(input ?? {})) {
            if (value !== undefined && value !== null) params.set(key.toLowerCase(), String(value))
        }
    }

    const query: ODataQuery = {}

    const apply = params.get('$apply')
    if (apply) query.apply = apply

    const filter = params.get('$filter')
    if (filter) query.filter = filter

    const select = params.get('$select')
    if (select) query.select = select.split(',').map((s) => s.trim()).filter(Boolean)

    const expand = params.get('$expand')
    // depth-aware: a naive `.split(',')` cut `PostBudget($select=Id,Nama)` in half
    if (expand) query.expand = parseExpand(expand)

    const orderby = params.get('$orderby')
    if (orderby) query.orderby = parseOrderBy(orderby)

    const top = params.get('$top')
    if (top != null && top !== '') query.top = Number(top)

    const skip = params.get('$skip')
    if (skip != null && skip !== '') query.skip = Number(skip)

    if (String(params.get('$count') ?? '').toLowerCase() === 'true') query.count = true

    return query
}

export interface ODataResult {
    /** Rows after filter -> order -> page -> expand -> select. */
    rows: Record<string, any>[]
    /** Total AFTER filtering but BEFORE paging — what @odata.count must report. */
    total: number
}

/**
 * Run a query over an entity's rows.
 *
 * Order matters and is the usual source of off-by-one bugs: filter first, take
 * the count from the FILTERED set, then page, then expand, then select. Counting
 * before filtering (or after paging) is the classic way to break a grid's pager.
 */
export function executeQuery(
    rows: Record<string, any>[],
    query: ODataQuery,
    context?: {
        entity: MonoMockParsedEntity
        readEntity: (name: string) => Record<string, any>[]
        /** Resolves a child entity's schema — needed to recurse into a nested $expand. */
        entityOf?: (name: string) => MonoMockParsedEntity | undefined
    },
): ODataResult {
    let out = [...rows]

    // $apply FIRST. Its own `filter(...)` segment runs before the grouping, whereas
    // the top-level $filter below applies to the AGGREGATED rows (`$filter=Total gt
    // 500`). Running them in the other order computes the right aggregate over the
    // wrong set — right-looking numbers, wrong answer.
    // The relation context lets a filter reach a navigation property that was never
    // $expand-ed — lambdas (`Detail/any(d: …)`), nav paths (`PostBudget/Nama`) and
    // `Detail/$count`. Shared by $apply's inner filter() and the top-level $filter.
    const filterContext: FilterContext = context
        ? { entity: context.entity, readEntity: context.readEntity }
        : {}

    if (query.apply) {
        out = applyTransforms(
            out,
            parseApply(query.apply),
            (expression) => {
                const ast = parseFilter(expression)
                return (row) => evaluateFilter(ast, row, filterContext)
            },
            // Path-aware reader, so `groupby((PostBudget/ParentName))` resolves the
            // navigation. A flat read found nothing and silently collapsed every row
            // into one `null` group — plausible numbers, wrong answer.
            (row, field) =>
                field.includes('/')
                    ? resolvePath(field.split('/'), row, filterContext)
                    : readField(row, field),
        )
    }

    if (query.filter) {
        const ast = parseFilter(query.filter)
        out = out.filter((row) => evaluateFilter(ast, row, filterContext))
    }

    // counted after $apply, so @odata.count reports GROUPS, not source rows
    const total = out.length

    if (query.orderby?.length) {
        const rules = query.orderby
        out.sort((a, b) => {
            for (const rule of rules) {
                const left = readField(a, rule.field)
                const right = readField(b, rule.field)
                if (left === right) continue
                if (left == null) return rule.desc ? 1 : -1
                if (right == null) return rule.desc ? -1 : 1

                const bothNumeric = typeof left === 'number' && typeof right === 'number'
                const cmp = bothNumeric
                    ? (left as number) - (right as number)
                    : String(left).localeCompare(String(right))

                if (cmp !== 0) return rule.desc ? -cmp : cmp
            }
            return 0
        })
    }

    const skip = Number(query.skip ?? 0)
    if (skip > 0) out = out.slice(skip)
    if (query.top != null && !Number.isNaN(query.top)) out = out.slice(0, query.top)

    if (query.expand?.length && context) {
        const items = normalizeExpand(query.expand)
        out = out.map((row) => expandRow(row, items, context))
    }

    if (query.select?.length) {
        const fields = query.select
        out = out.map((row) => {
            const picked: Record<string, any> = {}
            for (const field of fields) {
                const value = readField(row, field)
                if (value !== undefined) picked[field] = value
            }
            return picked
        })
    }

    return { rows: out, total }
}

/**
 * Are two relation keys the same row?
 *
 * Strictly equal, or equal as strings — so a `"1"` foreign key still joins a `1`
 * primary key. That mismatch is the common case, not an exotic one: JSON seed
 * files, url path segments and select-box values all hand back string keys while
 * the primary key is numeric. A strict `===` join returned `null`/`[]` for those
 * with no error at all, which is the worst way to be wrong.
 *
 * Compared as STRINGS, never coerced to numbers: `Number('007') === Number('7')`
 * would join two genuinely different keys.
 *
 * A null/undefined key joins NOTHING — otherwise `undefined === undefined` makes a
 * row with a missing FK match every target row with a missing key.
 */
function keyEquals(a: unknown, b: unknown): boolean {
    if (a == null || b == null) return false
    return a === b || String(a) === String(b)
}

/** Materialise the requested relations for one row, honouring each item's nested options. */
function expandRow(
    row: Record<string, any>,
    expand: ExpandItem[],
    context: {
        entity: MonoMockParsedEntity
        readEntity: (name: string) => Record<string, any>[]
        entityOf?: (name: string) => MonoMockParsedEntity | undefined
    },
): Record<string, any> {
    const out = { ...row }

    for (const item of expand) {
        const field = context.entity.relations.find(
            (candidate) => candidate.name.toLowerCase() === item.name.toLowerCase(),
        )
        if (!field?.relation) continue

        const relation = field.relation
        const targetRows = context.readEntity(relation.targetEntity)
        const localValue = readField(row, relation.localField)

        // A->B:C  ==  rows of B whose [C] is the same key as row[A]
        let matches = targetRows.filter(
            (target) => keyEquals(readField(target, relation.targetKey), localValue),
        )

        // The options inside the parens are load-bearing: the app uses
        // `Approval(…;$filter=Status eq 'Menunggu';$top=1)` to pull ONE pending approval.
        // Ignoring them returns every child row and the UI silently shows the wrong one.
        const hasOptions =
            item.filter || item.orderby?.length || item.top != null || item.skip != null ||
            item.select?.length || item.expand?.length

        if (hasOptions) {
            const targetEntity = context.entityOf?.(relation.targetEntity)

            const result = executeQuery(
                matches,
                {
                    filter: item.filter,
                    orderby: item.orderby,
                    top: item.top,
                    skip: item.skip,
                    select: item.select,
                    expand: item.expand,
                },
                // a nested expand needs the CHILD entity's relations, not the parent's
                targetEntity
                    ? { entity: targetEntity, readEntity: context.readEntity, entityOf: context.entityOf }
                    : undefined,
            )
            matches = result.rows
        }

        out[field.name] = relation.kind === 'array' ? matches : (matches[0] ?? null)
    }

    return out
}

/** `Entity(1)` / `Entity('abc')` -> the key, or null for a collection request. */
export function parseKeySegment(segment: string): string | number | null {
    const match = /\(([^)]*)\)\s*$/.exec(String(segment ?? ''))
    if (!match) return null

    let key = match[1]!.trim()
    if (!key) return null

    const quoted = /^'(.*)'$/.exec(key) ?? /^"(.*)"$/.exec(key)
    if (quoted) return decodeURIComponent(quoted[1]!)

    const asNumber = Number(key)
    return Number.isNaN(asNumber) ? decodeURIComponent(key) : asNumber
}

/** The `{ value, @odata.count }` envelope DevExtreme's ODataStore expects. */
export function toODataEnvelope(result: ODataResult, count: boolean) {
    return {
        ...(count ? { '@odata.count': result.total } : {}),
        value: result.rows,
    }
}

export type { MonoMockParsedSchema }
