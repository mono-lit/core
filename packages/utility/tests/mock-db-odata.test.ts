import { describe, expect, it } from 'vitest'

import {
    evaluateFilter,
    executeQuery,
    parseFilter,
    parseKeySegment,
    parseQuery,
    toODataEnvelope,
} from '../pkg/mock-db/odata'
import { parseMockSchema } from '../pkg/mock-db/schema'

const rows = [
    { Id: 1, Name: 'Alpha', Age: 30, Active: true },
    { Id: 2, Name: 'Beta', Age: 20, Active: false },
    { Id: 3, Name: 'Gamma', Age: 40, Active: true },
    { Id: 4, Name: 'alphabet', Age: 25, Active: false },
]

const match = (filter: string) => {
    const ast = parseFilter(filter)
    return rows.filter((row) => evaluateFilter(ast, row)).map((row) => row.Id)
}

describe('$filter — precedence', () => {
    it('binds `and` tighter than `or`', () => {
        // must parse as ((Age eq 30 and Active eq true) or Id eq 2), NOT
        // (Age eq 30 and (Active eq true or Id eq 2)). The regex translator in
        // json-server.mjs cannot express this at all.
        expect(match('Age eq 30 and Active eq true or Id eq 2')).toEqual([1, 2])
    })

    it('honours explicit parentheses over default precedence', () => {
        expect(match('Age eq 30 and (Active eq true or Id eq 2)')).toEqual([1])
    })

    it('supports nested groups', () => {
        expect(match('(Id eq 1 or Id eq 2) and (Active eq false)')).toEqual([2])
    })
})

describe('$filter — operators', () => {
    it('compares numbers numerically, not lexically', () => {
        // '9' > '10' as strings; 9 < 10 as numbers.
        expect(match('Age gt 25')).toEqual([1, 3])
        expect(match('Age ge 25')).toEqual([1, 3, 4])
        expect(match('Age lt 25')).toEqual([2])
        expect(match('Age le 25')).toEqual([2, 4])
        expect(match('Age ne 30')).toEqual([2, 3, 4])
    })

    it('supports not', () => {
        expect(match('not (Age eq 30)')).toEqual([2, 3, 4])
    })

    it('supports string functions, case-insensitively', () => {
        expect(match("contains(Name,'lph')")).toEqual([1, 4])
        expect(match("startswith(Name,'Al')")).toEqual([1, 4])
        expect(match("endswith(Name,'bet')")).toEqual([4])
    })

    it('supports nested function calls', () => {
        expect(match("contains(tolower(Name),'alpha')")).toEqual([1, 4])
    })

    it('handles escaped quotes in string literals', () => {
        const data = [{ Id: 1, Name: "O'Brien" }]
        const ast = parseFilter("Name eq 'O''Brien'")
        expect(data.filter((row) => evaluateFilter(ast, row))).toHaveLength(1)
    })

    it('matches fields case-insensitively', () => {
        expect(match("name eq 'Alpha'")).toEqual([1])
    })

    it('does NOT numeric-coerce two strings that merely look numeric', () => {
        // regression: '007' and '7' both coerce to 7, so a "both parse as number"
        // check made `Code eq '007'` match the row whose Code is "7". Zero-padded
        // codes, account numbers and phone numbers all broke.
        const codes = [
            { Id: 1, Code: '007' },
            { Id: 2, Code: '7' },
        ]

        const padded = parseFilter("Code eq '007'")
        expect(codes.filter((row) => evaluateFilter(padded, row)).map((r) => r.Id)).toEqual([1])

        const plain = parseFilter("Code eq '7'")
        expect(codes.filter((row) => evaluateFilter(plain, row)).map((r) => r.Id)).toEqual([2])
    })

    it('still compares numerically when the literal is a number', () => {
        // a numeric literal must not become a string compare, or '9' > '10' lexically
        const scores = [{ Id: 1, Score: 9 }, { Id: 2, Score: 10 }]
        const ast = parseFilter('Score gt 9')
        expect(scores.filter((row) => evaluateFilter(ast, row)).map((r) => r.Id)).toEqual([2])
    })
})

