import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { monoExtendRoute } from '../src/vite/extend-route'

/**
 * One layout per page, whatever the page-folder shape.
 *
 * `setupLayouts` (vite-plugin-vue-layouts-next) wraps in two independent places:
 * every TOP-LEVEL record, and any record declaring `meta.layout`. vue-router turns a
 * page folder into a component-less GROUP record, and the plugin's guard against
 * wrapping a group only fires when the group's `''` child is already a layout — i.e.
 * only when the folder has an `index.vue` that declares one. Every other shape gets
 * the default layout around the group AND the page's own layout inside it, so
 * `pages/module-one/example.vue` renders two nested layouts while
 * `pages/flow/{index,create}.vue` renders one. Hence "sometimes".
 *
 * `monoExtendRoute` settles it per node: a group can never own a layout, and a page
 * always declares one.
 */

let dir: string

/** A page file whose macro declares `layout` (or nothing). */
function page(rel: string, macro?: string): string {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `<script setup lang="ts">\n${macro ?? ''}\n</script>\n<template><div /></template>\n`)
  return file
}

/** Stand-in for vue-router's `EditableTreeNode`, recording what gets written. */
function node(file?: string, meta: Record<string, unknown> = {}) {
  const written: Record<string, unknown> = {}
  return {
    ...(file ? { components: new Map([['default', file]]) } : {}),
    meta,
    addToMeta(patch: Record<string, unknown>) {
      Object.assign(written, patch)
    },
    written,
  }
}

const REMOTE = path.join('.mono', 'apps', 'mono-host', 'app', 'pages')

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-route-'))
})

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('monoExtendRoute — layout normalisation', () => {
    it('never lets a folder group own a layout', () => {
        // The group record is the one setupLayouts wraps in the default layout on
        // top of whatever its children declare. `false` makes it skip the record.
        const group = node()
        monoExtendRoute()(group as any)
        expect(group.written).toEqual({ layout: false })
    })

    it('leaves a declared layout alone', () => {
        const file = page('src/pages/home.vue', `definePage({ meta: { layout: 'home', title: 'Home' } })`)
        const route = node(file)

        monoExtendRoute()(route as any)

        // Nothing injected: the page said what it wants. (vue-router merges the real
        // `definePage` data at runtime, and it wins over static meta anyway.)
        expect(route.written).toEqual({})
    })

    it('gives a page that declares nothing an explicit default', () => {
        const file = page('src/pages/plain.vue')
        const route = node(file)

        monoExtendRoute()(route as any)

        // Without this the page would lose its layout entirely, since the group
        // wrapper it used to inherit from is now suppressed.
        expect(route.written).toEqual({ layout: 'default' })
    })

    it('respects a page opting out with layout: false', () => {
        const file = page('src/pages/bare.vue', `definePage({ meta: { layout: false } })`)
        const route = node(file)

        monoExtendRoute()(route as any)

        expect(route.written).toEqual({})
    })

    it('honours a <route>-block layout already on the node', () => {
        const file = page('src/pages/blocky.vue')
        const route = node(file, { layout: 'auth' })

        monoExtendRoute()(route as any)

        expect(route.written).toEqual({})
    })

    it('honours defaultLayout', () => {
        const file = page('src/pages/plain.vue')
        const route = node(file)

        monoExtendRoute({ defaultLayout: 'home' })(route as any)

        expect(route.written).toEqual({ layout: 'home' })
    })

    it('still seeds definePageMeta for synced remote pages', () => {
        const file = page(path.join(REMOTE, 'home.vue'), `definePageMeta({ layout: 'home', title: 'Home' })`)
        const route = node(file)

        monoExtendRoute()(route as any)

        // vue-router never reads `definePageMeta`, so this is the only way the
        // remote page's layout reaches `setupLayouts`.
        expect(route.written).toEqual({ layout: 'home', title: 'Home' })
    })

    it('can be switched off, restoring the old behaviour', () => {
        const group = node()
        const plain = node(page('src/pages/plain.vue'))

        monoExtendRoute({ normalizeLayouts: false })(group as any)
        monoExtendRoute({ normalizeLayouts: false })(plain as any)

        expect(group.written).toEqual({})
        expect(plain.written).toEqual({})
    })
})

/**
 * `deepSetupLayout`, vendored verbatim from vite-plugin-vue-layouts-next@2.1.0
 * (`dist/index.mjs:205-256`, template placeholders filled in). Vendored on purpose:
 * these assertions are about ITS behaviour, so the test has to fail when either side
 * changes rather than silently agreeing with itself.
 */
