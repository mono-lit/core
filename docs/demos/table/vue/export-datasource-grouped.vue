<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import type { MonoGroupNode } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
  Gender: string
}

const ODATA_BASE = 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))'

// A single `group` field + a remote DataSource puts the grid into SERVER group
// mode: group keys and counts come from one cheap `$apply=groupby(…)` query, and
// each group's rows are fetched lazily as it's shown. That needs a service which
// supports `$apply` — TripPin does.
//
// The report counts rather than sums: TripPin has no populated numeric column
// (`Age` is null on every row). The `sum` + `currency` helpers are shown in the
// flat `export-datasource` demo instead.
const table = controlMonoTable<PersonRow>(null, {
  keyExpr: 'UserName',
  group: 'Gender',
  pageSize: 3,
  groupRowPageSize: 5,
})

const display = ref<Array<{ key: string; kind: string; label: string; detail: string }>>([])
const busy = ref(false)
const ready = ref(false)

const off = table.subscribe(() => {
  display.value = table.displayRows
    .filter((r) => r.kind !== 'footer')
    .map((r) => ({
      key: r.key,
      kind: r.kind,
      label:
        r.kind === 'group'
          ? String((r.node as MonoGroupNode<PersonRow>).key ?? '—')
          : `${(r.row as PersonRow)?.FirstName ?? ''} ${(r.row as PersonRow)?.LastName ?? ''}`.trim(),
      detail:
        r.kind === 'group'
          ? `${r.node?.count ?? 0} rows`
          : ((r.row as PersonRow)?.UserName ?? ''),
    }))
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: ODATA_BASE,
    url: '/People',
  }).response({
    options: {
      key: 'UserName',
      // Scalars only — TripPin 500s on a $select naming a collection property.
      select: ['UserName', 'FirstName', 'LastName', 'Gender'],
      paginate: true,
      pageSize: 10,
    },
  })

  table.bind(dataSource)
  await table.load()
  ready.value = true
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})

const template = `# People by gender

| Gender / Person | Username | Last name |
|-----------------|----------|-----------|
{{#each groups}}
| {{rowStyle "groupHeader"}}**{{key}}** ({{count}}) | | |
{{#each items}}
| {{FirstName}} {{LastName}} | {{UserName}} | {{LastName}} |
{{/each}}
{{/each}}
| {{rowStyle "total"}}**Grand total** | {{rows.length}} people | |
`

async function downloadExcel() {
  busy.value = true
  try {
    // The grid pages groups from the server, but a report wants everything.
    // `getData()` drains the source in chunks of 100 without disturbing the
    // grid, and `buildGroups()` reuses the `group: 'Gender'` field.
    const rows = await table.getData()

    await table.export({
      md: template,
      fileName: 'people-by-gender.xlsx',
      data: { rows, groups: await table.buildGroups(rows) },
      formatting: { locale: 'en-US', currency: 'USD' },
      styles: { groupHeader: { bg: '#DBEAFE' } },
      freezeRows: 2,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <mono-card bordered width="100%" class="example-ds-card">
    <div class="example-ds-toolbar">
      <strong class="example-ds-title">People by gender · server-grouped</strong>

      <mono-button
        size="sm"
        color="primary"
        :loading.prop="busy"
        :disabled="!ready"
        @click="downloadExcel"
      >
        Download .xlsx
      </mono-button>
    </div>

    <p class="example-ds-hint">
      Groups and counts come from the server; only the visible groups load their rows. The
      export still covers every gender and every row.
    </p>

    <div mono-table-scroll>
      <table mono-table>
        <caption><mono-table-loading :control-table.prop="table" /></caption>
        <thead>
          <tr>
            <th>Gender / Person</th>
            <th>Username</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in display" :key="row.key" :class="{ 'example-is-group': row.kind === 'group' }">
            <td>{{ row.label }}</td>
            <td>{{ row.detail }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-ds-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-ds-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-ds-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-ds-hint {
  margin: 0;
  padding: 0 1rem 0.6rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.example-is-group td {
  font-weight: 600;
  background: var(--muted);
}
</style>
