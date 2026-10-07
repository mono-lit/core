<script setup lang="ts">
/*
 * Section 6: syncing the Host and its remotes.
 *
 * Mirrors section 5 — the coloured panel is on the LEFT here and the title on
 * the right, so the two alternate down the page instead of repeating the same
 * arrangement twice.
 *
 * The `apps` array is the same one section 4 shows, and the same modules the
 * hero diagram draws, so all three sections describe one ecosystem.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/tabs'

/*
 * One tab per app in the ecosystem. The Host is the only config that aggregates
 * — every remote simply points back at that one Host, which is why the four
 * remote tabs are near-identical: name and type are all that differ.
 */
const tab = ref('host')

/* `mono-tabs` keys its items on `id`, not `value`. */
const tabItems = [
  { id: 'host', label: 'Host Module' },
  { id: 'one', label: 'Module One' },
  { id: 'two', label: 'Module Two' },
  { id: 'three', label: 'Module Three' },
  { id: 'group', label: 'Module Group' },
]

const HOST_CODE = `import { defineConfig, type MonoConfig } from '@mono-lit/utility/config'

import moduleOneConfig from '@module-one-root/mono.config'
// import moduleTwoConfig from '@module-two-root/mono.config'
import moduleThreeConfig from '@module-three-root/mono.config'
import moduleGroupConfig from '@module-group-root/mono.config'

export default defineConfig({
  name: 'host',
  type: 'nuxt',
  template: 'host',

  extends: [
    {
      config: (): MonoConfig => moduleOneConfig,
      ecosystems: ['components', 'composables'],
    },

    // module-two is cloned but not wired in — uncomment to switch it on.
    // (): MonoConfig => moduleTwoConfig,

    (): MonoConfig => moduleThreeConfig,
    (): MonoConfig => moduleGroupConfig,
  ],

  apps: [
    {
      name: 'module-one',
      url: 'https://github.com/company/module-one',
      type: 'vue',
    },
    {
      name: 'module-two',
      url: 'https://github.com/company/module-two',
      type: 'vue',
    },
    {
      name: 'module-three',
      url: 'https://github.com/company/module-three',
      type: 'nuxt',
    },
    {
      name: 'module-group',
      url: 'https://github.com/company/module-group',
      type: 'nuxt',
    },
  ],
})`

/** Every remote is the same file with a different name and type. */
const remote = (name: string, type: 'vue' | 'nuxt') =>
  `import { defineConfig, type MonoConfig } from '@mono-lit/utility/config'

import hostConfig from '@host-root/mono.config'

export default defineConfig({
  name: '${name}',
  type: '${type}',
  template: 'remote',

  // A remote points at ONE Host and takes its shell from it.
  extends: [
    (): MonoConfig => hostConfig,
  ],

  apps: [
    {
      name: 'host',
      url: 'https://github.com/company/host',
      type: 'nuxt',
    },
  ],
})`

const CODES: Record<string, string> = {
  host: HOST_CODE,
  one: remote('module-one', 'vue'),
  two: remote('module-two', 'vue'),
  three: remote('module-three', 'nuxt'),
  group: remote('module-group', 'nuxt'),
}

const code = computed(() => CODES[tab.value] ?? HOST_CODE)

/* Same shared shiki core as the sections above. */
const highlighted = shallowRef('')
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
  code,
  async (source) => {
    const highlighter = await getHighlighter()
    highlighted.value = highlighter.codeToHtml(source, {
      lang: 'typescript',
      theme: 'github-dark-dimmed',
    })
  },
  { immediate: true },
)
</script>

