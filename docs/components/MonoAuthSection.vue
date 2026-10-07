<script setup lang="ts">
/*
 * Section 4: cookies and JWT, declared once in mono.config.ts.
 *
 * Left card carries the tabs and the read-it-back snippet, right card shows the
 * config those tabs select. The tabs are `<mono-tabs>` and both cards are
 * `<mono-card>` — the page keeps being built from the library it documents.
 *
 * The `apps` array in both samples lists the same repos as the hero diagram, so
 * a reader can see the modules from section 1 turning up in a real config.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/tabs'

const tab = ref('cookie')

const tabItems = [
  { id: 'cookie', label: 'Cookie' },
  { id: 'jwt', label: 'JWT' },
]


const COOKIE_CODE = `// mono.config.ts — github.com/company/host
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
  name: 'host',
  type: 'nuxt',
  template: 'host',

  // Declared ONCE, here. Every module below reads the same
  // value — nothing to wire up per app.
  cookie: [
    { name: 'myCookie' },
  ]

})`

const JWT_CODE = `// mono.config.ts — github.com/company/host
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
  name: 'host',
  type: 'nuxt',
  template: 'host',
  // A JWT is always paired with the cookie it travels in.
  // Declare the cookie first...
  cookie: [
    { name: 'myToken' },
  ],
  // ...then decode that same name here. The key hydrates
  // into monoState().jwt.<key>.
  jwt: {
    token: { name: 'myToken' },
  }
})`

const USE_COOKIE = `import { monoState } from '@mono-lit/utility/state'

// In the Host, or in any module it federates.
const { cookie } = monoState()

cookie.myCookie`

const USE_JWT = `import { monoState } from '@mono-lit/utility/state'

const { jwt } = monoState()

jwt.token.USER_NAME   // typed claims, already decoded`

const isCookie = computed(() => tab.value === 'cookie')
const code = computed(() => (isCookie.value ? COOKIE_CODE : JWT_CODE))
const usage = computed(() => (isCookie.value ? USE_COOKIE : USE_JWT))

/*
 * Syntax colouring, using the same shiki core the OData demo already pulls in —
 * one highlighter, created lazily and shared, so switching tabs costs a
 * re-tokenise rather than a fresh WASM-free engine.
 *
 * It resolves asynchronously and therefore renders nothing during SSR, so the
 * template keeps a plain <pre> fallback: the static HTML ships readable code and
 * hydration swaps in the coloured version. Both are empty-string-equal at
 * hydration time, so there is no mismatch.
 */
const highlightedCode = shallowRef('')
const highlightedUsage = shallowRef('')
let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    themes: [import('shiki/themes/github-dark-dimmed.mjs')],
    langs: [import('shiki/langs/typescript.mjs')],
    engine: createJavaScriptRegexEngine(),
  })

  return highlighterPromise
}

watch(
  [code, usage],
  async ([nextCode, nextUsage]) => {
    const highlighter = await getHighlighter()
    const opts = { lang: 'typescript', theme: 'github-dark-dimmed' } as const

    highlightedCode.value = highlighter.codeToHtml(nextCode, opts)
    highlightedUsage.value = highlighter.codeToHtml(nextUsage, opts)
  },
  { immediate: true },
)
</script>

