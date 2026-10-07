<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/textarea'
import { controlMonoTable } from '@mono-lit/helper'
import type { MonoImportResult } from '@mono-lit/helper'

type BudgetRow = {
  Id: number
  Channel: string
  Brand: string
  Activity: string
  Jan: number
  Feb: number
  Mar: number
}

const seed = (): BudgetRow[] => [
  { Id: 1, Channel: 'SHOPEE', Brand: 'HANASUI', Activity: 'CAMPAIGN', Jan: 12500000, Feb: 8400000, Mar: 9100000 },
  { Id: 2, Channel: 'SHOPEE', Brand: 'HANASUI', Activity: 'ENDORSE', Jan: 5300000, Feb: 0, Mar: 2750000 },
  { Id: 3, Channel: 'TOKPED', Brand: 'MARINA', Activity: 'CAMPAIGN', Jan: 7750000, Feb: 6200000, Mar: 4300000 },
  { Id: 4, Channel: 'TOKPED', Brand: 'MARINA', Activity: 'ENDORSE', Jan: 3100000, Feb: 1900000, Mar: 2200000 },
  { Id: 5, Channel: 'TIKTOK', Brand: 'NUFACE', Activity: 'CAMPAIGN', Jan: 9800000, Feb: 4500000, Mar: 6600000 },
]

const MONTHS = ['Jan', 'Feb', 'Mar'] as const

// The composite key. Any subset that uniquely identifies a row will do, so a
// sheet with a blank Channel still matches on Brand + Activity.
const match = [
  { excel: 'CH.', field: 'Channel' },
  { excel: 'Brand', field: 'Brand' },
  { excel: 'Activity', field: 'Activity' },
]

// Only the month columns may be written — the key columns stay read-only.
const columns = MONTHS.map((m) => ({
  excel: m.toUpperCase(),
  field: m,
  type: 'number' as const,
}))

const table = controlMonoTable<BudgetRow>(seed(), { keyExpr: 'Id', pageSize: 10 })

const rows = ref<BudgetRow[]>([])
const pending = ref(0)
// One flag per operation. Sharing a single `busy` made the Save button spin
// while an *import* was running — and stay spinning if that import never
// settled, which reads as "Save is stuck loading".
const importing = ref(false)
const exporting = ref(false)
const saving = ref(false)
// `shallowRef`: the result holds references to the live table rows, and deep
// reactivity would wrap those in proxies.
const result = shallowRef<MonoImportResult<BudgetRow> | null>(null)
const notice = ref('')

const off = table.subscribe(() => {
  rows.value = [...table.items]
  pending.value = table.pendingCount()
})

onMounted(() => table.load())
onBeforeUnmount(() => {
  off()
  table.dispose()
})

const idr = (n: unknown) => Number(n ?? 0).toLocaleString('id-ID')

/** What the grid shows for a cell — the staged value when there is one. */
const shown = (row: BudgetRow, field: string) =>
  idr(table.cellValue(String(row.Id), field, (row as any)[field]))

const status = computed(() => {
  if (notice.value) return { tone: 'warn', text: notice.value }

  const r = result.value
  if (!r) return null

  const parts: string[] = []
  parts.push(
    r.changed
      ? `${r.changed} row(s) updated — review the highlighted cells, then Save.`
      : 'Every row matched, but no value differed — nothing to save. Change a number and import again.',
  )
  if (!r.ok) {
    parts.push(
      `${r.matched}/${r.total} rows matched · ${r.unmatched} unmatched · ${r.ambiguous} ambiguous.`,
    )
  }
  return { tone: r.ok && r.changed ? 'ok' : 'warn', text: parts.join(' ') }
})

