<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type PersonRow = {
  UserName: string
  FirstName: string
  LastName: string
  Gender: string
}

// A remote OData DataSource — every sort / search / page / reload is a real
// network round-trip, so the <mono-table-loading> overlay is clearly visible
// while the request is in flight (and the grid height stays put instead of
// collapsing when the rows briefly clear).
const table = controlMonoTable<PersonRow>(null, {
  keyExpr: 'UserName',
  searchValue: ['UserName', 'FirstName', 'LastName'],
})

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
      pageSize: 8,
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
      <mono-table-search :control-table.prop="table" placeholder="Search username or name…" />

      <mono-button size="sm" variant="outline" color="secondary" @click="table.reload()">
        Reload
      </mono-button>
    </div>

    <!-- Keep the table mounted while loading (rows.length || loading) so the
         frozen region stays visible; the overlay lives INSIDE the <table>. -->
    <div mono-table-scroll>
      <table mono-table>
        <caption><mono-table-loading :control-table.prop="table" /></caption>

        <thead>
          <tr>
            <th>Username</th>
            <th>
              <mono-table-th :control-table.prop="table" field="Gender" caption="Gender" sort>Gender</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="table" field="LastName" caption="Name" :sort.prop="{ order: 'asc' }">Name</mono-table-th>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.UserName">
            <td>{{ row.UserName }}</td>
            <td>
              <mono-chip size="xs" color="primary" variant="soft">{{ row.Gender }}</mono-chip>
            </td>
            <td>{{ row.FirstName }} {{ row.LastName }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="!rows.length && !loading" mono-table-empty>
      <div mono-empty-title>No people found</div>
      <div mono-empty-sub>Try a different search.</div>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
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

@media (max-width: 640px) {
  .example-toolbar {
    align-items: stretch;
  }

  .example-toolbar mono-table-search {
    max-width: 100%;
  }
}
</style>
