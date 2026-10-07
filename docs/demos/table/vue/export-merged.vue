<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

type Production = {
  Id: number
  Year: string
  Half: string
  Quarter: string
  Month: string
  Units: number
  Rejects: number
}

const production: Production[] = [
  { Id: 1, Year: 'FY2026', Half: 'H1', Quarter: 'Q1', Month: 'Jan', Units: 48200, Rejects: 620 },
  { Id: 2, Year: 'FY2026', Half: 'H1', Quarter: 'Q1', Month: 'Feb', Units: 51600, Rejects: 540 },
  { Id: 3, Year: 'FY2026', Half: 'H1', Quarter: 'Q1', Month: 'Mar', Units: 55100, Rejects: 700 },
  { Id: 4, Year: 'FY2026', Half: 'H1', Quarter: 'Q2', Month: 'Apr', Units: 49800, Rejects: 810 },
  { Id: 5, Year: 'FY2026', Half: 'H1', Quarter: 'Q2', Month: 'May', Units: 57300, Rejects: 460 },
  { Id: 6, Year: 'FY2026', Half: 'H1', Quarter: 'Q2', Month: 'Jun', Units: 60250, Rejects: 520 },
  { Id: 7, Year: 'FY2026', Half: 'H2', Quarter: 'Q3', Month: 'Jul', Units: 58900, Rejects: 930 },
  { Id: 8, Year: 'FY2026', Half: 'H2', Quarter: 'Q3', Month: 'Aug', Units: 61400, Rejects: 380 },
  { Id: 9, Year: 'FY2026', Half: 'H2', Quarter: 'Q3', Month: 'Sep', Units: 63750, Rejects: 610 },
  { Id: 10, Year: 'FY2026', Half: 'H2', Quarter: 'Q4', Month: 'Oct', Units: 66200, Rejects: 720 },
  { Id: 11, Year: 'FY2026', Half: 'H2', Quarter: 'Q4', Month: 'Nov', Units: 64800, Rejects: 1150 },
  { Id: 12, Year: 'FY2026', Half: 'H2', Quarter: 'Q4', Month: 'Dec', Units: 69950, Rejects: 470 },
]

/** One printable line of the report — a month, or a half-year subtotal. */
type ReportRow = {
  key: string
  Year: string
  Half: string
  Quarter: string
  Month: string
  /** Set only on the row where that band STARTS — its value is the rowspan. */
  yearSpan?: number
  halfSpan?: number
  quarterSpan?: number
  /** Subtotal rows replace Quarter + Month with one merged label. */
  subtotal?: boolean
  label?: string
  Units: number
  Rejects: number
  Yield: number
}

const yieldOf = (units: number, rejects: number) => units / (units + rejects)

/** Stable, insertion-ordered grouping — no sorting, the data is already in order. */
function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const row of rows) {
    const k = key(row)
    const bucket = out.get(k)
    if (bucket) bucket.push(row)
    else out.set(k, [row])
  }
  return out
}

/**
 * Turn flat grid rows into the report's *layout*: each row carries the rowspan
 * of every band that starts on it. The spans are arithmetic, not guesswork —
 * a half owns its 6 months **plus** its own subtotal row, and the year owns
 * everything, so the three bands nest instead of overlapping.
 */
