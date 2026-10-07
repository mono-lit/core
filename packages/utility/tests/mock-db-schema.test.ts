import { describe, expect, it } from 'vitest'

import { matchMockRoute, parseField, parseMockSchema } from '../pkg/mock-db/schema'
import { generateSeed, orderEntitiesByDependency } from '../pkg/mock-db/generate'

const schema = {
    schema: {
        'my-base': {
            users: {
                fields: {
                    id: 'number|primary',
                    name: 'string',
                    email: 'string',
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
}

describe('field DSL', () => {
    it('parses type + primary', () => {
        expect(parseField('id', 'number|primary')).toMatchObject({ type: 'number', primary: true })
    })

    it('parses a relation', () => {
        expect(parseField('user', 'object|userId->users:id').relation).toEqual({
            localField: 'userId',
            targetEntity: 'users',
            targetKey: 'id',
            kind: 'object',
        })
    })

    it('rejects an unknown type', () => {
        expect(() => parseField('x', 'sting')).toThrow(/unknown type/i)
    })

    it('rejects a relation on a scalar type', () => {
        expect(() => parseField('x', 'number|userId->users:id')).toThrow(/bad modifier/i)
    })

    it('rejects a bad modifier', () => {
        expect(() => parseField('x', 'string|pirmary')).toThrow(/bad modifier/i)
    })
})

describe('schema validation', () => {
    it('accepts a valid schema', () => {
        const { schemas, errors } = parseMockSchema(schema as any)
        expect(errors).toEqual([])
        expect(schemas[0]!.entities.users!.primaryKey).toBe('id')
        expect(schemas[0]!.entities.users!.relations.map((f) => f.name)).toEqual(['cars'])
        // relations are virtual — never a stored column
        expect(schemas[0]!.entities.users!.columns.map((f) => f.name)).toEqual(['id', 'name', 'email'])
    })

    it('reports a missing primary key', () => {
        const { errors } = parseMockSchema({
            schema: { base: { users: { fields: { name: 'string' } } } },
        } as any)
        expect(errors[0]!.message).toMatch(/no primary key/i)
    })

    it('reports two primary keys', () => {
        const { errors } = parseMockSchema({
            schema: { base: { users: { fields: { a: 'number|primary', b: 'number|primary' } } } },
        } as any)
        expect(errors[0]!.message).toMatch(/2 primary keys/i)
    })

    it('reports a relation pointing at an unknown entity', () => {
        const { errors } = parseMockSchema({
            schema: {
                base: {
                    users: { fields: { id: 'number|primary', pets: 'array|id->pets:userId' } },
                },
            },
        } as any)
        expect(errors[0]!.message).toMatch(/unknown entity "pets"/i)
    })

    it('reports a relation reading a field the target does not declare', () => {
        const { errors } = parseMockSchema({
            schema: {
                base: {
                    users: { fields: { id: 'number|primary', cars: 'array|id->cars:ownerId' } },
                    cars: { fields: { id: 'number|primary', userId: 'number|foreign' } },
                },
            },
        } as any)
        expect(errors[0]!.message).toMatch(/cars\.ownerId/i)
    })
})

describe('route matching', () => {
    const { schemas } = parseMockSchema(schema as any)

    it('matches an entity under the base-url', () => {
        expect(matchMockRoute(schemas, '/my-base/users')?.entity.name).toBe('users')
    })

    it('matches when the base-url is nested in a longer path', () => {
        expect(matchMockRoute(schemas, 'https://x.dev/api/my-base/cars?$top=1')?.entity.name).toBe('cars')
    })

    it('matches a key segment', () => {
        expect(matchMockRoute(schemas, '/my-base/users(3)')?.entity.name).toBe('users')
    })

    it('does NOT match an unknown entity', () => {
        expect(matchMockRoute(schemas, '/my-base/orders')).toBeNull()
    })

    it('does NOT match on a bare substring — segments only', () => {
        // 'my-base' must not swallow '/my-base-other/users'
        expect(matchMockRoute(schemas, '/my-base-other/users')).toBeNull()
    })
})

describe('seed generator', () => {
    const { schemas } = parseMockSchema(schema as any)

    it('generates parents before children', () => {
        const ordered = orderEntitiesByDependency(Object.values(schemas[0]!.entities))
        expect(ordered.map((entity) => entity.name)).toEqual(['users', 'cars'])
    })

    it('points every foreign key at a real parent row', () => {
        const seed = generateSeed(schemas[0]!, { count: 5, random: 1 })
        const userIds = new Set(seed.users!.map((row) => row.id))

        expect(seed.cars).toHaveLength(5)
        for (const car of seed.cars!) {
            // without this, $expand silently returns nothing
            expect(userIds.has(car.userId)).toBe(true)
        }
    })

    it('is deterministic for a fixed seed', () => {
        const a = generateSeed(schemas[0]!, { count: 3, random: 7 })
        const b = generateSeed(schemas[0]!, { count: 3, random: 7 })
        expect(a).toEqual(b)
    })

    it('never persists a relation field', () => {
        const seed = generateSeed(schemas[0]!, { count: 2, random: 1 })
        expect(seed.users![0]).not.toHaveProperty('cars')
        expect(seed.cars![0]).not.toHaveProperty('user')
    })

    it('lets an explicit seed beat the generator', () => {
        const { schemas: withSeed } = parseMockSchema({
            schema: {
                base: {
                    nodes: {
                        fields: { Id: 'number|primary', Type: 'string', Icon: 'string' },
                        // exactly the case a generator cannot invent
                        seed: [{ Id: 1, Type: 'start', Icon: 'i-mdi-circle-slice-8' }],
                    },
                },
            },
        } as any)

        const seed = generateSeed(withSeed[0]!, { count: 10, random: 1 })
        expect(seed.nodes).toEqual([{ Id: 1, Type: 'start', Icon: 'i-mdi-circle-slice-8' }])
    })
})
