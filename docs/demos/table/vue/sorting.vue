<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
  Gender: string
}

// The form the grid writes its props snapshot into — drives the header loop.
const state = ref<Record<string, any>>({})

// The gestures are fixed — there is nothing to pick:
//   left-click the arrow  → SINGLE key, asc → desc → none (replaces the sort)
//   right-click a header  → Sort › Ascending / Descending / Clear / Clear all,
//                           and THAT is what accumulates keys
// `showIcon` only decides whether the arrow or the caption is the single-sort
// trigger; `noClear` drops the "none" step (and the submenu's Clear row).
const showIcon = ref(true)
const noClear = ref(false)

const table = controlMonoTable<PersonRow>(null, {
  keyExpr: 'UserName',
  searchValue: ['UserName', 'FirstName', 'LastName'],
  state,
  props: {
    // A `sort` on the column is what makes its header sortable. Clicking arrows
    // only ever leaves one key; to sort by two, right-click Username → Sort › Descending,
    // then right-click Name → Sort › Ascending — the <sup> badges then show which
    // key wins. Any arrow click collapses it back to a single key.
    th: [
      { field: 'UserName', caption: 'Username', sort: true },
      { field: 'Gender', caption: 'Gender', sort: true, },
      // `order` seeds the initial direction.
      { field: 'LastName', caption: 'Name', sort: { order: 'asc' } },
    ],
    search: { placeholder: 'Search username or name…' },
  },
})

/** Re-write every column's `sort` from the pickers, then re-push to the elements. */
function applySort(): void {
  for (const col of table.props().th ?? []) {
    col.sort = { ...col.sort, showIcon: showIcon.value, noClear: noClear.value }
  }
  // Nudge the controller so it re-applies props to the header cells. `reload()`
  // rather than `setSort(null)` — changing the affordance shouldn't wipe the sort
  // you already applied.
  void table.reload()
}

const rows = ref<PersonRow[]>([])
const loading = ref(false)

const off = table.subscribe(() => {
  rows.value = [...table.items]
  loading.value = table.loading
})

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))',
    url: '/People',
  }).response({
    options: {
      key: 'UserName',
      select: ['UserName', 'FirstName', 'LastName', 'Gender'],
      paginate: true,
      pageSize: 10,
    },
  })

  table.bind(dataSource)
  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">People</strong>

      <mono-table-search :control-table.prop="table" />
    </div>

    <DemoControls class="example-picker" gap="0">
      <DemoCheck v-model="showIcon" label="showIcon" data-show-icon @update:model-value="applySort" />
      <DemoCheck v-model="noClear" label="noClear" data-no-clear @update:model-value="applySort" />
      <span>
        {{ showIcon ? 'Click an arrow' : 'Click a caption' }} to sort by one column
        — right-click a header → Sort › to combine two.
      </span>
    </DemoControls>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <!-- Looped by hand from state.th — captions and sort config come
                 from the controller, so each cell needs only its field. -->
            <th v-for="c in state.th" :key="c.field">
              <mono-table-th :control-table.prop="table" :field="c.field" />
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.UserName">
            <td>{{ row.UserName }}</td>

            <td>
              <mono-chip size="xs" color="primary" variant="soft">
                {{ row.Gender }}
              </mono-chip>
            </td>

            <td>{{ row.FirstName }} {{ row.LastName }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!rows.length" mono-table-empty>
      <div mono-empty-title>
        {{ loading ? 'Loading…' : 'No people found' }}
      </div>

      <div v-if="!loading" mono-empty-sub>
        Try a different search.
      </div>
    </div>

    <div mono-table-foot>
      <div class="example-footer-left">
        <mono-table-page-size :control-table.prop="table" label="Rows:" />
        <mono-table-info :control-table.prop="table" />
      </div>

      <mono-table-paging :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

/* The row sits inside the card: pad it like the toolbar, no outer gap. */
.example-picker {
  padding: 0 1rem 0.72rem;
}

.example-footer-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .example-toolbar {
    align-items: stretch;
  }

  .example-toolbar mono-table-search {
    max-width: 100%;
  }
}
</style>
