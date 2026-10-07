// pkg/mock-db/generate.ts — deterministic seed rows from a parsed schema.
//
// Deterministic on purpose: a fixed RNG seed means the same rows every reload,
// so a demo doesn't reshuffle under you and a failing test reproduces.
//
// Pure — no storage, no DOM.

import type { MonoMockField, MonoMockParsedEntity, MonoMockParsedSchema } from './schema'

/** mulberry32 — small, fast, seedable. We need repeatability, not cryptography. */
export function createRandom(seed: number) {
    let state = (seed >>> 0) || 1

    return function random(): number {
        state |= 0
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const WORDS = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
]

function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * A value for one column. Name-aware: a field called `email` should look like an
 * email, otherwise generated data is useless for eyeballing a UI.
 */
function generateValue(
    field: MonoMockField,
    index: number,
    random: () => number,
): unknown {
    const name = field.name.toLowerCase()
    const word = WORDS[Math.floor(random() * WORDS.length)] ?? 'alpha'

    switch (field.type) {
        case 'number':
            // a foreign key is filled in later, from real parent rows
            return field.foreign ? 0 : Math.floor(random() * 1000)

        case 'boolean':
            return random() > 0.5

        case 'date':
            // spread across the last ~year, stable per index
            return new Date(Date.UTC(2025, 0, 1) + index * 86_400_000).toISOString()

        case 'string': {
            if (name.includes('email')) return `${word}${index + 1}@example.com`
            if (name.includes('name') || name.includes('title')) return `${titleCase(word)} ${index + 1}`
            if (name.includes('phone')) return `08${Math.floor(random() * 1e10).toString().padStart(10, '0')}`
            if (name.includes('url') || name.includes('link')) return `https://example.com/${word}/${index + 1}`
            if (name.includes('icon')) return `i-mdi-${word}`
            return `${titleCase(word)} ${index + 1}`
        }

        case 'object':
            return {}

        case 'array':
            return []

        default:
            return null
    }
}

/**
 * Topologically order entities so every parent is generated before the children
 * that point at it — otherwise a foreign key would reference rows that don't
 * exist yet. Cycles fall back to declaration order (a self-referencing FK just
 * gets a key from an already-generated row of the same entity).
 */
export function orderEntitiesByDependency(
    entities: MonoMockParsedEntity[],
): MonoMockParsedEntity[] {
    const byName = new Map(entities.map((entity) => [entity.name, entity]))
    const ordered: MonoMockParsedEntity[] = []
    const done = new Set<string>()
    const visiting = new Set<string>()

    const visit = (entity: MonoMockParsedEntity) => {
        if (done.has(entity.name) || visiting.has(entity.name)) return
        visiting.add(entity.name)

        // depend on every entity this one points AT via a many-to-one relation
        for (const field of entity.relations) {
            const relation = field.relation!
            if (relation.kind !== 'object') continue
            const parent = byName.get(relation.targetEntity)
            if (parent && parent.name !== entity.name) visit(parent)
        }

        visiting.delete(entity.name)
        done.add(entity.name)
        ordered.push(entity)
    }

    for (const entity of entities) visit(entity)
    return ordered
}

export interface GenerateOptions {
    /** Rows per entity that has no explicit `seed`. */
    count?: number
    /** RNG seed — same seed, same rows. */
    random?: number
}

/**
 * Build the seed for one base-url group.
 *
 * An entity's explicit `seed` wins outright: a generator cannot invent
 * enum-like columns or a serialized graph, so anything an app parses must be
 * supplied as fixtures.
 */
export function generateSeed(
    schema: MonoMockParsedSchema,
    options: GenerateOptions = {},
): Record<string, Record<string, any>[]> {
    const count = Math.max(0, options.count ?? 10)
    const random = createRandom(options.random ?? 1)

    const tables: Record<string, Record<string, any>[]> = {}
    const ordered = orderEntitiesByDependency(Object.values(schema.entities))

    for (const entity of ordered) {
        if (entity.seed) {
            // fixtures win; copy so callers can't mutate the config
            tables[entity.name] = entity.seed.map((row) => ({ ...row }))
            continue
        }

        const rows: Record<string, any>[] = []

        for (let index = 0; index < count; index++) {
            const row: Record<string, any> = {}

            for (const field of entity.columns) {
                row[field.name] = field.primary
                    ? index + 1
                    : generateValue(field, index, random)
            }

            rows.push(row)
        }

        // Point every foreign key at a REAL parent row. The relation tells us which
        // entity/key a given FK column refers to; without this the FKs are noise and
        // $expand returns nothing.
        for (const field of entity.relations) {
            const relation = field.relation!
            if (relation.kind !== 'object') continue

            const parentRows = tables[relation.targetEntity]
            if (!parentRows?.length) continue

            const localField = entity.columns.find((column) => column.name === relation.localField)
            if (!localField) continue

            rows.forEach((row, index) => {
                const parent = parentRows[index % parentRows.length]!
                row[relation.localField] = parent[relation.targetKey]
            })
        }

        tables[entity.name] = rows
    }

    return tables
}
