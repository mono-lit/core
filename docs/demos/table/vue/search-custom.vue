<!--
  searchValue entries that build their own filter clause.

  (`searchValue` is the option naming the searched fields. `searchExpr` is the
  same option under its older name — either spelling works, and so do the kebab
  forms `search-value` / `search-expr`.)

  A plain `searchValue` entry is a column name, and every column is searched the
  same way — contains(<col>,'<term>'). That is wrong for a column whose data isn't
  free text:

    Active  is a BOOLEAN     → contains(Active,'true') is not valid OData
    Month   is a CODE (0-11) → the user types "Jan", the data holds 0

  So an entry may be { field, custom } instead, and `custom` returns the clause to
  use for that column:

    custom returns                             remote        array/in-memory
    ─────────────────────────────────────────  ────────────  ───────────────
    [field, op, value]  (or a nested and/or)   used as-is    compiled to a predicate
    (row) => boolean                           skipped       used as the predicate
    "Active eq true"    (raw OData)            wrapped raw   skipped
    null / undefined / false                   skipped       skipped

  A custom column takes part in the plain search box like any other, so it runs on
  every term — RETURN NULL to opt out of one. That is what makes the Month entry
  work: "Jan" → 0, "zzz" → MONTHS.indexOf gives -1 → return null, and the column
  drops out of that query instead of matching nothing.

  Both branches are shown side by side because they are different code paths:
    · the LEFT grid is array-backed — the clause is compiled to a row predicate;
    · the RIGHT grid is bound to a stub source with a `store()`, so the controller
      takes the REMOTE path and hands it a devextreme filter array — printed below
      it verbatim as the $filter it would send. No network involved.

  An entry can also be a `*` PATTERN, resolved against the loaded rows so you need
  not list columns. Patterns read literally, segment by segment:

    '*'         every top-level field
    '*.*'       every field of a nested OBJECT   (Job.Title, Job.Level)
    '*.[*].*'   every field of a nested ARRAY    (Detail.[*].Bulan, Detail.[*].Ket)

  so `['*', '*.[*].*']` searches both levels. An explicitly named field ALWAYS wins
  over a pattern's expansion, in either order — that is how `Month` below keeps its
  custom even though `'*'` also covers it.

  On a REMOTE source a pattern only emits clauses for STRING columns:
  contains(Price,'x') is not valid OData and would reject the whole request. Give a
  non-text column an explicit entry, exactly like Active and Month here.

  Try: `true` · `false` · `Jan` · `Mar` · `zzz` · `AB` (a plain Code match)
       · `Tunai` (only reachable through the `'*.[*].*'` expand).
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable, type MonoGridSource } from '@mono-lit/helper'

type Row = {
  Id: number
  Code: string
  Nama: string
  Month: number
  Active: boolean
  /** A nested ARRAY expand — reached by the `'*.[*].*'` pattern. */
  Detail: Array<{ Ket: string; Metode: string }>
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ROWS: Row[] = [
  { Id: 1, Code: 'AB-01', Nama: 'Andi Wijaya', Month: 0, Active: true, Detail: [{ Ket: 'Lunas', Metode: 'Tunai' }] },
  { Id: 2, Code: 'AB-02', Nama: 'Sarah Putri', Month: 0, Active: false, Detail: [{ Ket: 'Cicilan', Metode: 'Transfer' }] },
  { Id: 3, Code: 'CD-11', Nama: 'Budi Santoso', Month: 2, Active: true, Detail: [{ Ket: 'Lunas', Metode: 'Transfer' }] },
  { Id: 4, Code: 'CD-12', Nama: 'Dewi Lestari', Month: 2, Active: false, Detail: [{ Ket: 'Batal', Metode: 'Kartu' }] },
  { Id: 5, Code: 'EF-21', Nama: 'Rizky Ramadhan', Month: 5, Active: true, Detail: [{ Ket: 'Lunas', Metode: 'Kartu' }] },
  { Id: 6, Code: 'EF-22', Nama: 'Maya Anggraini', Month: 8, Active: true, Detail: [{ Ket: 'Cicilan', Metode: 'Tunai' }] },
  { Id: 7, Code: 'GH-31', Nama: 'Fajar Nugroho', Month: 11, Active: false, Detail: [{ Ket: 'Lunas', Metode: 'Transfer' }] },
  { Id: 8, Code: 'GH-32', Nama: 'Intan Permata', Month: 11, Active: true, Detail: [{ Ket: 'Batal', Metode: 'Kartu' }] },
]

/**
 * The shared config.
 *
 * `'*'` covers every top-level field and `'*.[*].*'` every field of the `Detail`
 * expand — neither is listed by name. The two explicit entries then OVERRIDE what
 * `'*'` would have done for those columns:
 *
 * `Active` returns a RAW OData string, so it only applies to the remote grid —
 * the array grid warns once and skips it. `Month` returns a filter ARRAY, which
 * works on both, and is the form to prefer. Without them a remote `'*'` would just
 * skip both columns (neither is a string) and they'd never be searchable.
 */
const searchValue = [
  '*',
  '*.[*].*',
  {
    field: 'Active',
    custom: ({ field, value }: { field: string; value: string }) => {
      const v = value.trim().toLowerCase()
      // Only "true"/"false" mean anything here — anything else opts out.
      if (v !== 'true' && v !== 'false') return null
      return `${field} eq ${v}`
    },
  },
  {
    field: 'Month',
    custom: ({ field, value }: { field: string; value: string }) => {
      const index = MONTHS.findIndex((m) => m.toLowerCase() === value.trim().toLowerCase())
      // -1 = not a month name → this column has nothing to say about the term.
      return index < 0 ? null : [field, '=', index]
    },
  },
]

// ── Left: a plain array source ───────────────────────────────────────────────
const arrayTable = controlMonoTable<Row>(ROWS, { pageSize: 10, searchValue })
const arrayRows = ref<Row[]>([])
const term = ref('')

// ── Right: a stub REMOTE source ──────────────────────────────────────────────
// Only `store()` returning something matters: that is what makes the controller
// treat it as remote and build a devextreme filter array instead of a predicate.
const sentFilter = ref<unknown>(null)

function stubRemote(rows: Row[]): MonoGridSource<Row> {
  const handlers: Record<string, Array<(...args: any[]) => void>> = {}
  let filter: unknown = null
  return {
    on: (event: string, handler: (...args: any[]) => void) =>
      void (handlers[event] ??= []).push(handler),
    off: (event: string, handler: (...args: any[]) => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler)
    },
    items: () => rows,
    isLoading: () => false,
    totalCount: () => rows.length,
    isLastPage: () => true,
    paginate: () => false,
    pageSize: () => rows.length,
    pageIndex: () => 0,
    searchValue: () => null,
    searchExpr: () => undefined,
    searchOperation: () => 'contains',
    filter: (value?: unknown) => {
      if (value === undefined) return filter
      filter = value ?? null
      sentFilter.value = filter
      return filter
    },
    sort: () => [],
    load: async () => rows,
    reload: async () => rows,
    store: () => ({ load: async () => rows }),
  } as unknown as MonoGridSource<Row>
}

