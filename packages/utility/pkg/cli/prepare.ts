import path from 'node:path'
import { defineCommand, runMain } from 'citty'
import { runMonoPrepare } from '../../src/composables/mono-tsconfig'

const main = defineCommand({
  meta: {
    name: 'prepare',
    description: 'Generate .mono/tsconfig.json from the mono alias map and wire it into the root tsconfig (via extends).',
  },
  args: {
    cwd: {
      type: 'string',
      description: 'App root to prepare (defaults to the current directory).',
    },
  },
  async run({ args }) {
    const dirname = path.resolve(args.cwd ?? process.cwd())

    const result = await runMonoPrepare({ dirname })

    const monoRel = path.relative(dirname, result.monoTsconfigPath) || result.monoTsconfigPath
    console.log(`[mono] wrote ${monoRel} (${result.writtenKeys.length} aliases)`)

    if (result.addedExtends) {
      console.log('[mono] added "extends" -> ./.mono/tsconfig.json to tsconfig.json')
    } else {
      console.log('[mono] tsconfig.json already extends ./.mono/tsconfig.json')
    }

    if (result.removedKeys.length) {
      console.log(`[mono] removed ${result.removedKeys.length} inline alias path(s) from tsconfig.json`)
    }

    if (result.wiredApps.length) {
      console.log(`[mono] wired ${result.wiredApps.length} cloned app tsconfig(s) -> ${monoRel}: ${result.wiredApps.join(', ')}`)
    }
  },
})

runMain(main)