function buildReport(rows: Production[]): ReportRow[] {
  const out: ReportRow[] = []
  const halves = groupBy(rows, (r) => r.Half)
  const yearSpan = rows.length + halves.size // 12 months + one subtotal per half
  let firstOfYear = true

  for (const [half, halfRows] of halves) {
    let firstOfHalf = true

    for (const [quarter, quarterRows] of groupBy(halfRows, (r) => r.Quarter)) {
      quarterRows.forEach((r, index) => {
        out.push({
          key: r.Month,
          Year: r.Year,
          Half: half,
          Quarter: quarter,
          Month: r.Month,
          ...(firstOfYear ? { yearSpan } : {}),
          ...(firstOfHalf ? { halfSpan: halfRows.length + 1 } : {}),
          ...(index === 0 ? { quarterSpan: quarterRows.length } : {}),
          Units: r.Units,
          Rejects: r.Rejects,
          Yield: yieldOf(r.Units, r.Rejects),
        })
        firstOfYear = false
        firstOfHalf = false
      })
    }

    const units = halfRows.reduce((t, r) => t + r.Units, 0)
    const rejects = halfRows.reduce((t, r) => t + r.Rejects, 0)
    out.push({
      key: `${half}-subtotal`,
      Year: '',
      Half: half,
      Quarter: '',
      Month: '',
      subtotal: true,
      label: `${half} subtotal`,
      Units: units,
      Rejects: rejects,
      Yield: yieldOf(units, rejects),
    })
  }

  return out
}

// Everything that makes this layout awkward, in one template:
//
//   · a two-level header — `{{merge cols=3}}` and `{{merge cols=2}}` group the
//     columns on row 1, `{{merge rows=2}}` drops the single-level ones through
//     both header rows;
//   · three NESTED vertical bands — year (14 rows) ⊃ half (7) ⊃ quarter (3),
//     each printed only on the row it starts on;
//   · a subtotal row whose merge starts mid-row (column C, not column A),
//     because columns A and B are still inside the bands above it;
//   · a grand total spanning the first four columns — it sits just past the end
//     of the year band, so nothing collides.
//
// A cell that a merge swallows is simply left empty (`| |`) — the pipes still
// have to be there, exactly like a real `rowspan` leaves no `<td>` behind.
const template = `# {{plant}} · production {{fiscalYear}}

{{style "note"}}Output by month, banded year → half → quarter.

| {{merge cols=3}}Period | | | {{merge rows=2}}Month | {{merge cols=2}}Output (pcs) | | {{merge rows=2}}Yield |
|---|---|---|---|---|---|---|
| {{rowStyle "header"}}Year | Half | Quarter | | Good | Rejects | |
{{#each report}}
{{#if subtotal}}
| | | {{rowStyle "subtotal"}}{{merge cols=2}}{{label}} | | {{number Units}} | {{number Rejects}} | {{percent Yield}} |
{{else}}
| {{#if yearSpan}}{{style "band"}}{{merge rows=yearSpan}}{{Year}}{{/if}} | {{#if halfSpan}}{{style "band"}}{{merge rows=halfSpan}}{{Half}}{{/if}} | {{#if quarterSpan}}{{style "band"}}{{merge rows=quarterSpan}}{{Quarter}}{{/if}} | {{Month}} | {{number Units}} | {{number Rejects}} | {{percent Yield}} |
{{/if}}
{{/each}}
| {{rowStyle "total"}}{{merge cols=4}}**{{fiscalYear}} — all lines** | | | | {{number totals.units}} | {{number totals.rejects}} | {{percent totals.yield}} |

## Shift sign-off

| {{merge cols=2 rows=3}}{{style "band"}}QC seal | | Shift | Inspector | Verdict |
|---|---|---|---|---|
| | | Morning | Ratna P. | {{style "success"}}Pass |
| | | Swing | Bagus H. | {{style "danger"}}Hold |
| {{merge cols=3}}{{style "note"}}Night shift folded into swing (line stop) | | | Iwan S. | {{style "success"}}Pass |
`

const table = controlMonoTable<Production>(production, { pageSize: 12, keyExpr: 'Id' })

const report = ref<ReportRow[]>([])
const busy = ref(false)

const totals = {
  units: production.reduce((t, r) => t + r.Units, 0),
  rejects: production.reduce((t, r) => t + r.Rejects, 0),
  yield: 0,
}
totals.yield = yieldOf(totals.units, totals.rejects)

onMounted(async () => {
  await table.load()
  // The preview below is built from the grid's own rows, exactly like the export.
  report.value = buildReport(await table.getData())
})
onBeforeUnmount(() => table.dispose())