function setupLayouts(routes: any[], layouts: Record<string, string>, defaultLayout = 'default'): any[] {
  const inheritDefaultLayout = true
  function deepSetupLayout(routes: any[], top = true): any[] {
    return routes.map((route) => {
      if (route.children?.length > 0) route.children = deepSetupLayout(route.children, false)
      if (top) {
        const skipLayout =
          !route.component && route.children?.find((r: any) => (r.path === '' || r.path === '/') && r.meta?.isLayout)
        if (skipLayout) return route
        if (route.meta?.layout !== false && inheritDefaultLayout) {
          return {
            path: route.path,
            component: layouts[route.meta?.layout || defaultLayout],
            children: route.path === '/' ? [route] : [{ ...route, path: '' }],
            meta: { isLayout: true },
          }
        }
      }
      if (route.meta?.layout) {
        return {
          path: route.path,
          component: layouts[route.meta.layout],
          children: [{ ...route, path: '' }],
          meta: { isLayout: true },
        }
      }
      return route
    })
  }
  return deepSetupLayout(routes)
}

/** Deepest count of nested layout wrappers above any page in the tree. */
function maxLayoutDepth(routes: any[], depth = 0): number {
  let max = 0
  for (const route of routes) {
    const next = route.meta?.isLayout ? depth + 1 : depth
    max = Math.max(max, route.children?.length ? maxLayoutDepth(route.children, next) : next)
  }
  return max
}

/** Apply the callback to a route tree the way vue-router walks it. */
function normalize(routes: any[], extend: (r: any) => void): any[] {
  for (const route of routes) {
    const written: Record<string, unknown> = {}
    extend({
      ...(route.component ? { components: new Map([['default', route.component]]) } : {}),
      meta: route.meta ?? {},
      addToMeta: (patch: Record<string, unknown>) => Object.assign(written, patch),
    })
    route.meta = { ...route.meta, ...written }
    if (route.children?.length) normalize(route.children, extend)
  }
  return routes
}

describe('setupLayouts over normalised routes', () => {
    const LAYOUTS = { default: 'L(default)', home: 'L(home)' }

    /** The real generated shape: `{ path: '/module-one', children: [{ path: 'example' }] }`. */
    const tree = () => {
        const file = page('src/pages/module-one/example.vue', `definePage({ meta: { layout: 'home' } })`)
        return [{ path: '/module-one', children: [{ path: 'example', component: file, meta: { layout: 'home' } }] }]
    }

    it('DOUBLES the layout without normalisation (the bug)', () => {
        expect(maxLayoutDepth(setupLayouts(tree(), LAYOUTS))).toBe(2)
    })

    it('wraps exactly once after normalisation (the fix)', () => {
        expect(maxLayoutDepth(setupLayouts(normalize(tree(), monoExtendRoute()), LAYOUTS))).toBe(1)
    })

    it('keeps one layout for every other folder shape', () => {
        const withIndex = () => {
            const idx = page('src/pages/flow/index.vue', `definePage({ meta: { layout: 'home' } })`)
            const create = page('src/pages/flow/create.vue', `definePage({ meta: { layout: 'home' } })`)
            return [{ path: '/flow', children: [
                { path: '', component: idx, meta: { layout: 'home' } },
                { path: 'create', component: create, meta: { layout: 'home' } },
            ] }]
        }
        const indexNoLayout = () => {
            const idx = page('src/pages/flow2/index.vue')
            const create = page('src/pages/flow2/create.vue', `definePage({ meta: { layout: 'home' } })`)
            return [{ path: '/flow2', children: [
                { path: '', component: idx },
                { path: 'create', component: create, meta: { layout: 'home' } },
            ] }]
        }
        const deep = () => {
            const idx = page('src/pages/budget/alokasi/index.vue', `definePage({ meta: { layout: 'home' } })`)
            return [{ path: '/budget', children: [
                { path: 'alokasi', children: [{ path: '', component: idx, meta: { layout: 'home' } }] },
            ] }]
        }
        const topLevel = () => {
            const home = page('src/pages/home.vue', `definePage({ meta: { layout: 'home' } })`)
            return [{ path: '/home', component: home, meta: { layout: 'home' } }]
        }

        // `indexNoLayout` and `deep` double today; all four are single afterwards.
        expect(maxLayoutDepth(setupLayouts(indexNoLayout(), LAYOUTS))).toBe(2)
        expect(maxLayoutDepth(setupLayouts(deep(), LAYOUTS))).toBe(2)

        for (const shape of [withIndex, indexNoLayout, deep, topLevel]) {
            expect(maxLayoutDepth(setupLayouts(normalize(shape(), monoExtendRoute()), LAYOUTS))).toBe(1)
        }
    })
})
