<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable, type MonoDisplayRow } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
  Gender: string
}

const rows = ref<MonoDisplayRow<PersonRow>[]>([])
const loading = ref(false)
let table: ReturnType<typeof controlMonoTable<PersonRow>>
let off: () => void

const fmt = (n: number): string => `${n || 0}`

onMounted(async () => {
  // Just fetch the DataSource and hand it to controlMonoTable. A single-field `group`
  // + a remote DataSource = automatic server-side group paging: the group list,
  // counts and subtotals come from one `$apply=groupby(…)`; each group's rows load
  // a page at a time. No loadGroups/loadRows, no tree walking.
  //
  // This needs a service that supports `$apply` — TripPin does. The summary is a
  // `count` rather than a `sum` because TripPin has no populated numeric column
  // (`Age` is null on every row, so a sum would render a truthful-looking 0).
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({ options: { key: 'UserName' } })

  table = controlMonoTable<PersonRow>(dataSource, {
    keyExpr: 'UserName',
    group: ['Gender'],
    pageSize: 3, // groups per page
    groupRowPageSize: 5, // rows per group page (fetched on demand)
    searchValue: ['UserName', 'FirstName', 'LastName'],
    // Scalars only — TripPin 500s on a $select naming a collection property.
    select: ['UserName', 'FirstName', 'LastName', 'Gender'],
    groupSummary: { UserName: 'count' },
  })

  off = table.subscribe(() => {
    rows.value = table.displayRows
    loading.value = table.loading
  })
  await table.load()
})

onBeforeUnmount(() => {
  off?.()
  table?.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">People — by Gender (server-paged)</strong>

      <div class="example-toolbar-right">
        <mono-button size="xs" variant="ghost" @click="table?.expandAllGroups()">Expand all</mono-button>
        <mono-button size="xs" variant="ghost" @click="table?.collapseAllGroups()">Collapse all</mono-button>
        <mono-table-search :control-table.prop="table" placeholder="Search username or name…" />
      </div>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th><mono-table-sort :control-table.prop="table" field="UserName">Username</mono-table-sort></th>
            <th><mono-table-sort :control-table.prop="table" field="FirstName">First name</mono-table-sort></th>
            <th>Last name</th>
            <th class="example-num">
              <mono-table-sort :control-table.prop="table" field="LastName">People</mono-table-sort>
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-for="item in rows" :key="item.key">
            <tr
              v-if="item.kind === 'group'"
              mono-group-row
              @click="table.toggleGroup(item.node!)"
            >
              <td colspan="3" mono-group-cell>
                <button
                  type="button"
                  mono-group-toggle
                  :data-collapsed="item.node!.collapsed ? '' : undefined"
                >
                  <span mono-group-caret aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                  <span mono-group-key>{{ item.node!.key || '—' }}</span>
                  <span mono-group-count>({{ item.node!.count }} people)</span>
                </button>
              </td>
              <td class="example-num example-subtotal">
                {{ fmt(Number(item.node!.meta?.aggregates?.UserName ?? 0)) }}
              </td>
            </tr>

            <tr v-else-if="item.kind === 'footer'" mono-group-foot-row>
              <td colspan="4" mono-group-foot>
                <mono-table-paging-group
                  :control-table.prop="table"
                  :group.prop="item.node!.path"
                  page-size="5"
                />
              </td>
            </tr>

            <tr v-else>
              <td class="example-doc">{{ item.row!.UserName }}</td>
              <td>{{ item.row!.FirstName }}</td>
              <td>
                <mono-chip size="xs" color="info" variant="soft">{{ item.row!.Gender }}</mono-chip>
                <span class="example-coa">{{ item.row!.LastName }}</span>
              </td>
              <td class="example-num"></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="!rows.length" mono-table-empty>
      <div mono-empty-title>{{ loading ? 'Loading…' : 'No programs found' }}</div>
      <div v-if="!loading" mono-empty-sub>Try a different search.</div>
    </div>

    <div mono-table-foot>
      <div class="example-footer-left">
        <mono-table-page-size :control-table.prop="table" :sizes.prop="[3, 5, 10, 'all']" label="Depts:" />
        <mono-table-info :control-table.prop="table" template="Showing {from}–{to} of {total} departments" />
      </div>
      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-card { --mono-card-padding: 0; width: 100%; overflow: hidden; }
.example-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; padding: 0.72rem 1rem; flex-wrap: wrap;
}
.example-toolbar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.example-title { font-size: 0.9rem; color: var(--foreground); }
.example-footer-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.example-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.example-subtotal { font-weight: var(--mono-font-weight-semibold); color: var(--foreground); }
.example-doc { white-space: nowrap; font-variant-numeric: tabular-nums; }
.example-coa { margin-left: 0.45rem; color: var(--muted-foreground); font-size: 0.78rem; }
@media (max-width: 640px) {
  .example-toolbar { align-items: stretch; }
  .example-toolbar-right mono-table-search { max-width: 100%; }
}
</style>
