<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { monoFetchOdata } from '@mono-lit/utility/fetching'
import '@mono-lit/helper/ui/tabs'

/**
 * The public OData v4 sample service. Set inline on every call below.
 *
 * The `(S(…))` segment is a session id, and it is load-bearing: the bare
 * `/TripPinRESTierService` root answers with a 302 to a generated session URL,
 * and that 302 carries no `Access-Control-Allow-Origin`. A browser validates
 * CORS on every hop of a redirect chain, so the request is blocked before the
 * redirect is followed. Addressing a session URL directly returns 200 with
 * `Access-Control-Allow-Origin: *` and no redirect. Any id works — the service
 * creates the session on first use.
 */
const BASE_URL
  = 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))'

type FetchResult = {
  data: unknown
  statusCode: number
  error: { message: string } | null
}

type Example = {
  id: string
  label: string
  /** One line: what this option does. */
  summary: string
  /**
   * The literal argument object handed to `monoFetchOdata`. This is the single
   * source of truth — it is both executed and serialised back into the code
   * pane, so what the reader sees is exactly what runs.
   */
  args: Record<string, unknown>
  /** Optional prose shown under the code. Kept out of the snippet so it can never drift. */
  note?: string
}

const examples: Example[] = [
  {
    id: 'select',
    label: '$select',
    summary: 'Return only the listed fields instead of the whole entity.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      options: {
        key: 'UserName',
        select: ['UserName', 'FirstName', 'LastName'],
        pageSize: 5,
      },
    },
    note:
      'options.select becomes $select. Paging goes through options.pageSize, not take — '
      + 'DevExtreme pages the DataSource itself and defaults to pageSize 20, so a stray '
      + 'take is ignored and you get $top=20.',
  },
  {
    id: 'expand',
    label: '$expand',
    summary: 'Inline a related entity (a navigation property) in the same response.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      options: {
        key: 'UserName',
        select: ['UserName', 'FirstName'],
        expand: ['Trips'],
        pageSize: 2,
      },
    },
    note:
      'options.expand only takes plain navigation names. For inner options — '
      + "$expand=Trips($select=Name;$top=1) — use the raw channel instead: "
      + "params: { $expand: 'Trips($select=Name,Budget;$top=1)' }.",
  },
  {
    id: 'filter',
    label: '$filter',
    summary: 'Keep only the rows matching a boolean expression.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      options: {
        key: 'UserName',
        select: ['UserName', 'FirstName', 'Gender'],
        filter: [['Gender', '=', 'Female'], 'and', ['FirstName', 'contains', 'A']],
      },
    },
    note:
      "The DevExtreme filter array becomes $filter=Gender eq 'Female' and contains(FirstName,'A').",
  },
  {
    id: 'orderby',
    label: '$orderby',
    summary: 'Sort the result. Each entry may be ascending or descending.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      options: {
        key: 'UserName',
        select: ['UserName', 'LastName'],
        sort: [{ selector: 'LastName', desc: true }],
        pageSize: 5,
      },
    },
    note: 'options.sort becomes $orderby=LastName desc.',
  },
  {
    id: 'top-skip',
    label: '$top / $skip',
    summary: 'Page through the result: page size sets $top, page index sets $skip.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      options: {
        key: 'UserName',
        select: ['UserName'],
        pageSize: 3,
        pageIndex: 1,
      },
    },
    note:
      'pageSize 3 becomes $top=3; pageIndex 1 becomes $skip=3 — the offset is '
      + 'pageIndex * pageSize, so this is the second page.',
  },
  {
    id: 'count',
    label: '$count',
    summary: 'Ask the server for the total row count alongside the page.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      options: {
        key: 'UserName',
        select: ['UserName'],
        pageSize: 2,
        requireTotalCount: true,
      },
    },
    note: 'options.requireTotalCount becomes $count=true.',
  },
  {
    id: 'search',
    label: '$search',
    summary: 'Free-text search across the entity, as defined by the service.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      params: { $search: 'Boise' },
      options: { key: 'UserName' },
    },
    note: '$search has no DevExtreme equivalent, so it goes through the raw params channel.',
  },
  {
    id: 'apply',
    label: '$apply',
    summary: 'Group and aggregate on the server — the roll-up runs in the database.',
    args: {
      baseUrl: BASE_URL,
      url: '/People',
      type: 'data',
      notif: false,
      params: { $apply: 'groupby((Gender),aggregate($count as Total))' },
      options: { key: 'UserName', paginate: false },
    },
    note:
      '$apply is raw-only. paginate: false matters — without it DevExtreme attaches a '
      + 'default $top=20 that silently truncates the aggregation buckets.',
  },
]

const tabs = examples.map((e) => ({ id: e.id, label: e.label }))
const active = ref(examples[0].id)
const current = computed(() => examples.find((e) => e.id === active.value) ?? examples[0])

/* ------------------------------------------------- args -> displayed source */

