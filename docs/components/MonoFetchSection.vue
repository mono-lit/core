<script setup lang="ts">
/*
 * Section 5: data fetching, REST and OData, running for real.
 *
 * Title sits on the left, the demo on the right: tabs, the code, a run button,
 * then the JSON that call actually returned. Nothing here is canned — pressing
 * Run performs the request shown directly above it, so the response underneath
 * is the real one.
 *
 * Both endpoints are public and send `Access-Control-Allow-Origin: *`, which is
 * why they can be called straight from the page.
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { monoFetch, monoFetchOdata } from '@mono-lit/utility/fetching'

import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/tabs'

const tab = ref('rest')

/* `mono-tabs` keys its items on `id`, not `value`. */
const tabItems = [
  { id: 'rest', label: 'monoFetch' },
  { id: 'odata', label: 'monoFetchOdata' },
]

const UTAITE_BASE = 'https://utaitedb.net'
const TRIPPIN_BASE =
  'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))'

/*
 * The query goes straight in the path. `monoFetch`'s options are
 * `RequestInit & { token, baseUrl, unauthCall, notif, … }` — there is no
 * `params` key on the real network path, so an object handed in that way would
 * be silently dropped. (The mock backend DOES read `opt.params`, which is worth
 * knowing but is not what runs here.)
 */
const REST_QUERY =
  '/api/artists?query=Ado&artistTypes=Utaite&fields=WebLinks,Tags,AdditionalNames&maxResults=1'

const REST_CODE = `import { monoFetch } from '@mono-lit/utility/fetching'

const baseUrl = '${UTAITE_BASE}'

const response = await monoFetch(
  '${REST_QUERY}',
  { baseUrl, method: 'GET' },
)`

const ODATA_CODE = `import { monoFetchOdata } from '@mono-lit/utility/fetching'

// Same call shape as monoFetch, plus \`options\` to shape
// the OData query: $select, $orderby, $top all come from here.
const response = await monoFetchOdata({
  baseUrl: '${TRIPPIN_BASE}',
  url: '/People',
  method: 'GET',
  type: 'data',
  options: {
    key: 'UserName',
    select: ['UserName', 'FirstName', 'LastName'],
    sort: [{ selector: 'LastName' }],
    pageSize: 3,
  },
})`

const isRest = computed(() => tab.value === 'rest')
const code = computed(() => (isRest.value ? REST_CODE : ODATA_CODE))

/* ── running the thing ───────────────────────────────────────────────────── */

const loading = ref(false)
const result = shallowRef<unknown>(null)
const failed = ref('')
const ranMs = ref(0)

/*
 * The response is NOT safe to hand straight to JSON.stringify.
 *
 * `monoFetchOdata` returns the rows alongside a DevExtreme `dataSource`, and a
 * DataSource holds a reference back to its own store — stringifying it throws
 * `TypeError: cyclic object value`. `monoFetch` has the same hazard in `all`,
 * which carries the raw response.
 *
 * So: keep only the fields worth reading, and stringify through a replacer that
 * cannot throw whatever shape turns up later.
 */
function presentable(res: unknown) {
  if (!res || typeof res !== 'object') return res

  const { statusCode, message, error, data, all } = res as Record<string, unknown>

  // Not one of the known envelopes — show it as-is and let the replacer cope.
  if (statusCode === undefined && data === undefined && all === undefined) {
    return res
  }

  /*
   * `monoFetch` expects the backend to answer in an ENVELOPE: `fetchNormal`
   * returns `data: body.data` and keeps the whole parsed body in `all`.
   *
   * utaitedb answers with a bare `{ items, term, totalCount }` and no `data`
   * key, so `data` is undefined and the response only exists in `all`. Falling
   * back to it is what makes a non-enveloped API show anything at all —
   * without this the pane rendered `{ "statusCode": 200 }` and nothing else,
   * because JSON.stringify drops undefined values.
   */
  const body = data ?? all

  return {
    ...(statusCode !== undefined && { statusCode }),
    ...(message !== undefined && message !== null && { message }),
    ...(error !== undefined && error !== null && { error }),
    data: body,
  }
}

function safeStringify(value: unknown) {
  const seen = new WeakSet<object>()

  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'function') return undefined
      if (val && typeof val === 'object') {
        if (seen.has(val as object)) return '[Circular]'
        seen.add(val as object)
      }
      return val
    },
    2,
  )
}

/** Whatever came back, trimmed to the useful part and pretty-printed. */
const resultJson = computed(() =>
  result.value === null ? '' : safeStringify(presentable(result.value)),
)

async function run() {
  loading.value = true
  failed.value = ''
  result.value = null

  const startedAt = performance.now()

  try {
    if (isRest.value) {
      result.value = await monoFetch(REST_QUERY, {
        baseUrl: UTAITE_BASE,
        method: 'GET',
      })
    } else {
      result.value = await monoFetchOdata({
        baseUrl: TRIPPIN_BASE,
        url: '/People',
        method: 'GET',
        type: 'data',
        // The docs site has no notification host to report into.
        notif: false,
        /*
         * DevExtreme's ODataStore defaults to OData v2, so when the paginating
         * DataSource wants a total count it sends `$inlinecount=allpages`.
         * TripPin is a v4 service; it happens to IGNORE that unknown option and
         * answer 200 anyway, but a stricter v4 backend returns 400 for it
         * (Northwind does). Version 4 sends `$count=true` instead, which is
         * correct for v4 either way, so this stays.
         */
        override: {
          dataSource: { version: 4 },
        },
        options: {
          key: 'UserName',
          select: ['UserName', 'FirstName', 'LastName'],
          sort: [{ selector: 'LastName' }],
          pageSize: 3,
        },
      } as never)
    }
  } catch (err) {
    failed.value = err instanceof Error ? err.message : String(err)
  } finally {
    ranMs.value = Math.round(performance.now() - startedAt)
    loading.value = false
  }
}