describe('$filter — errors', () => {
    it('rejects an unterminated string instead of silently ignoring it', () => {
        expect(() => parseFilter("Name eq 'Alpha")).toThrow(/unterminated/i)
    })

    it('rejects an unknown function', () => {
        const ast = parseFilter("bogus(Name,'x')")
        expect(() => evaluateFilter(ast, rows[0]!)).toThrow(/unsupported function/i)
    })

    it('rejects trailing garbage', () => {
        expect(() => parseFilter('Id eq 1 eq')).toThrow()
    })
})

describe('executeQuery — order of operations', () => {
    it('counts the FILTERED total, before paging', () => {
        // the classic pager bug: count before filtering, or after paging
        const result = executeQuery(rows, { filter: 'Active eq true', top: 1 })
        expect(result.rows).toHaveLength(1)
        expect(result.total).toBe(2)
    })

    it('applies $skip/$top after sorting', () => {
        const result = executeQuery(rows, {
            orderby: [{ field: 'Age', desc: true }],
            skip: 1,
            top: 2,
        })
        expect(result.rows.map((row) => row.Id)).toEqual([1, 4])
    })

    it('sorts by multiple keys', () => {
        const result = executeQuery(rows, {
            orderby: [{ field: 'Active', desc: false }, { field: 'Age', desc: true }],
        })
        expect(result.rows.map((row) => row.Id)).toEqual([4, 2, 3, 1])
    })

    it('projects only $select-ed fields', () => {
        const result = executeQuery(rows, { select: ['Id', 'Name'], top: 1 })
        expect(result.rows[0]).toEqual({ Id: 1, Name: 'Alpha' })
    })
})

