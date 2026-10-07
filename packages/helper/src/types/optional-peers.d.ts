/**
 * Optional peers that are loaded with a dynamic `import()` and used as `any`.
 *
 * `@mono-lit/utility` is a workspace sibling AND a cyclic dependency of this package, so the CI build
 * (`pnpm -r --filter @mono-lit/utility --filter @mono-lit/helper run build`) runs the two IN PARALLEL: while
 * @mono-lit/utility's `tsdown` is cleaning and rewriting its `dist/`, this package's declaration pass can
 * find `@mono-lit/utility/fetching` missing and log TS2307. The import is typed `any` at its only call
 * site (`components/chart/mono-data-chart.ts`), so declaring the specifier here removes the race
 * without changing anything a consumer sees — `.d.ts` files under `src/types/` are not emitted.
 */
declare module '@mono-lit/utility/fetching'
