import { describe, expect, it } from 'vitest'

import { evaluateFilter, executeQuery, parseFilter } from '../pkg/mock-db/odata'
import { parseMockSchema } from '../pkg/mock-db/schema'

/* ------------------------------- in operator ------------------------------ */

describe('$filter — the `in` operator', () => {
    const rows = [{ Id: 1 }, { Id: 2 }, { Id: 3 }, { Id: 4 }]

    const match = (filter: string, data: any[] = rows) => {
        const ast = parseFilter(filter)
        return data.filter((row) => evaluateFilter(ast, row))
    }

    it('matches a numeric list', () => {
        expect(match('Id in (1,2,3)').map((r) => r.Id)).toEqual([1, 2, 3])
    })

    it('matches a string list', () => {
        const names = [{ Name: 'a' }, { Name: 'b' }, { Name: 'c' }]
        expect(match("Name in ('a','c')", names).map((r: any) => r.Name)).toEqual(['a', 'c'])
    })

    it('combines with and/or', () => {
        expect(match('Id in (1,2) or Id eq 4').map((r) => r.Id)).toEqual([1, 2, 4])
    })

    it('an empty list matches nothing', () => {
        expect(match('Id in ()')).toEqual([])
    })

    it('does not numeric-coerce: "007" is not in ("7")', () => {
        // same rule as eq — a padded code must not collapse onto its numeric value
        const codes = [{ Code: '007' }]
        expect(match("Code in ('7')", codes)).toEqual([])
        expect(match("Code in ('007')", codes)).toHaveLength(1)
    })

    it('rejects the inverted form and names the correct one', () => {
        // `(1,2,3) in 'Id'` is not valid OData: operands reversed, and 'Id' quoted
        // makes it a string literal rather than a field
        expect(() => parseFilter("(1,2,3) in 'Id'")).toThrow(/Field in \(1,2,3\)/)
    })
})

/* --------------------------------- concat --------------------------------- */

describe('$filter — concat', () => {
    it('handles the real comma-delimited department check', () => {
        // straight from the app: contains(concat(concat(',', DeptTujuan), ','), ',IT,')
        const filter = "contains(concat(concat(',', DeptTujuan), ','), ',IT,')"
        const ast = parseFilter(filter)

        expect(evaluateFilter(ast, { DeptTujuan: 'IT' })).toBe(true)
        expect(evaluateFilter(ast, { DeptTujuan: 'HR,IT,FIN' })).toBe(true)
        // the comma-wrapping is what stops a partial match — ITSM must NOT match IT
        expect(evaluateFilter(ast, { DeptTujuan: 'ITSM' })).toBe(false)
        expect(evaluateFilter(ast, { DeptTujuan: 'HR' })).toBe(false)
    })

    it('is n-ary and composes with tolower', () => {
        const ast = parseFilter("contains(tolower(concat(A, B)), 'xy')")
        expect(evaluateFilter(ast, { A: 'X', B: 'Y' })).toBe(true)
    })

    it('survives an escaped quote in the literal', () => {
        const ast = parseFilter("contains(concat(Name, '!'), 'O''Brien!')")
        expect(evaluateFilter(ast, { Name: "O'Brien" })).toBe(true)
    })
})

/* --------------------------------- lambda --------------------------------- */

