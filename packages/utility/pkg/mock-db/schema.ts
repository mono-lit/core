// pkg/mock-db/schema.ts — parse + validate the mock schema DSL.
//
// Pure: no IndexedDB, no config loading, no I/O. That keeps it unit-testable in
// plain node (the storage layer is the only part that needs a real browser).

import type { MonoMockDbConfig, MonoMockEntity } from '../../src/composables/create-config'

export type MonoMockFieldType =
    | 'number'
    | 'string'
    | 'boolean'
    | 'date'
    | 'object'
    | 'array'

/** `A->B:C` — "rows of B where `B[C] === row[A]`". */
export interface MonoMockRelation {
    /** Field on THIS entity whose value is matched. */
    localField: string
    /** Entity being pointed at. */
    targetEntity: string
    /** Field on the target entity that must equal `row[localField]`. */
    targetKey: string
    /** `object` -> first match, `array` -> every match. */
    kind: 'object' | 'array'
}

export interface MonoMockField {
    name: string
    type: MonoMockFieldType
    primary: boolean
    foreign: boolean
    /** Set when the modifier is a relation. Virtual: never persisted. */
    relation?: MonoMockRelation
}

export interface MonoMockParsedEntity {
    name: string
    /** Every declared field, including virtual relation fields. */
    fields: MonoMockField[]
    /** Fields actually written to the store (relations excluded). */
    columns: MonoMockField[]
    relations: MonoMockField[]
    primaryKey: string
    seed?: Record<string, any>[]
}

export interface MonoMockParsedSchema {
    /** The base-url this group of entities is served under. */
    baseUrl: string
    entities: Record<string, MonoMockParsedEntity>
}

export interface MonoMockSchemaError {
    baseUrl: string
    entity: string
    field?: string
    message: string
}

const FIELD_TYPES: MonoMockFieldType[] = ['number', 'string', 'boolean', 'date', 'object', 'array']

/** `object|userId->users:id` -> the relation half, or null when it isn't one. */
function parseRelationModifier(
    modifier: string,
    kind: MonoMockFieldType,
): MonoMockRelation | null {
    const match = /^([A-Za-z0-9_$]+)\s*->\s*([A-Za-z0-9_$]+)\s*:\s*([A-Za-z0-9_$]+)$/.exec(modifier)
    if (!match) return null
    if (kind !== 'object' && kind !== 'array') return null

    return {
        localField: match[1]!,
        targetEntity: match[2]!,
        targetKey: match[3]!,
        kind,
    }
}

/** Parse one `'<type>|<modifier>'` declaration. Throws with the field name attached. */
export function parseField(name: string, declaration: string): MonoMockField {
    const raw = String(declaration ?? '').trim()
    if (!raw) throw new Error(`field "${name}": empty declaration`)

    const [typePart, ...modifierParts] = raw.split('|')
    const type = String(typePart ?? '').trim() as MonoMockFieldType

    if (!FIELD_TYPES.includes(type)) {
        throw new Error(
            `field "${name}": unknown type "${type}" (expected ${FIELD_TYPES.join(' | ')})`,
        )
    }

    const field: MonoMockField = { name, type, primary: false, foreign: false }

    for (const part of modifierParts) {
        const modifier = part.trim()
        if (!modifier) continue

        if (modifier === 'primary') {
            field.primary = true
            continue
        }
        if (modifier === 'foreign') {
            field.foreign = true
            continue
        }

        const relation = parseRelationModifier(modifier, type)
        if (!relation) {
            throw new Error(
                `field "${name}": bad modifier "${modifier}" — expected primary, foreign, ` +
                `or a relation like "object|userId->users:id" (relations need type object or array)`,
            )
        }
        field.relation = relation
    }

    if (field.relation && field.primary) {
        throw new Error(`field "${name}": a relation cannot also be the primary key`)
    }

    return field
}