/** Serialise a plain value back to the TypeScript literal a reader would write. */
function toSource(value: unknown, depth = 0): string {
  const pad = '  '.repeat(depth)
  const padIn = '  '.repeat(depth + 1)

  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  if (value === null || typeof value !== 'object') return String(value)

  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    const parts = value.map((item) => toSource(item, depth + 1))
    const inline = `[${parts.join(', ')}]`
    if (inline.length <= 72 && !inline.includes('\n')) return inline
    return `[\n${parts.map((p) => padIn + p).join(',\n')}\n${pad}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return '{}'

  const parts = entries.map(([key, val]) => {
    // `$apply` / `$search` are valid identifiers, so no quoting is needed.
    const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`
    return `${padIn}${safeKey}: ${toSource(val, depth + 1)}`
  })

  const inline = `{ ${entries
    .map(([k, v]) => `${k}: ${toSource(v, depth + 1)}`)
    .join(', ')} }`
  if (inline.length <= 72 && !inline.includes('\n')) return inline

  return `{\n${parts.join(',\n')}\n${pad}}`
}

const code = computed(
  () => `import { monoFetchOdata } from '@mono-lit/utility/fetching'

const { data } = await monoFetchOdata(${toSource(current.value.args)})`,
)

/* ------------------------------------------------------------------ running */

const running = ref(false)
const result = shallowRef<FetchResult | null>(null)
const requestUrl = ref('')

/** Read back the URL the browser actually sent, so the panel can't misreport it. */
function lastOdataRequest(since: number): string {
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceEntry[]
    const match = entries
      .filter((e) => e.startTime >= since && e.name.includes('services.odata.org'))
      .pop()
    return match ? decodeURIComponent(match.name) : ''
  } catch {
    return ''
  }
}

async function run() {
  running.value = true
  result.value = null
  requestUrl.value = ''

  const startedAt = performance.now()

  try {
    result.value = (await monoFetchOdata(current.value.args as never)) as FetchResult
  } catch (err) {
    result.value = {
      data: null,
      statusCode: 0,
      error: { message: err instanceof Error ? err.message : String(err) },
    }
  } finally {
    requestUrl.value = lastOdataRequest(startedAt)
    running.value = false
  }
}

/** Switching tabs swaps the code and clears the previous response. */
watch(active, () => {
  result.value = null
  requestUrl.value = ''
})

const output = computed(() => {
  const res = result.value
  if (!res) return ''
  if (res.error) return res.error.message

  const text = JSON.stringify(res.data, null, 2)
  return text.length > 6000 ? `${text.slice(0, 6000)}\n… truncated` : text
})

/* -------------------------------------------------------------- highlighting */

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
  <div class="odata-demo">
    <mono-tabs
      class="odata-demo__tabs"
      :items.prop="tabs"
      :model-value="active"
      @change="active = $event.detail.modelValue"
    ></mono-tabs>

    <p class="odata-demo__summary">{{ current.summary }}</p>

    <div class="odata-demo__code" v-html="highlighted" />

    <p v-if="current.note" class="odata-demo__note">{{ current.note }}</p>

    <div class="odata-demo__actions">
      <button class="odata-demo__run" :disabled="running" @click="run">
        {{ running ? 'Running…' : 'Run against TripPin' }}
      </button>
      <span v-if="result" class="odata-demo__status" :class="{ 'is-error': result.error }">
        {{ result.error ? 'error' : `${result.statusCode} OK` }}
      </span>
    </div>

    <div v-if="requestUrl" class="odata-demo__request">
      <span class="odata-demo__method">GET</span>
      <code>{{ requestUrl }}</code>
    </div>

    <pre v-if="output" class="odata-demo__output">{{ output }}</pre>
  </div>
</template>

<style scoped>
.odata-demo {
  margin: 1.25rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.odata-demo__tabs {
  display: block;
  padding: 0.35rem 0.75rem 0;
}

.odata-demo__summary {
  margin: 0.75rem 1rem;
  font-size: 0.86rem;
  color: var(--vp-c-text-2);
}

.odata-demo__code :deep(pre) {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.6;
  border-radius: 0;
}

.odata-demo__note {
  margin: 0.75rem 1rem 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
  border-left: 2px solid var(--vp-c-divider);
  padding-left: 0.6rem;
}

.odata-demo__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
}

.odata-demo__run {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 7px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.odata-demo__run:disabled {
  opacity: 0.6;
  cursor: default;
}

.odata-demo__status {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-green-1);
}

.odata-demo__status.is-error {
  color: var(--vp-c-red-1);
}

.odata-demo__request {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1rem 0.85rem;
  padding: 0.45rem 0.6rem;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
  overflow-x: auto;
}

.odata-demo__request code {
  font-size: 0.76rem;
  white-space: nowrap;
  background: none;
  padding: 0;
}

.odata-demo__method {
  flex: none;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.odata-demo__output {
  margin: 0;
  padding: 1rem;
  max-height: 320px;
  overflow: auto;
  font-size: 0.76rem;
  line-height: 1.55;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
</style>
