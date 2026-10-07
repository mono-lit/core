// Patterns taken VERBATIM from the real esw-project app. Each of these failed
// against the engine before this pass — two of them silently.

import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'

import { createMockDb, resetMonoMockDb } from '../pkg/mock-db'
import {
    evaluateFilter,
    executeQuery,
    parseExpand,
    parseFilter,
    parseQuery,
} from '../pkg/mock-db/odata'
import { parseMockSchema } from '../pkg/mock-db/schema'

/* ------------------------------ nested $expand ----------------------------- */

describe('nested $expand options', () => {
    it('does NOT split on a comma inside the parens', () => {
        // the original bug: 'PostBudget($select=Id,Nama)' was torn in half
        const items = parseExpand('PostBudget($select=Id,Nama),Brand($select=Nama)')
        expect(items.map((i) => i.name)).toEqual(['PostBudget', 'Brand'])
        expect(items[0]!.select).toEqual(['Id', 'Nama'])
    })

    it('parses DEFAULT_PROJECT_EXPAND from use-projek-store.ts:203 verbatim', () => {
        const items = parseExpand([
            'MasterOrganization($select=CompanyName)',
            'Brand($select=Nama)',
            'BudgetAlokasi($select=Id,Aktif,KodeDept;)', // NOTE the stray trailing `;`
            'HeaderProjekDepartemen($expand=Departmen($select=Nama))',
            "Approval($select=Id,UserId;$expand=StepApproval($select=ActionType);$filter=Status eq 'Menunggu';$top=1)",
        ])

        expect(items.map((i) => i.name)).toEqual([
            'MasterOrganization', 'Brand', 'BudgetAlokasi', 'HeaderProjekDepartemen', 'Approval',
        ])

        // the stray `;` must not produce a phantom option
        expect(items[2]!.select).toEqual(['Id', 'Aktif', 'KodeDept'])

        // 2-level nesting
        expect(items[3]!.expand).toEqual([{ name: 'Departmen', select: ['Nama'] }])

        // all four option kinds at once
        expect(items[4]).toMatchObject({
            name: 'Approval',
            select: ['Id', 'UserId'],
            filter: "Status eq 'Menunggu'",
            top: 1,
        })
        expect(items[4]!.expand).toEqual([{ name: 'StepApproval', select: ['ActionType'] }])
    })

    it('parses the multi-line single-string expand from use-topup-store.ts:552', () => {
        const items = parseExpand([`
            Approval($select=Id;$filter=Status eq 'Menunggu';$top=1),
            Departmen($select=Id,Nama,Code),
            TopupBudgetDetail($select=NilaiBudget)
        `])

        expect(items.map((i) => i.name)).toEqual(['Approval', 'Departmen', 'TopupBudgetDetail'])
        expect(items[1]!.select).toEqual(['Id', 'Nama', 'Code'])
    })

    it('tolerates a space after a comma (Feature($select=Id, Nama))', () => {
        expect(parseExpand('Feature($select=Id, Nama)')[0]!.select).toEqual(['Id', 'Nama'])
    })

    it('applies the nested $filter and $top to the CHILDREN', () => {
        const { schemas } = parseMockSchema({
            schema: {
                api: {
                    Header: {
                        fields: { Id: 'number|primary', Approval: 'array|Id->Approval:HeaderId' },
                    },
                    Approval: {
                        fields: { Id: 'number|primary', HeaderId: 'number|foreign', Status: 'string' },
                    },
                },
            },
        } as any)

        const headers = [{ Id: 1 }]
        const approvals = [
            { Id: 10, HeaderId: 1, Status: 'Disetujui' },
            { Id: 11, HeaderId: 1, Status: 'Menunggu' },
            { Id: 12, HeaderId: 1, Status: 'Menunggu' },
        ]

        const entities = schemas[0]!.entities
        const result = executeQuery(
            headers,
            { expand: parseExpand("Approval($select=Id;$filter=Status eq 'Menunggu';$top=1)") },
            {
                entity: entities.Header!,
                readEntity: () => approvals,
                entityOf: (name) => entities[name],
            },
        )

        // without the nested options this returned all 3 approvals
        expect(result.rows[0]!.Approval).toEqual([{ Id: 11 }])
    })
})

/* --------------------------- date functions -------------------------------- */

describe('date functions', () => {
    const row = { DibuatTanggal: '2025-03-04T10:20:30Z' }

    it('supports year() and Year() (the app writes both)', () => {
        expect(evaluateFilter(parseFilter('year(DibuatTanggal) eq 2025'), row)).toBe(true)
        expect(evaluateFilter(parseFilter('Year(DibuatTanggal) eq 2025'), row)).toBe(true)
        expect(evaluateFilter(parseFilter('year(DibuatTanggal) eq 2024'), row)).toBe(false)
    })

    it('supports month/day', () => {
        expect(evaluateFilter(parseFilter('month(DibuatTanggal) eq 3'), row)).toBe(true)
        expect(evaluateFilter(parseFilter('day(DibuatTanggal) eq 4'), row)).toBe(true)
    })

    it('compares an unquoted ISO date literal as an instant, not as text', () => {
        // what the core's literal() emits for a Date: v.toISOString(), unquoted
        expect(evaluateFilter(parseFilter('DibuatTanggal ge 2025-01-01T00:00:00.000Z'), row)).toBe(true)
        expect(evaluateFilter(parseFilter('DibuatTanggal lt 2025-01-01T00:00:00.000Z'), row)).toBe(false)
    })
})