describe('$expand', () => {
    const { schemas } = parseMockSchema({
        schema: {
            shop: {
                users: {
                    fields: {
                        id: 'number|primary',
                        name: 'string',
                        cars: 'array|id->cars:userId',
                    },
                },
                cars: {
                    fields: {
                        id: 'number|primary',
                        userId: 'number|foreign',
                        user: 'object|userId->users:id',
                    },
                },
            },
        },
    })

    const users = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
    const cars = [
        { id: 10, userId: 1 },
        { id: 11, userId: 1 },
        { id: 12, userId: 2 },
    ]

    const entities = schemas[0]!.entities

    // Keyed by NAME on purpose. The old stub was `readEntity: () => cars`, which
    // returned the same table whatever it was asked for — so it could not catch the
    // engine requesting the wrong entity. This one returns [] for a wrong name, so a
    // mis-wired lookup fails the test instead of silently passing.
    const tables: Record<string, Record<string, any>[]> = { users, cars }
    const readEntity = (name: string) => tables[name] ?? []

    it('expands one-to-many from the parent as an array', () => {
        const result = executeQuery(users, { expand: ['cars'] }, { entity: entities.users!, readEntity })
        expect(result.rows[0]!.cars.map((car: any) => car.id)).toEqual([10, 11])
        expect(result.rows[1]!.cars.map((car: any) => car.id)).toEqual([12])
    })

    it('expands many-to-one from the child as a single object', () => {
        const result = executeQuery(cars, { expand: ['user'] }, { entity: entities.cars!, readEntity })
        expect(result.rows[0]!.user).toEqual({ id: 1, name: 'A' })
        expect(result.rows[2]!.user).toEqual({ id: 2, name: 'B' })
    })

    it('joins a STRING foreign key to a NUMBER primary key', () => {
        // regression: a strict === join silently returned null/[] here. JSON seeds,
        // url path keys and select-box values all produce string keys against
        // numeric PKs, so this is the common case, not an exotic one.
        const stringFkCars = [{ id: 10, userId: '1' }]
        const result = executeQuery(stringFkCars, { expand: ['user'] }, {
            entity: entities.cars!,
            readEntity,
        })
        expect(result.rows[0]!.user).toEqual({ id: 1, name: 'A' })
    })

    it('does NOT join a null foreign key to a null-keyed row', () => {
        // regression: `undefined === undefined` is true, so a row with no FK matched
        // every target row that also had no key.
        const orphans = [{ id: 99 }] // no userId at all
        const nullKeyedUsers = [{ id: undefined, name: 'ghost' }]

        const result = executeQuery(orphans, { expand: ['user'] }, {
            entity: entities.cars!,
            readEntity: () => nullKeyedUsers as any,
        })
        expect(result.rows[0]!.user).toBeNull()
    })

    it('does not numeric-coerce keys: "007" is not "7"', () => {
        const padded = [{ id: 10, userId: '007' }]
        const result = executeQuery(padded, { expand: ['user'] }, {
            entity: entities.cars!,
            readEntity: () => [{ id: '7', name: 'seven' }] as any,
        })
        expect(result.rows[0]!.user).toBeNull()
    })

    it('expands several relations in one query', () => {
        const { schemas: multi } = parseMockSchema({
            schema: {
                shop: {
                    users: {
                        fields: {
                            id: 'number|primary',
                            cars: 'array|id->cars:userId',
                            orders: 'array|id->orders:userId',
                        },
                    },
                    cars: { fields: { id: 'number|primary', userId: 'number|foreign' } },
                    orders: { fields: { id: 'number|primary', userId: 'number|foreign' } },
                },
            },
        } as any)

        const orders = [{ id: 90, userId: 1 }]
        const result = executeQuery([{ id: 1 }], { expand: ['cars', 'orders'] }, {
            entity: multi[0]!.entities.users!,
            readEntity: (name) => ({ cars, orders } as any)[name] ?? [],
        })

        expect(result.rows[0]!.cars.map((c: any) => c.id)).toEqual([10, 11])
        expect(result.rows[0]!.orders.map((o: any) => o.id)).toEqual([90])
    })

    it('matches the expand name case-insensitively', () => {
        const result = executeQuery(cars, { expand: ['USER'] }, { entity: entities.cars!, readEntity })
        expect(result.rows[0]!.user).toEqual({ id: 1, name: 'A' })
    })

    it('ignores an expand name that is not a relation', () => {
        const result = executeQuery(cars, { expand: ['nonsense'] }, { entity: entities.cars!, readEntity })
        expect(result.rows[0]).toEqual({ id: 10, userId: 1 })
    })

    it('expands only the current page, after paging', () => {
        const result = executeQuery(users, { expand: ['cars'], skip: 1, top: 1 }, {
            entity: entities.users!,
            readEntity,
        })
        expect(result.rows).toHaveLength(1)
        expect(result.rows[0]!.id).toBe(2)
        expect(result.rows[0]!.cars.map((c: any) => c.id)).toEqual([12])
    })

    it('drops an expanded relation that $select does not ask for', () => {
        const result = executeQuery(cars, { expand: ['user'], select: ['id'] }, {
            entity: entities.cars!,
            readEntity,
        })
        expect(result.rows[0]).toEqual({ id: 10 })
    })
})

describe('parseQuery / key segments / envelope', () => {
    it('reads options from a query string', () => {
        const query = parseQuery("$filter=Id eq 1&$top=5&$skip=2&$count=true&$select=Id,Name&$orderby=Name desc,Id")
        expect(query.filter).toBe('Id eq 1')
        expect(query.top).toBe(5)
        expect(query.skip).toBe(2)
        expect(query.count).toBe(true)
        expect(query.select).toEqual(['Id', 'Name'])
        expect(query.orderby).toEqual([
            { field: 'Name', desc: true },
            { field: 'Id', desc: false },
        ])
    })

    it('reads options from a param object', () => {
        expect(parseQuery({ $top: 3, $count: 'true' })).toMatchObject({ top: 3, count: true })
    })

    it('parses Entity(1) and Entity(\'abc\') keys', () => {
        expect(parseKeySegment('flows(12)')).toBe(12)
        expect(parseKeySegment("users('abc')")).toBe('abc')
        expect(parseKeySegment('users')).toBeNull()
    })

    it('emits @odata.count only when asked', () => {
        const result = { rows: [{ Id: 1 }], total: 7 }
        expect(toODataEnvelope(result, true)).toEqual({ '@odata.count': 7, value: [{ Id: 1 }] })
        expect(toODataEnvelope(result, false)).toEqual({ value: [{ Id: 1 }] })
    })
})