function parseEntity(name: string, entity: MonoMockEntity): MonoMockParsedEntity {
    const declarations = entity?.fields ?? {}
    const fields = Object.entries(declarations).map(([fieldName, declaration]) =>
        parseField(fieldName, declaration),
    )

    const primaries = fields.filter((f) => f.primary)
    if (primaries.length === 0) {
        throw new Error(`entity "${name}": no primary key (mark one field "…|primary")`)
    }
    if (primaries.length > 1) {
        throw new Error(
            `entity "${name}": ${primaries.length} primary keys (${primaries
                .map((f) => f.name)
                .join(', ')}) — exactly one is required`,
        )
    }

    const relations = fields.filter((f) => f.relation)

    return {
        name,
        fields,
        columns: fields.filter((f) => !f.relation),
        relations,
        primaryKey: primaries[0]!.name,
        seed: entity?.seed,
    }
}

/**
 * Parse every base-url group. Collects errors instead of throwing on the first
 * one, so `mono db validate` can report them all in a single pass.
 */
export function parseMockSchema(config: MonoMockDbConfig): {
    schemas: MonoMockParsedSchema[]
    errors: MonoMockSchemaError[]
} {
    const schemas: MonoMockParsedSchema[] = []
    const errors: MonoMockSchemaError[] = []

    for (const [baseUrl, entityMap] of Object.entries(config?.schema ?? {})) {
        const entities: Record<string, MonoMockParsedEntity> = {}

        for (const [entityName, entity] of Object.entries(entityMap ?? {})) {
            try {
                entities[entityName] = parseEntity(entityName, entity)
            } catch (error: any) {
                errors.push({ baseUrl, entity: entityName, message: error?.message ?? String(error) })
            }
        }

        // Relation targets can only be checked once every entity in the group is parsed.
        for (const entity of Object.values(entities)) {
            for (const field of entity.relations) {
                const relation = field.relation!
                const target = entities[relation.targetEntity]

                if (!target) {
                    errors.push({
                        baseUrl,
                        entity: entity.name,
                        field: field.name,
                        message: `relation points at unknown entity "${relation.targetEntity}"`,
                    })
                    continue
                }

                const hasLocal = entity.fields.some((f) => f.name === relation.localField)
                if (!hasLocal) {
                    errors.push({
                        baseUrl,
                        entity: entity.name,
                        field: field.name,
                        message: `relation reads local field "${relation.localField}", which this entity does not declare`,
                    })
                }

                const hasTargetKey = target.fields.some((f) => f.name === relation.targetKey)
                if (!hasTargetKey) {
                    errors.push({
                        baseUrl,
                        entity: entity.name,
                        field: field.name,
                        message: `relation reads "${relation.targetEntity}.${relation.targetKey}", which that entity does not declare`,
                    })
                }
            }
        }

        schemas.push({ baseUrl, entities })
    }

    return { schemas, errors }
}

/** Strip leading/trailing slashes so `/a/` and `a` compare equal. */
export function normalizeSegment(value: string): string {
    return String(value ?? '').replace(/^\/+|\/+$/g, '')
}

/**
 * Find the schema whose base-url this request url belongs to, and the entity
 * within it. Matches on path segments (never a bare substring), so a base-url of
 * `flow` cannot swallow `/flowers/1`.
 *
 * Accepts absolute urls, and urls where the base-url is only part of the path
 * (e.g. `https://host/api/my-mock/users`).
 */
export function matchMockRoute(
    schemas: MonoMockParsedSchema[],
    url: string,
): { schema: MonoMockParsedSchema; entity: MonoMockParsedEntity; rest: string } | null {
    let path = String(url ?? '')

    // drop origin + query/hash so only path segments remain
    path = path.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '')
    path = path.split('?')[0]!.split('#')[0]!

    const segments = normalizeSegment(path).split('/').filter(Boolean)
    if (!segments.length) return null

    for (const schema of schemas) {
        const baseSegments = normalizeSegment(schema.baseUrl).split('/').filter(Boolean)
        if (!baseSegments.length) continue

        const at = indexOfSequence(segments, baseSegments)
        if (at < 0) continue

        const after = segments.slice(at + baseSegments.length)
        if (!after.length) continue

        // `Entity(1)` — strip the key segment to get the entity name
        const entityName = after[0]!.replace(/\(.*\)$/, '')
        const entity = schema.entities[entityName]
        if (!entity) continue

        return { schema, entity, rest: after.join('/') }
    }

    return null
}

/** Index of `needle` inside `haystack`, comparing whole segments. */
function indexOfSequence(haystack: string[], needle: string[]): number {
    outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) continue outer
        }
        return i
    }
    return -1
}