const remoteTable = controlMonoTable<Row>(null, { searchValue })
remoteTable.bind(stubRemote(ROWS))
void remoteTable.load()

// `<mono-table-search>` drives its own bound controller, so mirror its terms onto
// the remote one rather than duplicating the search box. `lastTerms` keeps the
// mirror from re-issuing the same query on every unrelated notify.
let lastTerms = ''
const offArray = arrayTable.subscribe(() => {
  arrayRows.value = [...arrayTable.items]
  term.value = arrayTable.searchTerms.map((t) => t.value).join(' ')
  const key = JSON.stringify(arrayTable.searchTerms)
  if (key === lastTerms) return
  lastTerms = key
  void remoteTable.setSearchTerms([...arrayTable.searchTerms])
})
void arrayTable.load()

/** Render the devextreme filter array the way the endpoint would receive it. */
function toOData(expr: unknown): string {
  if (expr == null) return '(no filter)'
  if (typeof expr === 'string') return expr
  if (!Array.isArray(expr)) return String(expr)
  // A one-member array is the raw-passthrough clause; a triple is a comparison.
  if (expr.length === 1 && typeof expr[0] === 'string') return expr[0]
  if (expr.length === 3 && typeof expr[0] === 'string' && typeof expr[1] === 'string') {
    const [field, op, value] = expr as [string, string, unknown]
    const lit = typeof value === 'number' || typeof value === 'boolean' ? String(value) : `'${value}'`
    return op === 'contains' || op === 'startswith' || op === 'endswith'
      ? `${op}(${field},${lit})`
      : `${field} ${op === '=' ? 'eq' : op} ${lit}`
  }
  const parts = expr.map((m) => (typeof m === 'string' ? m : `(${toOData(m)})`))
  return parts.join(' ')
}

const odata = computed(() =>
  sentFilter.value == null ? '(no filter)' : `$filter=${toOData(sentFilter.value)}`,
)

onBeforeUnmount(() => {
  offArray()
  arrayTable.dispose()
  remoteTable.dispose()
})
</script>

<template>
  <div class="example-grid">
    <mono-card bordered width="100%" class="example-card">
      <div class="example-head">
        <strong>Array source</strong>
        <mono-chip size="xs" color="neutral" variant="soft">predicate</mono-chip>
      </div>

      <div class="example-toolbar">
        <mono-table-search
          :control-table.prop="arrayTable"
          placeholder="true · Jan · AB · Tunai · zzz"
        />
      </div>

      <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Month</th>
            <th>Active</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in arrayRows" :key="row.Id">
            <td>{{ row.Code }}</td>
            <td>{{ row.Nama }}</td>
            <td>{{ MONTHS[row.Month] }}</td>
            <td>
              <mono-chip size="xs" :color="row.Active ? 'success' : 'neutral'" variant="soft">
                {{ row.Active }}
              </mono-chip>
            </td>
            <td class="example-detail">{{ row.Detail.map((d) => `${d.Ket} / ${d.Metode}`).join(', ') }}</td>
          </tr>
          <tr v-if="!arrayRows.length">
            <td colspan="5" class="example-empty">No rows match “{{ term }}”.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </mono-card>

    <mono-card bordered width="100%" class="example-card">
      <div class="example-head">
        <strong>Remote source (stub)</strong>
        <mono-chip size="xs" color="primary" variant="soft">$filter</mono-chip>
      </div>

      <div class="example-toolbar">
        <span class="example-hint">Driven by the same box — this is the real filter the controller sent.</span>
      </div>

      <pre class="example-odata">{{ odata }}</pre>
    </mono-card>
  </div>
</template>

<style scoped>
.example-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
}

@media (min-width: 900px) {
  .example-grid {
    grid-template-columns: 1.35fr 1fr;
    align-items: start;
  }
}

.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.72rem 1rem 0;
}

.example-toolbar {
  padding: 0.72rem 1rem;
}

.example-hint {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.example-detail {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.example-empty {
  text-align: center;
  color: var(--muted-foreground);
}

.example-odata {
  margin: 0;
  padding: 0.9rem 1rem 1.2rem;
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