<template>
  <section class="mono-sync">
    <div class="mono-sync__inner">

      <!-- Title first -->
      <div class="mono-sync__head">
        <h2 class="mono-sync__title">
          Behind the config, the sync between apps happens.
        </h2>
        <p class="mono-sync__lede">
          You just need to configure it in one config. Declare each app once,
          run <code>pnpm mono:sync</code>, and every one of them lands in
          <code>.mono/apps/</code> — no git submodules to babysit.
        </p>
        <p class="mono-sync__lede">
          <code>apps</code> says what to clone; <code>extends</code> says what is
          switched on. Take a whole module, take only its
          <code>components</code>, or comment it out and it stays cloned but
          wired to nothing.
        </p>
      </div>

      <!-- The config, full width beneath it -->
      <!-- Not server-rendered: @mono-lit/helper ships the browser Lit build with no
           SSR dom-shim. DemoPreview.vue wraps every demo the same way. -->
      <div class="mono-sync__stage">
      <ClientOnly>
      <div class="mono-sync__panel">
        <mono-card bordered width="100%" class="mono-sync__card">
          <strong slot="title">mono.config.ts</strong>

          <div class="mono-sync__body">
            <mono-tabs
              :items.prop="tabItems"
              :model-value="tab"
              @change="tab = $event.detail.modelValue"
            />

            <div class="mono-code mono-code--example">
              <div v-if="highlighted" v-html="highlighted" />
              <pre v-else><code>{{ code }}</code></pre>
            </div>

          <!-- The other half of the story: declaring the apps does nothing on
               its own until sync pulls them down. -->
          <div class="mono-sync__run">
            <span class="mono-sync__run-label">Then run</span>
            <code class="mono-sync__cmd"><span aria-hidden="true">$</span> pnpm mono:sync</code>
          </div>
          </div>
        </mono-card>
      </div>
      </ClientOnly>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mono-sync {
  padding: 40px 24px 88px;
}
@media (min-width: 960px) {
  .mono-sync {
    padding: 48px 48px 120px;
  }
}

/* Stacked: the title reads first, the config runs full width beneath it. */
.mono-sync__inner {
  max-width: 1152px;
  margin: 0 auto;
}

.mono-sync__head {
  max-width: 46rem;
  margin: 0 0 40px;
}

/* `ClientOnly` renders nothing until mount (no fallback slot), so the stage
   reserves the height its contents take -- otherwise the section collapses in the
   server HTML and the page jumps as it hydrates. */
.mono-sync__stage {
  min-height: 620px;
}
@media (min-width: 900px) {
  .mono-sync__stage {
    min-height: 600px;
  }
}

.mono-sync__panel {
  /* Additive, and required before anything can be positioned inside: unlike the
     fetch panel this one was static. */
  position: relative;
  padding: 20px;
  border: 1px solid var(--cyber-edge);
  box-shadow:
    inset 0 1px 0 var(--cyber-inner-hi),
    0 0 44px -14px var(--cyber-glow);
  border-radius: 20px;
  background: var(--cyber-band);
}
@media (min-width: 900px) {
  .mono-sync__panel {
    padding: 26px;
  }
}

.mono-sync__title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.3rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}
.mono-sync__lede {
  margin: 14px 0 0;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
/* Tabs, code and the run line, stacked inside the card. */
.mono-sync__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.mono-sync__run {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}
.mono-sync__run-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}
/* Reads as a terminal line: same dark ground as the code pane above it. */
.mono-sync__cmd {
  padding: 7px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: #22272e;
  color: #adbac7;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
}
.mono-sync__cmd span {
  margin-right: 6px;
  color: #6e7681;
  user-select: none;
}

.mono-sync__lede code {
  padding: 0.15em 0.4em;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.86em;
}

/* Code pane. Scrolls rather than grows — the apps array runs past 30 lines. */
.mono-code {
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: #22272e;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
}
.mono-code--example {
  max-height: 380px;
}

/* `:deep()` — the highlighted markup arrives via v-html with no scope
   attribute; this also catches the plain <pre> fallback. */
.mono-code :deep(pre) {
  margin: 0;
  padding: 14px 16px;
  background: transparent !important;
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  line-height: 1.65;
  tab-size: 2;
}
.mono-code :deep(code) {
  font-family: inherit;
  white-space: pre;
}
.mono-code :deep(pre:not(.shiki)) {
  color: #adbac7;
}

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
