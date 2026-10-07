import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'utility',
        // The mock-db engine (schema / odata / generate) is deliberately pure, so it
        // runs in plain node. Only store.ts needs a real IndexedDB, which jsdom does
        // not provide — that is covered by the app-level smoke test instead.
        environment: 'node',
        include: ['tests/**/*.test.ts'],

        // Type-level assertions (`*.test-d.ts`). `tsconfig.json` doesn't include `tests/`,
        // so a plain `tsc --noEmit` would never look at them — without this, a type
        // regression (say, `monoState().jwt.token` decaying to `any`) passes silently.
        // Run with `vitest --typecheck`.
        typecheck: {
            include: ['tests/**/*.test-d.ts'],
            tsconfig: './tsconfig.test.json',
        },
    },
})