async function runImport(options: Parameters<typeof table.import>[0]) {
  importing.value = true
  notice.value = ''
  result.value = null
  try {
    result.value = await table.import({
      ...options,
      match,
      columns,
      // Sheets carry summary lines; they must never be treated as data.
      rowFilter: (r) => {
        const activity = String(r['Activity'] ?? '').trim().toLowerCase()
        return !!activity && activity !== 'total:' && activity !== 'grand total:'
      },
      // NUFACE is locked this period — the sheet may contain it, but it can't be written.
      readOnly: (row) => (row.Brand === 'NUFACE' ? 'NUFACE is locked this period' : false),
    })
  } catch (err) {
    // Surface the failure instead of leaving the UI mid-flight. Reading a
    // workbook needs the optional `exceljs` peer, so this is where a missing
    // install shows up.
    notice.value = `Import failed: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    importing.value = false
  }
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Clear the picker only AFTER the bytes are read, and pass an ArrayBuffer
  // rather than the File — the input is reset so the same file can be chosen
  // twice in a row, and a cleared input must not affect an in-flight read.
  if (!file) return
  importing.value = true
  try {
    const buffer = await file.arrayBuffer()
    input.value = ''
    await runImport({ type: 'excel', data: buffer })
  } catch (err) {
    input.value = ''
    importing.value = false
    notice.value = `Could not read the file: ${err instanceof Error ? err.message : String(err)}`
  }
}

function importPaste() {
  if (!pasted.value.trim()) {
    notice.value = 'Nothing to import — paste some rows first (or press "Reset sample").'
    return
  }
  void runImport({ type: 'copy-paste', data: pasted.value })
}

/** Export the current grid so it can be edited in Excel and imported back. */
async function downloadTemplate() {
  exporting.value = true
  try {
    await table.export({
      md: `| CH. | Brand | Activity | JAN | FEB | MAR |
|-----|-------|----------|-----|-----|-----|
{{#each rows}}
| {{Channel}} | {{Brand}} | {{Activity}} | {{Jan}} | {{Feb}} | {{Mar}} |
{{/each}}
`,
      fileName: 'budget-template.xlsx',
      data: { rows: await table.getData() },
      freezeRows: 1,
    })
  } catch (err) {
    notice.value = `Export failed: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    exporting.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await table.saveChanges()
    result.value = null
    notice.value = ''
  } catch (err) {
    notice.value = `Save failed: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    saving.value = false
  }
}

function discard() {
  table.discardChanges()
  result.value = null
  notice.value = ''
}

/**
 * A realistic paste: one edited value, one row keyed only on Brand + Activity
 * (blank Channel), one locked brand, one row that doesn't exist here, and a
 * summary line — so every branch of the result is visible in one click.
 */
const sample = `CH.\tBrand\tActivity\tJAN\tFEB\tMAR
SHOPEE\tHANASUI\tCAMPAIGN\t15.000.000\t8.400.000\t9.100.000
\tMARINA\tENDORSE\t3.100.000\t2.500.000\t2.200.000
TIKTOK\tNUFACE\tCAMPAIGN\t1\t1\t1
LAZADA\tPUREGLOW\tCAMPAIGN\t500.000\t0\t0
TOTAL:\t\tTotal:\t18.100.000\t10.900.000\t11.300.000`

// Prefilled so "Import pasted" does something on the first click.
const pasted = ref(sample)

function resetSample() {
  pasted.value = sample
  notice.value = ''
}
</script>

<template>
  <mono-card bordered width="100%" class="example-imp-card">
    <div class="example-imp-toolbar">
      <strong class="example-imp-title">Budget</strong>

      <div class="example-imp-actions">
        <mono-button
          size="sm"
          variant="outline"
          color="secondary"
          :loading.prop="exporting"
          @click="downloadTemplate"
        >
          Download template
        </mono-button>

        <label class="example-imp-file" :class="{ 'example-is-busy': importing }">
          <input type="file" accept=".xlsx" :disabled="importing" @change="onFile" />
          <span>{{ importing ? 'Reading…' : 'Upload .xlsx' }}</span>
        </label>
      </div>
    </div>

    <p class="example-imp-hint">
      Press <strong>Import pasted</strong> to run the sample below — or download the template,
      edit it in Excel and upload it back. Imported cells are highlighted and stay
      <strong>unsaved</strong> until you press Save. An unedited sheet imports nothing, which
      is the point: only differences are staged.
    </p>

    <div class="example-imp-paste">
      <mono-textarea
        :model-value="pasted"
        rows="4"
        placeholder="Paste rows copied from Excel…"
        @input="pasted = $event.detail.modelValue"
      />

      <div class="example-imp-paste-actions">
        <mono-button size="xs" variant="outline" color="secondary" @click="resetSample">
          Reset sample
        </mono-button>
        <mono-button size="xs" color="primary" :loading.prop="importing" @click="importPaste">
          Import pasted
        </mono-button>
      </div>
    </div>

    <!--
      `v-show`, not `v-if`. `mono-card` renders into light DOM: it captures its
      children ONCE on connect and moves them into an internal slot target. A
      `v-if` here would make Vue insert a new node among siblings the card has
      already relocated, and the insert dies with "insertBefore, parent is null".
      Keeping the element mounted means the card captures it like everything
      else, and Vue only ever touches what's inside it.
    -->
    <div v-show="status" class="example-imp-status" :class="status ? `example-is-${status.tone}` : ''">
      {{ status?.text }}

      <ul v-if="result && (result.unmatchedRows.length || result.skippedRows.length)" class="example-imp-detail">
        <li v-for="(r, i) in result.unmatchedRows" :key="`u${i}`">
          No match: {{ r.row['Brand'] }} / {{ r.row['Activity'] }}
        </li>
        <li v-for="(r, i) in result.skippedRows" :key="`s${i}`">
          Skipped: {{ r.row['Brand'] }} — {{ r.reason }}
        </li>
      </ul>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>CH.</th>
            <th>Brand</th>
            <th>Activity</th>
            <th v-for="m in MONTHS" :key="m">{{ m.toUpperCase() }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Channel }}</td>
            <td>{{ row.Brand }}</td>
            <td>{{ row.Activity }}</td>
            <td
              v-for="m in MONTHS"
              :key="m"
              class="example-imp-num"
              :class="{
                'example-is-imported': table.isCellImported(String(row.Id), m),
                'example-is-dirty': table.isCellDirty(String(row.Id), m) && !table.isCellImported(String(row.Id), m),
              }"
            >
              {{ shown(row, m) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <span class="example-imp-pending">
        {{ pending ? `${pending} row(s) pending` : 'No pending changes' }}
      </span>

      <div class="example-imp-actions">
        <mono-button
          size="sm"
          variant="outline"
          color="secondary"
          :disabled.prop="!pending"
          @click="discard"
        >
          Discard
        </mono-button>
        <mono-button
          size="sm"
          color="success"
          :disabled.prop="!pending"
          :loading.prop="saving"
          @click="save"
        >
          Save
        </mono-button>
      </div>
    </div>
  </mono-card>
</template>

<style scoped>
.example-imp-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-imp-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-imp-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-imp-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-imp-hint {
  margin: 0;
  padding: 0 1rem 0.6rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.example-imp-file input {
  display: none;
}

.example-imp-file span {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.example-imp-file span:hover {
  background: var(--muted);
}

.example-imp-file.example-is-busy span {
  opacity: 0.6;
  cursor: progress;
}

.example-imp-paste {
  padding: 0 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.example-imp-paste-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

.example-imp-status {
  margin: 0 1rem 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
}

.example-imp-status.example-is-ok {
  color: var(--success);
  background: color-mix(in oklab, var(--success) 14%, var(--card));
}

.example-imp-status.example-is-warn {
  color: var(--warning);
  background: color-mix(in oklab, var(--warning) 14%, var(--card));
}

.example-imp-detail {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
}

.example-imp-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Imported vs. hand-edited: different tints, so a reviewer can tell them apart. */
.example-is-imported {
  background: color-mix(in oklab, var(--info) 14%, var(--card));
  font-weight: 600;
}

.example-is-dirty {
  background: color-mix(in oklab, var(--warning) 14%, var(--card));
  font-weight: 600;
}

.example-imp-pending {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}
</style>