describe('$filter — lambda any/all', () => {
    const { schemas } = parseMockSchema({
        schema: {
            budget: {
                KurangBudget: {
                    fields: {
                        Id: 'number|primary',
                        KurangBudgetDetail: 'array|Id->KurangBudgetDetail:BudgetId',
                    },
                },
                KurangBudgetDetail: {
                    fields: {
                        Id: 'number|primary',
                        BudgetId: 'number|foreign',
                        Bulan: 'number',
                    },
                },
            },
        },
    } as any)

    const entity = schemas[0]!.entities.KurangBudget!

    const budgets = [{ Id: 1 }, { Id: 2 }, { Id: 3 }]
    const details = [
        { Id: 10, BudgetId: 1, Bulan: 3 },
        { Id: 11, BudgetId: 1, Bulan: 7 },
        { Id: 12, BudgetId: 2, Bulan: 7 },
        // budget 3 has no details at all
    ]

    const readEntity = (name: string) => (name === 'KurangBudgetDetail' ? details : [])

    it('resolves a lambda over a VIRTUAL relation, with no $expand', () => {
        // the relation is never materialised on the row — the evaluator has to join it
        // on demand, or this silently matches nothing
        const result = executeQuery(budgets, {
            filter: 'KurangBudgetDetail/any(d: d/Bulan eq 3)',
        }, { entity, readEntity })

        expect(result.rows.map((r) => r.Id)).toEqual([1])
    })

    it('any() is false for a row whose collection is empty', () => {
        const result = executeQuery(budgets, {
            filter: 'KurangBudgetDetail/any(d: d/Bulan eq 7)',
        }, { entity, readEntity })

        expect(result.rows.map((r) => r.Id)).toEqual([1, 2]) // not 3 — it has no details
    })

    it('all() is vacuously TRUE over an empty collection, per spec', () => {
        const result = executeQuery(budgets, {
            filter: 'KurangBudgetDetail/all(d: d/Bulan eq 7)',
        }, { entity, readEntity })

        // budget 1 has a Bulan 3 -> fails; budget 2 all 7 -> passes;
        // budget 3 is empty -> vacuously true
        expect(result.rows.map((r) => r.Id)).toEqual([2, 3])
    })

    it('bare any() means "the collection is non-empty"', () => {
        const result = executeQuery(budgets, {
            filter: 'KurangBudgetDetail/any()',
        }, { entity, readEntity })

        expect(result.rows.map((r) => r.Id)).toEqual([1, 2])
    })

    it('works on an already-materialised collection too', () => {
        // no schema context at all — the array is right there on the row
        const ast = parseFilter('Detail/any(d: d/Bulan eq 3)')
        expect(evaluateFilter(ast, { Detail: [{ Bulan: 3 }] })).toBe(true)
        expect(evaluateFilter(ast, { Detail: [{ Bulan: 9 }] })).toBe(false)
        expect(evaluateFilter(ast, { Detail: [] })).toBe(false)
    })

    it('combines a lambda with a normal predicate', () => {
        const result = executeQuery(budgets, {
            filter: 'Id eq 1 and KurangBudgetDetail/any(d: d/Bulan eq 7)',
        }, { entity, readEntity })

        expect(result.rows.map((r) => r.Id)).toEqual([1])
    })

    it('supports a compound predicate inside the lambda', () => {
        const result = executeQuery(budgets, {
            filter: 'KurangBudgetDetail/any(d: d/Bulan gt 5 and d/Bulan lt 8)',
        }, { entity, readEntity })

        expect(result.rows.map((r) => r.Id)).toEqual([1, 2])
    })

    it('rejects a lambda with no range variable', () => {
        expect(() => parseFilter('Detail/any(d/Bulan eq 3)')).toThrow(/range variable/i)
    })
})

/* ------------------------- path through an object rel ---------------------- */

describe('$filter — navigation path', () => {
    const { schemas } = parseMockSchema({
        schema: {
            shop: {
                cars: {
                    fields: {
                        id: 'number|primary',
                        userId: 'number|foreign',
                        user: 'object|userId->users:id',
                    },
                },
                users: { fields: { id: 'number|primary', name: 'string' } },
            },
        },
    } as any)

    it('reads through an object relation (`user/name`)', () => {
        const cars = [{ id: 1, userId: 1 }, { id: 2, userId: 2 }]
        const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }]

        const result = executeQuery(cars, { filter: "user/name eq 'Ada'" }, {
            entity: schemas[0]!.entities.cars!,
            readEntity: () => users,
        })

        expect(result.rows.map((r) => r.id)).toEqual([1])
    })
})
