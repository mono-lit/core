import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'helper',
        // The components are custom elements, so they need a DOM to register into.
        environment: 'jsdom',
        include: ['tests/**/*.test.ts'],
    },
})