<template>
  <section class="mono-auth">
    <div class="mono-auth__inner">
      <header class="mono-auth__head">
        <h2 class="mono-auth__title">
          Need Cookie and JWT across your ecosystem?
        </h2>
        <p class="mono-auth__lede">
          We cover it — define it inside our <code>mono.config.ts</code>, used
          anywhere across your ecosystem.
        </p>
      </header>

      <!-- Not server-rendered: @mono-lit/helper ships the browser Lit build with no
           SSR dom-shim. DemoPreview.vue wraps every demo the same way. -->
      <div class="mono-auth__stage">
      <ClientOnly>
      <div class="mono-auth__grid">
        <!-- 1 · the picker and what it means -->
        <mono-card bordered width="100%" height="100%" class="mono-auth__card">
          <strong slot="title">Pick one</strong>

          <div class="mono-auth__body">
            <mono-tabs
              :items.prop="tabItems"
              :model-value="tab"
              @change="tab = $event.detail.modelValue"
            />

            <p class="mono-auth__copy">
              <template v-if="isCookie">
                A <strong>cookie</strong> entry hands you the raw value. Declare
                the name once and every app in the ecosystem reads the same
                cookie, with no per-app plumbing.
              </template>
              <template v-else>
                A <strong>JWT</strong> entry is paired with a cookie: declare the
                cookie, then decode the same name here and read claims instead of
                a string. Any key you like, not just <code>token</code>.
              </template>
            </p>

            <div class="mono-auth__snippet">
              <span class="mono-auth__snippet-label">Read it anywhere</span>
              <div class="mono-code mono-code--sm">
                <div v-if="highlightedUsage" v-html="highlightedUsage" />
                <pre v-else><code>{{ usage }}</code></pre>
              </div>
            </div>
          </div>
        </mono-card>

        <!-- 2 · the config the tab selects -->
        <mono-card bordered width="100%" height="100%" class="mono-auth__card">
          <strong slot="title">mono.config.ts</strong>
          <div class="mono-code mono-code--tall">
            <div v-if="highlightedCode" v-html="highlightedCode" />
            <pre v-else><code>{{ code }}</code></pre>
          </div>
        </mono-card>
      </div>
      </ClientOnly>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mono-auth {
  padding: 72px 24px 96px;
}
@media (min-width: 960px) {
  .mono-auth {
    padding: 104px 48px 128px;
  }
}

.mono-auth__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.mono-auth__head {
  max-width: 46rem;
  margin: 0 0 40px;
}
.mono-auth__title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.3rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}
.mono-auth__lede {
  margin: 14px 0 0;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.mono-auth__lede code {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.9em;
}

/* Left narrower than right: the config is the thing worth reading, the picker
   only has to be reachable. */
.mono-auth__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 20px;
}
@media (min-width: 860px) {
  .mono-auth__grid {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  }
}
.mono-auth__grid > mono-card {
  height: 100%;
}

/* `ClientOnly` renders nothing until mount (no fallback slot), so the stage
   reserves the height its contents take -- otherwise the section collapses in the
   server HTML and the page jumps as it hydrates. */
.mono-auth__stage {
  min-height: 520px;
}
@media (min-width: 900px) {
  .mono-auth__stage {
    min-height: 460px;
  }
}

.mono-auth__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}
.mono-auth__copy {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.mono-auth__copy code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.88em;
}

.mono-auth__snippet {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.mono-auth__snippet-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

/*
 * Code panes. The pane scrolls in BOTH directions rather than growing: the full
 * config runs past 40 lines, and letting it set the card height made the whole
 * section absurdly tall. Capping it here keeps the two cards a sane size and
 * puts the overflow behind a scrollbar instead.
 *
 * `#22272e` matches shiki's github-dark-dimmed background, so the container and
 * the highlighted <pre> it wraps agree on their backdrop in both site themes.
 */
.mono-code {
  overflow: auto;
  border: 1px solid var(--cyber-edge);
  border-radius: 10px;
  background: #22272e;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
}
.mono-code--tall {
  max-height: 360px;
}
.mono-code--sm {
  max-height: 180px;
}

/* `:deep()` because the highlighted markup arrives through v-html and carries
   no scope attribute — it also happens to catch the plain <pre> fallback. */
.mono-code :deep(pre) {
  margin: 0;
  padding: 14px 16px;
  background: transparent !important;
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  line-height: 1.65;
  tab-size: 2;
}
.mono-code--sm :deep(pre) {
  font-size: 0.74rem;
}
.mono-code :deep(code) {
  font-family: inherit;
  white-space: pre;
}
/* The fallback <pre> ships before shiki loads, so it needs its own colour. */
.mono-code :deep(pre:not(.shiki)) {
  color: #adbac7;
}

/* A visible scrollbar, on purpose — the pane is scrollable and should look it. */
.mono-code::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.mono-code::-webkit-scrollbar-track {
  background: transparent;
}
.mono-code::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.26);
  background-clip: content-box;
}
.mono-code::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
  background-clip: content-box;
}
</style>