async function downloadExcel() {
  busy.value = true
  try {
    const rows = await table.getData()

    await table.export({
      md: template,
      fileName: 'production-banded.xlsx',
      data: {
        report: buildReport(rows),
        totals,
        plant: 'Plant Cikarang 2',
        fiscalYear: 'FY2026',
      },
      formatting: { locale: 'id-ID', percentFormat: '0.0%' },
      styles: {
        header: { bg: '#0F172A', color: '#FFFFFF' },
        // Vertically merged cells only look right with a middle valign.
        band: {
          bold: true,
          bg: '#EEF2FF',
          color: '#3730A3',
          align: 'center',
          valign: 'middle',
          border: 'all',
        },
        subtotal: { bold: true, bg: '#FEF3C7', border: 'top' },
        total: { bold: true, bg: '#0F172A', color: '#FFFFFF' },
      },
      columns: [{ width: 10 }, { width: 8 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 10 }],
      sheetName: 'Production',
      freezeRows: 4,
    })
  } finally {
    busy.value = false
  }
}

const n = (value: number) => value.toLocaleString('id-ID')
const pct = (value: number) => `${(value * 100).toFixed(1)}%`
</script>

<template>
  <mono-card bordered width="100%" class="example-report-card">
    <div class="example-report-toolbar">
      <strong class="example-report-title">Production · banded report</strong>

      <mono-button size="sm" color="primary" :loading.prop="busy" @click="downloadExcel">
        Download .xlsx
      </mono-button>
    </div>

    <p class="example-report-hint">
      The preview mirrors the workbook cell for cell — every <code>rowspan</code> /
      <code>colspan</code> below is one <code>merge</code> directive in the template.
    </p>

    <div mono-table-scroll>
      <table mono-table class="example-merged-table">
        <thead>
          <tr>
            <th colspan="3">Period</th>
            <th rowspan="2">Month</th>
            <th colspan="2">Output (pcs)</th>
            <th rowspan="2">Yield</th>
          </tr>
          <tr>
            <th>Year</th>
            <th>Half</th>
            <th>Quarter</th>
            <th>Good</th>
            <th>Rejects</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in report" :key="row.key" :class="{ 'example-is-subtotal': row.subtotal }">
            <td v-if="row.yearSpan" :rowspan="row.yearSpan" class="example-band">{{ row.Year }}</td>
            <td v-if="row.halfSpan" :rowspan="row.halfSpan" class="example-band">{{ row.Half }}</td>
            <td v-if="row.quarterSpan" :rowspan="row.quarterSpan" class="example-band">{{ row.Quarter }}</td>

            <td v-if="row.subtotal" colspan="2" class="example-subtotal-label">{{ row.label }}</td>
            <td v-else>{{ row.Month }}</td>

            <td class="example-num">{{ n(row.Units) }}</td>
            <td class="example-num">{{ n(row.Rejects) }}</td>
            <td class="example-num">{{ pct(row.Yield) }}</td>
          </tr>

          <tr class="example-is-total">
            <td colspan="4">FY2026 — all lines</td>
            <td class="example-num">{{ n(totals.units) }}</td>
            <td class="example-num">{{ n(totals.rejects) }}</td>
            <td class="example-num">{{ pct(totals.yield) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </mono-card>
</template>

<style scoped>
.example-report-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-report-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-report-hint {
  margin: 0;
  padding: 0 1rem 0.6rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.example-merged-table th {
  text-align: center;
}

.example-merged-table .example-band {
  font-weight: 600;
  text-align: center;
  vertical-align: middle;
  color: var(--primary);
  background: color-mix(in oklab, var(--primary) 12%, var(--card));
}

.example-merged-table .example-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.example-is-subtotal td {
  font-weight: 600;
  background: color-mix(in oklab, var(--warning) 14%, var(--card));
}

.example-subtotal-label {
  font-weight: 600;
}

.example-is-total td {
  font-weight: 700;
  color: var(--primary-foreground);
  background: var(--primary);
}
</style>
