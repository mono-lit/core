// pkg/cli/db/index.ts — `mono db`.
//
// NOTE there is no `serve` here, and that is not an oversight: the mock lives in
// the BROWSER's IndexedDB, so there is nothing to listen on, and a node process
// cannot read the store either. Runtime management is `monoMockDb().reset() /
// .export() / .import()` in the app.
//
// What a CLI *can* do is everything static: validate the merged schema and show
// what the generator would produce.

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { defineCommand, runMain } from 'citty'

import { getMonoConfig } from '../../../src/composables/config-node'
import { monoAlias } from '../../../src/composables/mono-alias'
import { resolveMonoConfig } from '../../../src/composables/create-config'
import { parseMockSchema } from '../../mock-db/schema'
import { generateSeed } from '../../mock-db/generate'

/**
 * The merged config, including `extends`.
 *
 * Two things are load-bearing here:
 *
 * 1. jiti (inside c12) knows nothing about the `@mono-host` / `@<app>` aliases, and
 *    every real mono.config.ts imports through them (`@mono-host/odata/...`, and
 *    `@mono-host-root/mono.config` for `extends`). So teach it the same alias map
 *    Vite and the Nuxt module use — otherwise the config fails to load outright.
 * 2. `getMonoConfig` runs c12 with `extend: false` (mono's `extends` holds thunks,
 *    which c12 can't resolve), so it returns the config with `extends` still raw.
 *    `resolveMonoConfig` is what merges the layers — which is how several apps'
 *    schemas end up in one place.
 */
async function loadMergedConfig(cwd?: string) {
    const dirname = path.resolve(cwd ?? process.cwd())
    const alias = monoAlias({ dirname })

    const raw = await getMonoConfig({ cwd: dirname, jitiOptions: { alias } })
    return resolveMonoConfig(raw)
}

function requireMock(config: any) {
    const mock = config?.mockIndexedDB
    if (!mock?.schema || !Object.keys(mock.schema).length) {
        console.error(
            '[mono db] no `mockIndexedDB.schema` in the merged mono config.\n' +
            '          Declare one in mono.config.ts, or in a synced app that this config extends.',
        )
        process.exit(1)
    }
    return mock
}

const validateCommand = defineCommand({
    meta: { name: 'validate', description: 'Parse every mock schema and report bad fields/relations.' },
    args: { cwd: { type: 'string', description: 'App root (defaults to the current directory).' } },
    async run({ args }) {
        const config = await loadMergedConfig(args.cwd)
        const mock = requireMock(config)

        const { schemas, errors } = parseMockSchema(mock)

        for (const schema of schemas) {
            const entities = Object.values(schema.entities)
            console.log(`\n  ${schema.baseUrl}  (${entities.length} entit${entities.length === 1 ? 'y' : 'ies'})`)
            for (const entity of entities) {
                const relations = entity.relations.map((f) => f.name)
                console.log(
                    `    - ${entity.name}  pk=${entity.primaryKey}` +
                    `  columns=${entity.columns.length}` +
                    (relations.length ? `  expand=[${relations.join(', ')}]` : '') +
                    (entity.seed ? `  seed=${entity.seed.length} row(s)` : ''),
                )
            }
        }

        if (errors.length) {
            console.error(`\n  ${errors.length} error(s):`)
            for (const error of errors) {
                console.error(
                    `    x ${error.baseUrl} -> ${error.entity}${error.field ? `.${error.field}` : ''}: ${error.message}`,
                )
            }
            process.exit(1)
        }

        console.log('\n  schema OK\n')
    },
})

const previewCommand = defineCommand({
    meta: { name: 'preview', description: 'Print the rows the generator would produce.' },
    args: {
        cwd: { type: 'string', description: 'App root (defaults to the current directory).' },
        entity: { type: 'string', description: 'Only this entity.' },
        count: { type: 'string', description: 'Rows per entity (overrides seedCount).' },
    },
    async run({ args }) {
        const config = await loadMergedConfig(args.cwd)
        const mock = requireMock(config)

        const { schemas, errors } = parseMockSchema(mock)
        if (errors.length) {
            console.error('[mono db] schema has errors — run `mono db validate` first.')
            process.exit(1)
        }

        for (const schema of schemas) {
            const seed = generateSeed(schema, {
                count: args.count ? Number(args.count) : mock.seedCount,
                random: mock.seedRandom,
            })

            for (const [entityName, rows] of Object.entries(seed)) {
                if (args.entity && args.entity !== entityName) continue
                console.log(`\n  ${schema.baseUrl} / ${entityName}  (${rows.length} rows)`)
                console.log(JSON.stringify(rows, null, 2))
            }
        }
    },
})

const exportCommand = defineCommand({
    meta: {
        name: 'export',
        description: 'Write generated rows to a JSON file (to promote them into an explicit `seed`).',
    },
    args: {
        cwd: { type: 'string', description: 'App root (defaults to the current directory).' },
        out: { type: 'string', description: 'Output file.', default: 'mock-seed.json' },
        count: { type: 'string', description: 'Rows per entity (overrides seedCount).' },
    },
    async run({ args }) {
        const config = await loadMergedConfig(args.cwd)
        const mock = requireMock(config)

        const { schemas, errors } = parseMockSchema(mock)
        if (errors.length) {
            console.error('[mono db] schema has errors — run `mono db validate` first.')
            process.exit(1)
        }

        const out: Record<string, Record<string, Record<string, any>[]>> = {}
        for (const schema of schemas) {
            out[schema.baseUrl] = generateSeed(schema, {
                count: args.count ? Number(args.count) : mock.seedCount,
                random: mock.seedRandom,
            })
        }

        const file = path.resolve(process.cwd(), args.out)
        writeFileSync(file, JSON.stringify(out, null, 2))
        console.log(`[mono db] wrote ${file}`)
    },
})

const main = defineCommand({
    meta: {
        name: 'db',
        description:
            'Mock IndexedDB backend: validate schemas and preview generated seed data. ' +
            'The store itself lives in the browser — use monoMockDb().reset()/.export() at runtime.',
    },
    subCommands: {
        validate: validateCommand,
        preview: previewCommand,
        export: exportCommand,
    },
})

runMain(main)