/* ------------------------------ Nav/$count --------------------------------- */

describe('Nav/$count', () => {
    const { schemas } = parseMockSchema({
        schema: {
            api: {
                Budget: { fields: { Id: 'number|primary', Details: 'array|Id->Detail:BudgetId' } },
                Detail: { fields: { Id: 'number|primary', BudgetId: 'number|foreign' } },
            },
        },
    } as any)

    it('counts a virtual relation — Details/$count gt 0', () => {
        // was silently false for EVERY row, so the filter matched nothing
        const budgets = [{ Id: 1 }, { Id: 2 }]
        const details = [{ Id: 10, BudgetId: 1 }]

        const result = executeQuery(budgets, { filter: 'Details/$count gt 0' }, {
            entity: schemas[0]!.entities.Budget!,
            readEntity: () => details,
        })

        expect(result.rows.map((r) => r.Id)).toEqual([1])
    })
})

/* --------------------- groupby over a navigation path ---------------------- */

describe('groupby over a navigation path', () => {
    it('groupby((PostBudget/ParentName),aggregate($count as Count))', () => {
        const { schemas } = parseMockSchema({
            schema: {
                api: {
                    Alokasi: {
                        fields: {
                            Id: 'number|primary',
                            PostBudgetId: 'number|foreign',
                            PostBudget: 'object|PostBudgetId->PostBudget:Id',
                        },
                    },
                    PostBudget: { fields: { Id: 'number|primary', ParentName: 'string' } },
                },
            },
        } as any)

        const alokasi = [
            { Id: 1, PostBudgetId: 1 },
            { Id: 2, PostBudgetId: 1 },
            { Id: 3, PostBudgetId: 2 },
        ]
        const postBudgets = [
            { Id: 1, ParentName: 'Marketing' },
            { Id: 2, ParentName: 'Sales' },
        ]

        const result = executeQuery(
            alokasi,
            { apply: 'groupby((PostBudget/ParentName),aggregate($count as Count))' },
            {
                entity: schemas[0]!.entities.Alokasi!,
                readEntity: () => postBudgets,
            },
        )

        // a flat read collapsed all 3 rows into ONE null group — silently wrong
        expect(result.rows).toEqual([
            { 'PostBudget/ParentName': 'Marketing', Count: 2 },
            { 'PostBudget/ParentName': 'Sales', Count: 1 },
        ])
    })
})

/* ------------------------------ deep insert -------------------------------- */

describe('deep insert', () => {
    beforeEach(() => resetMonoMockDb())

    let version = 100
    const freshDb = () => {
        resetMonoMockDb()
        return createMockDb({
            dbName: `deep-${version++}`,
            version: 1,
            seedCount: 0,
            schema: {
                api: {
                    Header: {
                        fields: {
                            Id: 'number|primary',
                            Nama: 'string',
                            BudgetAlokasi: 'array|Id->Alokasi:IdHeaderProjek',
                        },
                    },
                    Alokasi: {
                        fields: {
                            Id: 'number|primary',
                            IdHeaderProjek: 'number|foreign',
                            NamaActivity: 'string',
                        },
                    },
                },
            },
        } as any)
    }

    it('POSTing a header with nested children creates rows in the CHILD entity set', async () => {
        const db = freshDb()

        const created = await db.request({
            url: '/api/Header',
            method: 'POST',
            payload: {
                Nama: 'Projek A',
                BudgetAlokasi: [
                    { NamaActivity: 'Activity 1' },
                    { NamaActivity: 'Activity 2' },
                ],
            },
        })

        expect(created.statusCode).toBe(201)
        const headerId = created.data.Id

        // the nested array must NOT be stored as a blob column on the header
        expect(created.data).not.toHaveProperty('BudgetAlokasi')

        // the children exist in their own entity set, pointing at the new parent
        const children = await db.request({ url: '/api/Alokasi' })
        expect(children.data.value).toHaveLength(2)
        expect(children.data.value.map((c: any) => c.IdHeaderProjek)).toEqual([headerId, headerId])
        expect(children.data.value.map((c: any) => c.NamaActivity)).toEqual(['Activity 1', 'Activity 2'])
    })

    it('the children come back through $expand', async () => {
        const db = freshDb()

        await db.request({
            url: '/api/Header',
            method: 'POST',
            payload: { Nama: 'P', BudgetAlokasi: [{ NamaActivity: 'X' }] },
        })

        const response = await db.request({
            url: '/api/Header',
            method: 'GET',
            params: { $expand: 'BudgetAlokasi($select=NamaActivity)' },
        })

        expect(response.data.value[0].BudgetAlokasi).toEqual([{ NamaActivity: 'X' }])
    })
})

/* ------------------------- the raw params the app sends -------------------- */

describe('parseQuery on real app params', () => {
    it('reads $apply and $filter together (use-kurang-budget-store.ts:502)', () => {
        const query = parseQuery({
            $apply: 'groupby((Program,DeptKode,CompanyId))',
            $filter: "(DeptKode eq 'MKT') and CompanyId eq 1",
        })
        expect(query.apply).toBe('groupby((Program,DeptKode,CompanyId))')
        expect(query.filter).toBe("(DeptKode eq 'MKT') and CompanyId eq 1")
    })
})