/* Clear the previous tab's response — showing a TripPin payload under the
   monoFetch snippet would be worse than showing nothing. */
watch(tab, () => {
  result.value = null
  failed.value = ''
  ranMs.value = 0
})

/* ── colouring, same shared shiki core as section 4 ──────────────────────── */

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
  <section class="mono-fetch">
    <div class="mono-fetch__inner">
      <!-- Left: the pitch -->
      <div class="mono-fetch__intro">
        <h2 class="mono-fetch__title">
          What else? Data fetching, even with OData fetching.
        </h2>
        <p class="mono-fetch__lede">
          One fetcher for plain REST, one for OData — same call shape, same
          config, same auth. Press Run: these hit live public APIs from this
          page.
        </p>
      </div>

      <!-- Right: code, run, result, on the purple panel -->
      <!-- Not server-rendered: @mono-lit/helper ships the browser Lit build with no
           SSR dom-shim. DemoPreview.vue wraps every demo the same way. -->
      <div class="mono-fetch__stage">
      <ClientOnly>
      <div class="mono-fetch__panel">
      <mono-card bordered width="100%" class="mono-fetch__card">
        <mono-tabs
          slot="title"
          :items.prop="tabItems"
          :model-value="tab"
          @change="tab = $event.detail.modelValue"
        />

        <div class="mono-fetch__body">
          <div class="mono-code mono-code--example">
            <div v-if="highlighted" v-html="highlighted" />
            <pre v-else><code>{{ code }}</code></pre>
          </div>

          <div class="mono-fetch__actions">
            <mono-button
              color="primary"
              size="sm"
              :loading.prop="loading"
              @click="run()"
            >
              Run
            </mono-button>

            <span v-if="ranMs && !failed" class="mono-fetch__meta">
              {{ ranMs }}ms
            </span>
            <span v-else-if="failed" class="mono-fetch__meta is-bad">
              {{ failed }}
            </span>
            <span v-else class="mono-fetch__meta">
              Runs the request above, live.
            </span>
          </div>

          <div class="mono-code mono-code--result">
            <pre><code>{{ resultJson || '// press Run to see the response' }}</code></pre>
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
.mono-fetch {
  position: relative;
  padding: 72px 24px 40px;
  /*
   * Contains the panel's right-edge bleed so it cannot add a horizontal
   * scrollbar to the page. `clip` rather than `hidden` so this never becomes a
   * scroll container — nothing here depends on that today, but `hidden` is what
   * breaks `position: sticky` and anchor scrolling inside a section later on.
   */
  overflow-x: clip;
}
@media (min-width: 960px) {
  .mono-fetch {
    padding: 104px 48px 48px;
  }
}

/* Title left, demo right. The title column is the narrower of the two — it is
   one sentence, the demo is the substance. */
.mono-fetch__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 32px;
  max-width: 1152px;
  margin: 0 auto;
}
@media (min-width: 900px) {
  .mono-fetch__inner {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 48px;
  }
}

.mono-fetch__title {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.3rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}
.mono-fetch__lede {
  margin: 14px 0 0;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/*
 * The UI section's gradient, but only behind the demo — the title column stays
 * on the page ground.
 *
 * Contained on purpose: no viewport bleed this time, so there is nothing to
 * clip, and the sticky title needs no `overflow` guard on the section (which
 * would have to be `clip` rather than `hidden` to avoid killing the sticky).
 */
.mono-fetch__panel {
  position: relative;
  border: 1px solid var(--cyber-edge);
  padding: 20px;
  border-radius: 20px;
  background: var(--cyber-band);
}
@media (min-width: 900px) {
  .mono-fetch__panel {
    /* Fills the row rather than only its own content, so the colour covers the
       whole right side even if the title column ever grows taller. */
    align-self: stretch;
    padding: 26px;
    /* Square on the right: that edge runs off the page rather than ending. */
    border-radius: 20px 0 0 20px;
    /* And unlit on the right, for the same reason. The rim is what makes the
       panel read as a lit object, but below this breakpoint there is nothing
       past its right edge — from 900px up the ::after bleed carries the colour
       on to the viewport, so a border there would draw a bright seam straight
       down the middle of one continuous surface. */
    border-right-color: transparent;
  }
  /* Carries the colour from the container edge to the edge of the viewport, so
     the right side reads as section ground rather than a floating box. Clipped
     by `overflow-x: clip` on the section above. */
  .mono-fetch__panel::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 100%;
    width: 100vw;
    pointer-events: none;
    background: var(--cyber-band-end);
  }
}

/* `ClientOnly` renders nothing until mount (no fallback slot), so the stage
   reserves the height its contents take -- otherwise the section collapses in the
   server HTML and the page jumps as it hydrates. */
.mono-fetch__stage {
  min-height: 640px;
}
@media (min-width: 900px) {
  .mono-fetch__stage {
    min-height: 600px;
  }
}

.mono-fetch__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.mono-fetch__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.mono-fetch__meta {
  font-family: var(--vp-font-family-mono);
  font-size: 0.76rem;
  color: var(--vp-c-text-3);
}
.mono-fetch__meta.is-bad {
  color: #ef4444;
}

/* Code and result panes. Both scroll rather than grow — the utaitedb payload
   alone is a few hundred lines, and left uncapped it would run the section off
   the screen. */
.mono-code {
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: #22272e;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
}
.mono-code--example {
  max-height: 300px;
}
.mono-code--result {
  max-height: 260px;
}

/* `:deep()` — the highlighted markup arrives via v-html and carries no scope
   attribute; this also catches the plain <pre> fallback and the result pane. */
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
